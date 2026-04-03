# Coordinate System Documentation

This document explains how coordinates are handled in the computer-use-mcp tool, following the same approach as Claude Code.

## Three Coordinate Spaces

### 1. Logical Coordinates (Operating System)
- What the OS reports as screen dimensions
- On macOS Retina displays: typically half of physical resolution
- Example: 1728×1117 on a MacBook Pro
- This is what `screen.width()` and `screen.height()` return
- This is what `mouse.getPosition()` returns

### 2. Physical Coordinates (Actual Pixels)
- The actual pixel resolution of the display
- On macOS Retina displays: 2× logical resolution
- Example: 3456×2234 on a MacBook Pro (2× scale factor)
- This is what `grabScreen()` captures

### 3. API Image Coordinates (Downsampled)
- The image size after downsampling to fit API limits
- Limits: max long edge 1568px, max total pixels 1.15 megapixels
- Example: 1365×882 (39.5% of physical resolution)
- This is what the AI model sees

## Coordinate Conversion Chain

### From AI to Screen (Input Coordinates)

```
AI provides coordinate [x, y] in API Image space
    ↓
Multiply by (1 / apiScaleFactor) to get Physical coordinates
    ↓
Divide by retinaScale to get Logical coordinates
    ↓
Pass to mouse.setPosition()
```

**Implementation:**
```typescript
const scale = await getApiToLogicalScale();
const logicalX = Math.round(apiX * scale);
const logicalY = Math.round(apiY * scale);
await mouse.setPosition(new Point(logicalX, logicalY));
```

### From Screen to AI (Cursor Position in Screenshot)

```
mouse.getPosition() returns Logical coordinates [x, y]
    ↓
Multiply by retinaScale to get Physical coordinates
    ↓
Multiply by (imageWidth / physicalWidth) to get API Image coordinates
    ↓
Draw crosshair at this position
```

**Implementation:**
```typescript
const cursorPos = await mouse.getPosition(); // Logical
const physicalCursorX = cursorPos.x * retinaScale;
const physicalCursorY = cursorPos.y * retinaScale;
const cursorInImageX = Math.floor(physicalCursorX * imageWidth / physicalWidth);
const cursorInImageY = Math.floor(physicalCursorY * imageHeight / physicalHeight);
```

## Scale Factors

### Retina Scale Factor
```typescript
const retinaScale = physicalWidth / logicalWidth;
// Example: 3456 / 1728 = 2.0 on Retina displays
```

### API Scale Factor
```typescript
const apiScaleFactor = getSizeToApiScale(physicalWidth, physicalHeight);
// Example: 0.395 (to fit 3456×2234 into 1365×882)
```

### Combined Scale (API to Logical)
```typescript
const apiToLogicalScale = 1 / apiScaleFactor;
// Example: 1 / 0.395 = 2.53
```

## Example: MacBook Pro Retina Display

| Space | Width | Height | Notes |
|-------|-------|--------|-------|
| Logical | 1728 | 1117 | OS-reported, mouse coordinates |
| Physical | 3456 | 2234 | Actual pixels, screenshot capture |
| API Image | 1365 | 882 | Downsampled for API limits |

**Scale factors:**
- Retina: 2.0 (Physical / Logical)
- API: 0.395 (API Image / Physical)
- Combined: 2.53 (API Image / Logical)

**Cursor conversion example:**
- Mouse at logical [420, 300]
- Physical: [840, 600] (× 2.0)
- API Image: [332, 237] (× 0.395)
- Crosshair drawn at [332, 237] in the screenshot

## Why This Matters

### Problem: Incorrect Coordinate Conversion
If you don't account for Retina scaling, the crosshair appears in the wrong location:
- AI sees crosshair at wrong position
- AI provides coordinates based on wrong reference point
- Clicks miss their targets

### Solution: Proper Conversion Chain
By following the Logical → Physical → API Image chain:
- Crosshair appears at correct cursor position
- AI sees accurate reference point
- Coordinates are correctly translated back to screen space

## API Limits

The AI vision API has size constraints:
- Max long edge: 1568 pixels
- Max total pixels: 1.15 megapixels (1,228,800 pixels)

**Calculation:**
```typescript
const maxLongEdge = 1568;
const maxPixels = 1.15 * 1024 * 1024;

function getSizeToApiScale(width: number, height: number): number {
  const longEdge = Math.max(width, height);
  const totalPixels = width * height;
  
  const longEdgeScale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const pixelScale = totalPixels > maxPixels ? Math.sqrt(maxPixels / totalPixels) : 1;
  
  return Math.min(longEdgeScale, pixelScale);
}
```

## Debugging Tips

Enable debug logging to see the conversion process:
```bash
# Run with debug script
./debug-mcp.sh

# Check logs
tail -f /tmp/computer-use-mcp-debug.log
```

**What to look for:**
```
[DEBUG] Logical screen: 1728x1117
[DEBUG] Physical screen: 3456x2234
[DEBUG] Retina scale: 2.0
[DEBUG] API scale factor: 0.39520317549175116
[DEBUG] Resized image to: 1365x882
[DEBUG] Cursor position (logical): [420, 300]
[DEBUG] Physical cursor: [840, 600]
[DEBUG] Cursor in image: [332, 237]
```

## References

- Claude Code implementation: `src/utils/computerUse/executor.ts`
- API resize parameters: `@ant/computer-use-mcp` package
- Anthropic Vision API docs: https://docs.anthropic.com/en/docs/build-with-claude/vision
