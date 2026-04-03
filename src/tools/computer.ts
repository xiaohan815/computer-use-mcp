import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {
	mouse,
	keyboard,
	Point,
	screen,
	Button,
	imageToJimp,
} from '@nut-tree-fork/nut-js';
import {execFileSync} from 'node:child_process';
import {readFileSync, unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout} from 'node:timers/promises';
import Jimp from 'jimp';
import sharp from 'sharp';
import {toKeys} from '../xdotoolStringToKeys.js';
import {jsonResult} from '../utils/response.js';

/**
 * Grab the screen, falling back to the macOS `screencapture` CLI if nut-js fails
 * (e.g. on macOS 26+ where CGDisplayCreateImageForRect was removed).
 */
async function grabScreen(): Promise<ReturnType<typeof imageToJimp>> {
	try {
		return imageToJimp(await screen.grab());
	} catch {
		// Fallback: use screencapture CLI (macOS only)
		const tmpPath = join(tmpdir(), `computer-use-mcp-${Date.now()}.png`);
		try {
			execFileSync('screencapture', ['-x', tmpPath]);
			const buffer = readFileSync(tmpPath);
			return (await Jimp.read(buffer)) as unknown as ReturnType<typeof imageToJimp>;
		} finally {
			try {
				unlinkSync(tmpPath);
			} catch {
				/* ignore cleanup errors */
			}
		}
	}
}

// Configure nut-js
mouse.config.autoDelayMs = 100;
mouse.config.mouseSpeed = 1000;
keyboard.config.autoDelayMs = 10;

/**
 * Check if xdotool is available on this system.
 * Cached after first check.
 */
let xdotoolAvailable: boolean | undefined;
function hasXdotool(): boolean {
	if (xdotoolAvailable === undefined) {
		try {
			execFileSync('which', ['xdotool'], {stdio: 'ignore'});
			xdotoolAvailable = true;
		} catch {
			xdotoolAvailable = false;
		}
	}

	return xdotoolAvailable;
}

/**
 * Type text using xdotool, which correctly respects the X11 keyboard layout.
 *
 * nut-js's keyboard.type() uses libnut's typeString which maps characters to
 * X keycodes using a hardcoded US QWERTY lookup. This breaks when the X server's
 * keyboard layout differs, causing characters like : and ; to be swapped.
 * xdotool type uses XSendEvent with proper keymap lookups, so it works regardless
 * of the active keyboard layout.
 */
function xdotoolType(text: string): void {
	execFileSync('xdotool', [
		'type',
		'--clearmodifiers',
		'--delay',
		String(keyboard.config.autoDelayMs),
		'--',
		text,
	], {
		env: {...process.env, DISPLAY: process.env.DISPLAY || ':1'},
	});
}

// The Claude API automatically downsamples images larger than ~1.15MP or 1568px on the long edge.
// We already downsampled screenshots to fit these limits and reported the original screen
// dimensions via display_width_px/display_height_px, but Claude wasn't correctly using those
// reported dimensions - it was using coordinates from the downsampled image space directly.
// As a workaround, we now report the actual image dimensions and scale Claude's coordinates
// back up to logical screen coordinates.
// See: https://docs.anthropic.com/en/docs/build-with-claude/vision#evaluate-image-size
const maxLongEdge = 1568;
const maxPixels = 1.15 * 1024 * 1024; // 1.15 megapixels

/**
 * Calculate the scale factor to downsample an image to fit API limits.
 * Returns a value <= 1 representing how much to shrink the image.
 */
function getSizeToApiScale(width: number, height: number): number {
	const longEdge = Math.max(width, height);
	const totalPixels = width * height;

	const longEdgeScale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
	const pixelScale = totalPixels > maxPixels ? Math.sqrt(maxPixels / totalPixels) : 1;

	return Math.min(longEdgeScale, pixelScale);
}

/**
 * Get the scale factor from API image coordinates to logical screen coordinates.
 * This is the inverse of the downsampling we apply to fit API limits.
 */
async function getApiToLogicalScale(): Promise<number> {
	const logicalWidth = await screen.width();
	const logicalHeight = await screen.height();
	const apiScaleFactor = getSizeToApiScale(logicalWidth, logicalHeight);
	return 1 / apiScaleFactor;
}

// Define the action enum values
const ActionEnum = z.enum([
	'key',
	'type',
	'mouse_move',
	'left_click',
	'left_click_drag',
	'right_click',
	'middle_click',
	'double_click',
	'triple_click',
	'scroll',
	'get_screenshot',
	'get_cursor_position',
	'open_application',
	'wait',
	'read_clipboard',
	'write_clipboard',
	'zoom',
	'hold_key',
	'left_mouse_down',
	'left_mouse_up',
]);

const actionDescription = `The action to perform. The available actions are:
* key: Press a key or key-combination on the keyboard.
* type: Type a string of text on the keyboard.
* get_cursor_position: Get the current (x, y) pixel coordinate of the cursor on the screen.
* mouse_move: Move the cursor to a specified (x, y) pixel coordinate on the screen.
* left_click: Click the left mouse button. If coordinate is provided, moves to that position first.
* left_click_drag: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
* right_click: Click the right mouse button. If coordinate is provided, moves to that position first.
* middle_click: Click the middle mouse button. If coordinate is provided, moves to that position first.
* double_click: Double-click the left mouse button. If coordinate is provided, moves to that position first.
* triple_click: Triple-click the left mouse button to select a paragraph. If coordinate is provided, moves to that position first.
* scroll: Scroll the screen in a specified direction. Requires coordinate (moves there first) and text parameter with direction: "up", "down", "left", or "right". Optionally append ":N" to scroll N pixels (default 300), e.g. "down:500".
* get_screenshot: Take a screenshot of the screen.
* open_application: Open or bring an application to the foreground. Requires text parameter with the application name (e.g. "WeChat", "Safari", "Terminal"). On macOS, uses the 'open -a' command. On Linux, uses 'wmctrl' or 'xdotool'. On Windows, uses PowerShell.
* wait: Wait for a specified duration in seconds. Requires text parameter with duration (e.g. "2" for 2 seconds, "0.5" for 500ms). Useful for waiting for applications to load or animations to complete.
* read_clipboard: Read the current text content from the system clipboard.
* write_clipboard: Write text to the system clipboard. Requires text parameter with the content to write.
* zoom: Capture and zoom into a specific region of the screen. Requires coordinate parameter with [x, y, width, height]. The region will be enlarged to fit API limits for better detail visibility.
* hold_key: Hold down a key for a specified duration. Requires text parameter in format "key:duration" (e.g. "shift:2" to hold Shift for 2 seconds). Duration defaults to 1 second if not specified.
* left_mouse_down: Press and hold the left mouse button without releasing. Useful for fine-grained drag control.
* left_mouse_up: Release the left mouse button. Used in combination with left_mouse_down for precise drag operations.`;

const toolDescription = `Use a mouse and keyboard to interact with a computer, and take screenshots.
* This is an interface to a desktop GUI. You do not have access to a terminal or applications menu. You must click on desktop icons to start applications.
* Always prefer using keyboard shortcuts rather than clicking, where possible.
* If you see boxes with two letters in them, typing these letters will click that element. Use this instead of other shortcuts or clicking, where possible.
* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions. E.g. if you click on Firefox and a window doesn't open, try taking another screenshot.
* Whenever you intend to move the cursor to click on an element like an icon, you should consult a screenshot to determine the coordinates of the element before moving the cursor.
* If you tried clicking on a program or link but it failed to load, even after waiting, try adjusting your cursor position so that the tip of the cursor visually falls on the element that you want to click.
* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked.

Using the crosshair:
* Screenshots show a red crosshair at the current cursor position.
* After clicking, check where the crosshair appears vs your target. If it missed, adjust coordinates proportionally to the distance - start with large adjustments and refine. Avoid small incremental changes when the crosshair is far from the target (distances are often further than you expect).
* Consider display dimensions when estimating positions. E.g. if it's 90% to the bottom of the screen, the coordinates should reflect this.`;

const coordinateSchema = z
	.array(z.number())
	.describe('(x, y) for most actions: The x (pixels from the left edge) and y (pixels from the top edge) coordinates. For zoom action: [x, y, width, height] to specify the region to zoom into.');

export function registerComputer(server: McpServer): void {
	server.registerTool(
		'computer',
		{
			title: 'Computer Control',
			description: toolDescription,
			inputSchema: z.object({
				action: ActionEnum.describe(actionDescription),
				coordinate: coordinateSchema.optional(),
				text: z.string().optional().describe('Text to type or key command to execute'),
			}).strict(),
			// Note: No outputSchema because this tool returns varying content types including images
			annotations: {
				readOnlyHint: false,
			},
		},
		async (args) => {
			const {action, coordinate, text} = args as {action: z.infer<typeof ActionEnum>; coordinate?: number[]; text?: string};

			// Scale coordinates from API image space to logical screen space
			let scaledCoordinate: [number, number] | undefined;
			if (coordinate && action !== 'zoom') {
				// For zoom, we handle coordinates differently (4 values instead of 2)
				if (coordinate.length !== 2) {
					throw new Error('Coordinate must be [x, y] for this action');
				}

				const coord = coordinate as [number, number];
				const [x, y] = coord;
				const scale = await getApiToLogicalScale();
				scaledCoordinate = [
					Math.round(x * scale),
					Math.round(y * scale),
				];

				// Debug logging
				console.error(`[DEBUG] Action: ${action}`);
				console.error(`[DEBUG] Original coordinate: [${x}, ${y}]`);
				console.error(`[DEBUG] Scale factor: ${scale}`);
				console.error(`[DEBUG] Scaled coordinate: [${scaledCoordinate[0]}, ${scaledCoordinate[1]}]`);

				// Validate coordinates are within display bounds
				const [scaledX, scaledY] = scaledCoordinate;
				const [width, height] = [await screen.width(), await screen.height()];
				console.error(`[DEBUG] Screen size: ${width}x${height}`);
				if (scaledX < 0 || scaledX >= width || scaledY < 0 || scaledY >= height) {
					throw new Error(`Coordinates (${scaledX}, ${scaledY}) are outside display bounds of ${width}x${height}`);
				}
			}

			// Implement system actions using nut-js
			switch (action) {
				case 'key': {
					if (!text) {
						throw new Error('Text required for key');
					}

					const keys = toKeys(text);
					await keyboard.pressKey(...keys);
					await keyboard.releaseKey(...keys);

					return jsonResult({ok: true});
				}

				case 'type': {
					if (!text) {
						throw new Error('Text required for type');
					}

					if (process.platform === 'linux' && hasXdotool()) {
						xdotoolType(text);
					} else {
						await keyboard.type(text);
					}

					return jsonResult({ok: true});
				}

				case 'get_cursor_position': {
					const pos = await mouse.getPosition();
					const scale = await getApiToLogicalScale();
					// Return coordinates in API image space (scaled down from logical)
					// so Claude can correlate with what it sees in screenshots
					return jsonResult({
						x: Math.round(pos.x / scale),
						y: Math.round(pos.y / scale),
					});
				}

				case 'mouse_move': {
					if (!scaledCoordinate) {
						throw new Error('Coordinate required for mouse_move');
					}

					await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
					// Wait 50ms for the mouse position to settle (same as Claude Code's MOVE_SETTLE_MS)
					// This prevents triggering hover states and ensures the position is registered
					await setTimeout(50);
					return jsonResult({ok: true});
				}

				case 'left_click': {
					if (scaledCoordinate) {
						await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
						// Wait 50ms for the mouse position to settle before clicking
						await setTimeout(50);
					}

					await mouse.leftClick();
					return jsonResult({ok: true});
				}

				case 'left_click_drag': {
					if (!scaledCoordinate) {
						throw new Error('Coordinate required for left_click_drag');
					}

					await mouse.pressButton(Button.LEFT);
					await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
					await mouse.releaseButton(Button.LEFT);
					return jsonResult({ok: true});
				}

				case 'right_click': {
					if (scaledCoordinate) {
						await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
						await setTimeout(50);
					}

					await mouse.rightClick();
					return jsonResult({ok: true});
				}

				case 'middle_click': {
					if (scaledCoordinate) {
						await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
						await setTimeout(50);
					}

					await mouse.click(Button.MIDDLE);
					return jsonResult({ok: true});
				}

				case 'double_click': {
					if (scaledCoordinate) {
						await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
						await setTimeout(50);
					}

					await mouse.doubleClick(Button.LEFT);
					return jsonResult({ok: true});
				}

				case 'scroll': {
					if (!scaledCoordinate) {
						throw new Error('Coordinate required for scroll');
					}

					if (!text) {
						throw new Error('Text required for scroll (direction like "up", "down:5")');
					}

					// Parse direction and optional amount from text (e.g. "down" or "down:5")
					const parts = text.split(':');
					const direction = parts[0];
					const amountStr = parts[1];
					const amount = amountStr ? parseInt(amountStr, 10) : 300;

					if (!direction) {
						throw new Error('Scroll direction required');
					}

					if (amountStr !== undefined && (isNaN(amount) || amount <= 0)) {
						throw new Error(`Invalid scroll amount: ${amountStr}`);
					}

					// Move to position first and wait for settle
					await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
					await setTimeout(50);

					// Scroll in the specified direction
					switch (direction.toLowerCase()) {
						case 'up':
							await mouse.scrollUp(amount);
							break;
						case 'down':
							await mouse.scrollDown(amount);
							break;
						case 'left':
							await mouse.scrollLeft(amount);
							break;
						case 'right':
							await mouse.scrollRight(amount);
							break;
						default:
							throw new Error(`Invalid scroll direction: ${direction}. Use "up", "down", "left", or "right"`);
					}

					return jsonResult({ok: true});
				}

				case 'open_application': {
					if (!text) {
						throw new Error('Text required for open_application (application name)');
					}

					console.error(`[DEBUG] Opening application: ${text}`);

					if (process.platform === 'darwin') {
						// macOS: use 'open -a' command (verified to work)
						try {
							execFileSync('open', ['-a', text], {stdio: 'pipe'});
							// Wait for the app to open/activate
							await setTimeout(500);
							console.error(`[DEBUG] Application opened successfully: ${text}`);
							return jsonResult({ok: true, platform: 'darwin'});
						} catch (error: unknown) {
							const errorMsg = error instanceof Error ? error.message : String(error);
							console.error(`[DEBUG] Failed to open application: ${errorMsg}`);
							throw new Error(`Failed to open application "${text}": ${errorMsg}`);
						}
					} else if (process.platform === 'linux') {
						// Linux: try wmctrl first, fallback to xdotool
						try {
							// Try wmctrl first (more reliable for activation)
							try {
								execFileSync('wmctrl', ['-a', text], {stdio: 'pipe'});
								await setTimeout(500);
								console.error(`[DEBUG] Application opened via wmctrl: ${text}`);
								return jsonResult({ok: true, platform: 'linux', method: 'wmctrl'});
							} catch {
								// Fallback to xdotool
								execFileSync('xdotool', ['search', '--name', text, 'windowactivate'], {
									stdio: 'pipe',
									env: {...process.env, DISPLAY: process.env.DISPLAY || ':0'},
								});
								await setTimeout(500);
								console.error(`[DEBUG] Application opened via xdotool: ${text}`);
								return jsonResult({ok: true, platform: 'linux', method: 'xdotool'});
							}
						} catch (error: unknown) {
							const errorMsg = error instanceof Error ? error.message : String(error);
							console.error(`[DEBUG] Failed to open application: ${errorMsg}`);
							throw new Error(`Failed to open application "${text}". Make sure wmctrl or xdotool is installed: ${errorMsg}`);
						}
					} else if (process.platform === 'win32') {
						// Windows: use PowerShell AppActivate
						try {
							execFileSync('powershell', [
								'-NoProfile',
								'-NonInteractive',
								'-Command',
								`$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate('${text.replace(/'/g, "''")}')`,
							], {stdio: 'pipe'});
							await setTimeout(500);
							console.error(`[DEBUG] Application opened via PowerShell: ${text}`);
							return jsonResult({ok: true, platform: 'win32'});
						} catch (error: unknown) {
							const errorMsg = error instanceof Error ? error.message : String(error);
							console.error(`[DEBUG] Failed to open application: ${errorMsg}`);
							throw new Error(`Failed to open application "${text}": ${errorMsg}`);
						}
					} else {
						throw new Error(`open_application is not supported on platform: ${process.platform}`);
					}
				}

				case 'triple_click': {
					if (scaledCoordinate) {
						await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
						await setTimeout(50);
					}

					// Triple-click to select paragraph (click 3 times)
					await mouse.leftClick();
					await mouse.leftClick();
					await mouse.leftClick();
					return jsonResult({ok: true});
				}

				case 'wait': {
					if (!text) {
						throw new Error('Text required for wait (duration in seconds)');
					}

					const duration = parseFloat(text);
					if (isNaN(duration) || duration <= 0) {
						throw new Error(`Invalid duration: ${text}. Must be a positive number.`);
					}

					console.error(`[DEBUG] Waiting for ${duration} seconds`);
					await setTimeout(duration * 1000);
					return jsonResult({ok: true, duration});
				}

				case 'read_clipboard': {
					console.error('[DEBUG] Reading clipboard');
					try {
						let clipboardText: string;

						if (process.platform === 'darwin') {
							// macOS: use pbpaste
							clipboardText = execFileSync('pbpaste', [], {encoding: 'utf8'});
						} else if (process.platform === 'linux') {
							// Linux: use xclip
							clipboardText = execFileSync('xclip', ['-selection', 'clipboard', '-o'], {
								encoding: 'utf8',
								env: {...process.env, DISPLAY: process.env.DISPLAY || ':0'},
							});
						} else if (process.platform === 'win32') {
							// Windows: use PowerShell Get-Clipboard
							clipboardText = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard'], {
								encoding: 'utf8',
							});
						} else {
							throw new Error(`read_clipboard is not supported on platform: ${process.platform}`);
						}

						console.error(`[DEBUG] Clipboard content length: ${clipboardText.length} characters`);
						return jsonResult({text: clipboardText});
					} catch (error: unknown) {
						const errorMsg = error instanceof Error ? error.message : String(error);
						console.error(`[DEBUG] Failed to read clipboard: ${errorMsg}`);
						throw new Error(`Failed to read clipboard: ${errorMsg}`);
					}
				}

				case 'write_clipboard': {
					if (!text) {
						throw new Error('Text required for write_clipboard');
					}

					console.error(`[DEBUG] Writing to clipboard (${text.length} characters)`);
					try {
						if (process.platform === 'darwin') {
							// macOS: use pbcopy
							execFileSync('pbcopy', [], {input: text});
						} else if (process.platform === 'linux') {
							// Linux: use xclip
							execFileSync('xclip', ['-selection', 'clipboard'], {
								input: text,
								env: {...process.env, DISPLAY: process.env.DISPLAY || ':0'},
							});
						} else if (process.platform === 'win32') {
							// Windows: use PowerShell Set-Clipboard
							// Escape double quotes and wrap in single quotes for PowerShell
							const escapedText = text.replace(/"/g, '""');
							execFileSync('powershell', [
								'-NoProfile',
								'-NonInteractive',
								'-Command',
								`Set-Clipboard -Value "${escapedText}"`,
							]);
						} else {
							throw new Error(`write_clipboard is not supported on platform: ${process.platform}`);
						}

						console.error('[DEBUG] Clipboard written successfully');
						return jsonResult({ok: true});
					} catch (error: unknown) {
						const errorMsg = error instanceof Error ? error.message : String(error);
						console.error(`[DEBUG] Failed to write clipboard: ${errorMsg}`);
						throw new Error(`Failed to write clipboard: ${errorMsg}`);
					}
				}

				case 'zoom': {
					if (!coordinate || coordinate.length !== 4) {
						throw new Error('Coordinate required for zoom: [x, y, width, height]');
					}

					const coord = coordinate as [number, number, number, number];
					const [x, y, width, height] = coord;
					console.error(`[DEBUG] Zooming region: [${x}, ${y}, ${width}, ${height}]`);

					// Scale coordinates from API image space to logical screen space
					const scale = await getApiToLogicalScale();
					const scaledX = Math.round(x * scale);
					const scaledY = Math.round(y * scale);
					const scaledWidth = Math.round(width * scale);
					const scaledHeight = Math.round(height * scale);

					console.error(`[DEBUG] Scaled region: [${scaledX}, ${scaledY}, ${scaledWidth}, ${scaledHeight}]`);

					// Validate region is within display bounds
					const [screenWidth, screenHeight] = [await screen.width(), await screen.height()];
					if (scaledX < 0 || scaledY < 0 || scaledX + scaledWidth > screenWidth || scaledY + scaledHeight > screenHeight) {
						throw new Error(`Region (${scaledX}, ${scaledY}, ${scaledWidth}, ${scaledHeight}) is outside display bounds of ${screenWidth}x${screenHeight}`);
					}

					// Capture the entire screen
					const fullImage = await grabScreen();

					// Get physical dimensions
					const physicalWidth = fullImage.getWidth();
					const physicalHeight = fullImage.getHeight();
					const logicalWidth = await screen.width();
					const logicalHeight = await screen.height();
					const retinaScale = physicalWidth / logicalWidth;

					// Convert to physical coordinates for cropping
					const physicalX = Math.round(scaledX * retinaScale);
					const physicalY = Math.round(scaledY * retinaScale);
					const physicalCropWidth = Math.round(scaledWidth * retinaScale);
					const physicalCropHeight = Math.round(scaledHeight * retinaScale);

					console.error(`[DEBUG] Physical crop region: [${physicalX}, ${physicalY}, ${physicalCropWidth}, ${physicalCropHeight}]`);

					// Crop the region
					const cropped = fullImage.crop(physicalX, physicalY, physicalCropWidth, physicalCropHeight);

					// Calculate zoom scale to maximize the region within API limits
					const zoomScale = Math.min(
						maxLongEdge / Math.max(physicalCropWidth, physicalCropHeight),
						Math.sqrt(maxPixels / (physicalCropWidth * physicalCropHeight)),
					);

					console.error(`[DEBUG] Zoom scale: ${zoomScale}`);

					// Apply zoom if it would enlarge the image
					if (zoomScale > 1) {
						const zoomedWidth = Math.floor(physicalCropWidth * zoomScale);
						const zoomedHeight = Math.floor(physicalCropHeight * zoomScale);
						cropped.resize(zoomedWidth, zoomedHeight);
						console.error(`[DEBUG] Zoomed to: ${zoomedWidth}x${zoomedHeight}`);
					}

					// Convert to PNG
					const pngBuffer = await cropped.getBufferAsync('image/png');
					const optimizedBuffer = await sharp(pngBuffer)
						.png({quality: 80, compressionLevel: 9})
						.toBuffer();

					console.error(`[DEBUG] Zoomed screenshot size: ${optimizedBuffer.length} bytes`);

					// Convert to base64
					const base64Data = optimizedBuffer.toString('base64');

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									image_width: cropped.getWidth(),
									image_height: cropped.getHeight(),
									original_region: {x, y, width, height},
									zoom_scale: zoomScale,
								}),
							},
							{
								type: 'image',
								data: base64Data,
								mimeType: 'image/png',
							},
						],
					};
				}

				case 'hold_key': {
					if (!text) {
						throw new Error('Text required for hold_key (format: "key:duration" or just "key")');
					}

					// Parse key and optional duration from text (e.g. "shift:2" or just "shift")
					const parts = text.split(':');
					const keyName = parts[0];
					const durationStr = parts[1];
					const duration = durationStr ? parseFloat(durationStr) : 1.0;

					if (!keyName) {
						throw new Error('Key name required for hold_key');
					}

					if (isNaN(duration) || duration <= 0) {
						throw new Error(`Invalid duration: ${durationStr}. Must be a positive number.`);
					}

					console.error(`[DEBUG] Holding key "${keyName}" for ${duration} seconds`);

					const keys = toKeys(keyName);
					await keyboard.pressKey(...keys);
					await setTimeout(duration * 1000);
					await keyboard.releaseKey(...keys);

					return jsonResult({ok: true, key: keyName, duration});
				}

				case 'left_mouse_down': {
					if (scaledCoordinate) {
						await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
						await setTimeout(50);
					}

					console.error('[DEBUG] Pressing left mouse button (holding)');
					await mouse.pressButton(Button.LEFT);
					return jsonResult({ok: true});
				}

				case 'left_mouse_up': {
					console.error('[DEBUG] Releasing left mouse button');
					await mouse.releaseButton(Button.LEFT);
					return jsonResult({ok: true});
				}

				case 'get_screenshot': {
					// Wait a bit to let things load before showing it to Claude
					await setTimeout(1000);

					// Get cursor position in logical coordinates
					const cursorPos = await mouse.getPosition();

					// Capture the entire screen (may be at Retina resolution)
					const image = await grabScreen();

					console.error(`[DEBUG] Screenshot captured`);
					console.error(`[DEBUG] Original image size: ${image.getWidth()}x${image.getHeight()}`);
					console.error(`[DEBUG] Cursor position (logical): [${cursorPos.x}, ${cursorPos.y}]`);

					// Get logical screen dimensions
					const logicalWidth = await screen.width();
					const logicalHeight = await screen.height();
					
					// Calculate scale factors (following Claude Code's approach)
					// Physical dimensions from the captured image
					const physicalWidth = image.getWidth();
					const physicalHeight = image.getHeight();
					
					// Retina scale factor: physical / logical (typically 2.0 on Retina displays)
					const retinaScale = physicalWidth / logicalWidth;
					
					console.error(`[DEBUG] Logical screen: ${logicalWidth}x${logicalHeight}`);
					console.error(`[DEBUG] Physical screen: ${physicalWidth}x${physicalHeight}`);
					console.error(`[DEBUG] Retina scale: ${retinaScale}`);

					// Resize to fit within API limits
					const apiScaleFactor = getSizeToApiScale(physicalWidth, physicalHeight);
					console.error(`[DEBUG] API scale factor: ${apiScaleFactor}`);
					
					if (apiScaleFactor < 1) {
						image.resize(
							Math.floor(physicalWidth * apiScaleFactor),
							Math.floor(physicalHeight * apiScaleFactor),
						);
						console.error(`[DEBUG] Resized image to: ${image.getWidth()}x${image.getHeight()}`);
					}

					const imageWidth = image.getWidth();
					const imageHeight = image.getHeight();

					// Calculate cursor position in API image coordinates
					// Conversion chain: Logical → Physical → API Image
					// Following Claude Code's computeTargetDims approach
					const physicalCursorX = cursorPos.x * retinaScale;
					const physicalCursorY = cursorPos.y * retinaScale;
					const cursorInImageX = Math.floor(physicalCursorX * imageWidth / physicalWidth);
					const cursorInImageY = Math.floor(physicalCursorY * imageHeight / physicalHeight);

					console.error(`[DEBUG] Physical cursor: [${physicalCursorX}, ${physicalCursorY}]`);
					console.error(`[DEBUG] Cursor in image: [${cursorInImageX}, ${cursorInImageY}]`);

					// Draw a crosshair at cursor position (red color)
					const crosshairSize = 20;
					const crosshairColor = 0xFF0000FF; // Red with full opacity (RGBA)

					// Draw horizontal line
					for (let x = Math.max(0, cursorInImageX - crosshairSize); x <= Math.min(imageWidth - 1, cursorInImageX + crosshairSize); x++) {
						if (cursorInImageY >= 0 && cursorInImageY < imageHeight) {
							image.setPixelColor(crosshairColor, x, cursorInImageY);
							// Make it thicker
							if (cursorInImageY > 0) {
								image.setPixelColor(crosshairColor, x, cursorInImageY - 1);
							}

							if (cursorInImageY < imageHeight - 1) {
								image.setPixelColor(crosshairColor, x, cursorInImageY + 1);
							}
						}
					}

					// Draw vertical line
					for (let y = Math.max(0, cursorInImageY - crosshairSize); y <= Math.min(imageHeight - 1, cursorInImageY + crosshairSize); y++) {
						if (cursorInImageX >= 0 && cursorInImageX < imageWidth) {
							image.setPixelColor(crosshairColor, cursorInImageX, y);
							// Make it thicker
							if (cursorInImageX > 0) {
								image.setPixelColor(crosshairColor, cursorInImageX - 1, y);
							}

							if (cursorInImageX < imageWidth - 1) {
								image.setPixelColor(crosshairColor, cursorInImageX + 1, y);
							}
						}
					}

					// Get PNG buffer from Jimp
					const pngBuffer = await image.getBufferAsync('image/png');

					// Use PNG format for best quality (especially for Chinese text recognition)
					// File size: ~550KB, but ensures perfect AI recognition
					const optimizedBuffer = await sharp(pngBuffer)
						.png({quality: 80, compressionLevel: 9})
						.toBuffer();

					console.error(`[DEBUG] Screenshot format: PNG`);
					console.error(`[DEBUG] Screenshot size: ${optimizedBuffer.length} bytes`);

					// Save screenshot for debugging (optional)
					try {
						const fs = await import('node:fs');
						const tmpPath = `/tmp/computer-use-mcp-screenshot-${Date.now()}.png`;
						fs.writeFileSync(tmpPath, optimizedBuffer);
						console.error(`[DEBUG] Screenshot saved to: ${tmpPath}`);
					} catch (err) {
						console.error(`[DEBUG] Failed to save screenshot: ${err}`);
					}

					// Convert optimized buffer to base64
					const base64Data = optimizedBuffer.toString('base64');

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									// Report the image dimensions - Claude should use coordinates within this space
									// These may differ from the actual display due to scaling for API limits
									image_width: imageWidth,
									image_height: imageHeight,
								}),
							},
							{
								type: 'image',
								data: base64Data,
								mimeType: 'image/png',
							},
						],
					};
				}
			}
		},
	);
}
