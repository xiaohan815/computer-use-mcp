# computer-use-mcp

💻 An model context protocol server for Claude to control your computer. This is very similar to [computer use](https://docs.anthropic.com/en/docs/build-with-claude/computer-use), but easy to set up and use locally.

Here's Claude Haiku 4.5 changing my desktop background (4x speed):

https://github.com/user-attachments/assets/cd0bc190-52c4-49db-b3bc-4b8a74544789

> [!WARNING]
> At time of writing, models make frequent mistakes and are vulnerable to prompt injections. As this MCP server gives the model complete control of your computer, this could do a lot of damage. You should therefore treat this like giving a hyperactive toddler access to your computer - you probably want to supervise it closely, and consider only doing this in a sandboxed user account.

## Installation

<details>
<summary><strong>Claude Code</strong></summary>

Run:

```bash
claude mcp add --scope user --transport stdio computer-use -- npx -y computer-use-mcp
```

This installs the server at user scope (available in all projects). To install locally (current directory only), omit `--scope user`.

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

#### (Recommended) Via manual .dxt installation

1. Find the latest dxt build in [the GitHub Actions history](https://github.com/domdomegg/computer-use-mcp/actions/workflows/dxt.yaml?query=branch%3Amaster) (the top one)
2. In the 'Artifacts' section, download the `computer-use-mcp-dxt` file
3. Rename the `.zip` file to `.dxt`
4. Double-click the `.dxt` file to open with Claude Desktop
5. Click "Install"

#### (Advanced) Alternative: Via JSON configuration

1. Install [Node.js](https://nodejs.org/en/download)
2. Open Claude Desktop and go to Settings → Developer
3. Click "Edit Config" to open your `claude_desktop_config.json` file
4. Add the following configuration to the "mcpServers" section:

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "npx",
      "args": [
        "-y",
        "computer-use-mcp"
      ]
    }
  }
}
```

5. Save the file and restart Claude Desktop

</details>

<details>
<summary><strong>Cursor</strong></summary>

#### (Recommended) Via one-click install

1. Click [![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=computer-use&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwY29tcHV0ZXItdXNlLW1jcCUyMiU3RA%3D%3D)

#### (Advanced) Alternative: Via JSON configuration

Create either a global (`~/.cursor/mcp.json`) or project-specific (`.cursor/mcp.json`) configuration file:

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "npx",
      "args": ["-y", "computer-use-mcp"]
    }
  }
}
```

</details>

<details>
<summary><strong>Cline</strong></summary>

#### (Recommended) Via marketplace

1. Click the "MCP Servers" icon in the Cline extension
2. Search for "Computer Use" and click "Install"
3. Follow the prompts to install the server

#### (Advanced) Alternative: Via JSON configuration

1. Click the "MCP Servers" icon in the Cline extension
2. Click on the "Installed" tab, then the "Configure MCP Servers" button at the bottom
3. Add the following configuration to the "mcpServers" section:

```json
{
  "mcpServers": {
    "computer-use": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "computer-use-mcp"]
    }
  }
}
```

</details>

## Tips

This should just work out of the box.

However, to get best results:
- Use a model good at computer use - I recommend [the latest Claude models](https://platform.claude.com/docs/en/about-claude/models/overview).
- Use a small, common resolution - 720p works particularly well. On macOS, you can use [displayoverride-mac](https://github.com/domdomegg/displayoverride-mac) to do this. If you can't use a different resolution, try zooming in to active windows.
- Install and enable the [Rango browser extension](https://chromewebstore.google.com/detail/rango/lnemjdnjjofijemhdogofbpcedhgcpmb). This enables keyboard navigation for websites, which is far more reliable than Claude trying to click coordinates. You can bump up the font size setting in Rango to make the hints more visible.

## How it works

We implement a near identical computer use tool to [Anthropic's official computer use guide](https://docs.anthropic.com/en/docs/build-with-claude/computer-use), with some more nudging to prefer keyboard shortcuts.

This talks to your computer using [nut.js](https://github.com/nut-tree/nut.js)

### Available Actions

The `computer` tool supports the following actions:

#### Mouse & Keyboard
- **key**: Press a key or key combination (e.g., "Command+Space", "Control+C")
- **type**: Type a string of text
- **hold_key**: Hold down a key for a specified duration (e.g., "shift:2" holds Shift for 2 seconds)

#### Mouse Actions
- **mouse_move**: Move cursor to specified coordinates
- **left_click**: Click left mouse button (optionally at coordinates)
- **right_click**: Click right mouse button (optionally at coordinates)
- **middle_click**: Click middle mouse button (optionally at coordinates)
- **double_click**: Double-click left mouse button (optionally at coordinates)
- **triple_click**: Triple-click left mouse button to select paragraph (optionally at coordinates)
- **left_click_drag**: Click and drag to specified coordinates
- **left_mouse_down**: Press and hold left mouse button (for fine-grained drag control)
- **left_mouse_up**: Release left mouse button
- **scroll**: Scroll in a direction ("up", "down", "left", "right", optionally with amount like "down:500")

#### Screen & Vision
- **get_screenshot**: Capture screen with cursor position marked
- **zoom**: Capture and zoom into a specific region [x, y, width, height] for better detail
- **get_cursor_position**: Get current cursor coordinates

#### System Control
- **open_application**: Open or bring an application to the foreground (e.g., "WeChat", "Safari")
- **wait**: Wait for a specified duration in seconds (e.g., "2" for 2 seconds, "0.5" for 500ms)

#### Clipboard
- **read_clipboard**: Read the current text content from the system clipboard
- **write_clipboard**: Write text to the system clipboard

### Optimizations

This implementation includes several optimizations based on Claude Code's approach:

- **PNG format**: Uses PNG lossless compression for perfect AI recognition (especially for Chinese text)
- **Mouse settle delay**: 50ms delay after mouse movements to prevent hover state issues
- **Retina display support**: Proper coordinate conversion for high-DPI displays
- **Cross-platform app activation**: Reliable application switching on macOS/Linux/Windows

See [COORDINATES.md](./docs/COORDINATES.md) for detailed coordinate system documentation.

## Documentation

For detailed documentation, see the [docs](./docs) directory:

- **[Usage Examples](./docs/USAGE_EXAMPLES.md)** - 12 practical examples
- **[Coordinates System](./docs/COORDINATES.md)** - Coordinate conversion explained
- **[Optimization Plan](./docs/OPTIMIZATION_PLAN.md)** - Development roadmap
- **[Phase 4 Implementation](./docs/PHASE4_IMPLEMENTATION.md)** - New features details

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run `npm run test` to run tests
5. Build with `npm run build`

## Releases

Versions follow the [semantic versioning spec](https://semver.org/).

To release:

1. Use `npm version <major | minor | patch>` to bump the version
2. Run `git push --follow-tags` to push with tags
3. Wait for GitHub Actions to publish to the NPM registry.
