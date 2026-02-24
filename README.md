# Handdrawn Mermaid

An [Obsidian](https://obsidian.md) plugin that renders Mermaid diagrams in a hand-drawn style, powered by [svg2roughjs](https://github.com/fskpf/svg2roughjs).

![demo](https://raw.githubusercontent.com/chouheiwa/obsidian-handdrawn-mermaid/main/demo.png)

## Features

- Converts all Mermaid diagrams in preview mode to a sketchy, hand-drawn look
- Configurable roughness, bowing, fill style, and font
- Optional pencil filter for extra texture
- Fixed or randomized rendering (reproducible with a seed)
- Live preview in the settings panel

## Installation

### From Obsidian Community Plugins

1. Open **Settings → Community plugins → Browse**
2. Search for **Handdrawn Mermaid**
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/chouheiwa/obsidian-handdrawn-mermaid/releases/latest)
2. Copy them to `<vault>/.obsidian/plugins/handdrawn-mermaid/`
3. Reload Obsidian and enable the plugin in **Settings → Community plugins**

## Settings

| Setting | Description | Default |
|---|---|---|
| Enable hand-drawn mode | Toggle the effect on/off | `true` |
| Font | Font used for text in diagrams | `Comic Sans MS, cursive` |
| Pencil filter | Adds a pencil-texture SVG filter | `false` |
| Randomize | Re-randomize lines on every render | `false` |
| Seed | Fixed seed for reproducible output (ignored when randomize is on) | — |
| Roughness | How jagged the lines are (higher = more chaotic) | rough.js default |
| Bowing | How much lines bow outward | rough.js default |
| Hachure gap | Spacing between fill lines (px) | `2` |
| Fill weight | Width of fill lines (px) | `1.5` |

## Development

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch mode
npm run dev
```

To release a new version:

```bash
# Bump version (updates manifest.json + versions.json automatically)
npm version patch   # or minor / major

# Push with tag to trigger GitHub Actions release
git push --follow-tags
```

## License

[MIT](LICENSE)
