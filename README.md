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
This plugin is not yet available in the Obsidian Community plugins directory. You can install it using one of the methods below.

### Using BRAT (Recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tester) lets you install plugins not yet in the official community repository.

1. Install BRAT from [Obsidian Community plugins](https://obsidian.md/plugins?id=obsidian42-brat)
2. Open BRAT plugin settings
3. Click **Add Beta plugin**
4. Enter `https://github.com/chouheiwa/obsidian-handdrawn-mermaid`
5. Select **Latest version**
6. Click **Add Plugin**

### Manual

1. Go to the [Releases page](https://github.com/chouheiwa/obsidian-handdrawn-mermaid/releases/latest)
2. Download `main.js` and `manifest.json`
3. Copy both files to `<vault>/.obsidian/plugins/handdrawn-mermaid/`
4. Reload Obsidian and enable the plugin in **Settings → Community plugins**

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
