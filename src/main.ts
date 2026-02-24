import { App, Plugin, PluginSettingTab, Setting, loadMermaid, MarkdownView, WorkspaceLeaf } from 'obsidian';
import { HanddrawnMermaidSettings, DEFAULT_SETTINGS } from './settings';
import { convertToHanddrawn } from './handdrawn';

const PREVIEW_DIAGRAM = `graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[处理 A]
    B -->|否| D[处理 B]
    C --> E[结束]
    D --> E
    style A fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    style E fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style B fill:#fff9c4,stroke:#f57f17,stroke-width:2px`;

export default class HanddrawnMermaidPlugin extends Plugin {
	settings: HanddrawnMermaidSettings;

	private observers: Map<HTMLElement, MutationObserver> = new Map();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new HanddrawnMermaidSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('layout-change', () => this.onLayoutChange())
		);
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => this.onLeafChange(leaf))
		);

		this.onLayoutChange();
	}

	onunload() {
		this.observers.forEach(obs => obs.disconnect());
		this.observers.clear();
	}

	private onLayoutChange() {
		this.app.workspace.iterateAllLeaves(leaf => this.attachToLeaf(leaf));
	}

	private onLeafChange(leaf: WorkspaceLeaf | null) {
		if (leaf) this.attachToLeaf(leaf);
	}

	private attachToLeaf(leaf: WorkspaceLeaf) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) return;

		const previewEl = (view as any).previewMode?.containerEl as HTMLElement | undefined;
		if (!previewEl || this.observers.has(previewEl)) return;

		this.processMermaidInContainer(previewEl);

		const observer = new MutationObserver(() => {
			this.processMermaidInContainer(previewEl);
		});
		observer.observe(previewEl, { childList: true, subtree: true });
		this.observers.set(previewEl, observer);
	}

	private async processMermaidInContainer(root: HTMLElement) {
		if (!this.settings.enabled) return;
		const containers = root.querySelectorAll<HTMLElement>('div.mermaid');
		for (const container of Array.from(containers)) {
			await this.processContainer(container);
		}
	}
	private async processContainer(container: HTMLElement) {
		const svgEl = container.querySelector<SVGSVGElement>('svg');
		if (svgEl) {
			if (svgEl.hasAttribute('data-handdrawn')) return;
			await this.applyHanddrawn(svgEl);
			return;
		}
		// SVG 还没渲染好，用 MutationObserver 等待
		await new Promise<void>((resolve) => {
			const observer = new MutationObserver(() => {
				const svg = container.querySelector<SVGSVGElement>('svg');
				if (svg && !svg.hasAttribute('data-handdrawn')) {
					observer.disconnect();
					this.applyHanddrawn(svg).then(resolve);
				}
			});
			observer.observe(container, { childList: true, subtree: true });
			setTimeout(() => { observer.disconnect(); resolve(); }, 10000);
		});
	}

	private async applyHanddrawn(svgEl: SVGSVGElement) {
		try {
			const result = await convertToHanddrawn(svgEl, this.settings);
			if (result) {
				result.setAttribute('data-handdrawn', 'true');
				svgEl.replaceWith(result);
			} else {
				console.warn('[handdrawn-mermaid] convertToHanddrawn returned null');
			}
		} catch (e) {
			console.error('[handdrawn-mermaid] conversion failed:', e);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class HanddrawnMermaidSettingTab extends PluginSettingTab {
	plugin: HanddrawnMermaidPlugin;
	private previewEl: HTMLElement;
	private refreshTimer: number | null = null;

	constructor(app: App, plugin: HanddrawnMermaidPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const onChange = async (save: () => Promise<void>) => {
			await save();
			this.schedulePreviewRefresh();
		};

		// ── 基础设置 ──────────────────────────────────────────
		containerEl.createEl('h3', { text: '基础' });

		new Setting(containerEl)
			.setName('启用手绘模式')
			.setDesc('开启后，所有 Mermaid 图表将以手绘风格渲染')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabled)
				.onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await onChange(() => this.plugin.saveSettings());
				}));

		new Setting(containerEl)
			.setName('字体')
			.setDesc('手绘模式使用的字体，留空则使用原始字体')
			.addText(text => text
				.setPlaceholder('Comic Sans MS, cursive')
				.setValue(this.plugin.settings.fontFamily)
				.onChange(async (value) => {
					this.plugin.settings.fontFamily = value;
					await onChange(() => this.plugin.saveSettings());
				}));

		new Setting(containerEl)
			.setName('铅笔滤镜')
			.setDesc('启用铅笔质感滤镜效果')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.pencilFilter)
				.onChange(async (value) => {
					this.plugin.settings.pencilFilter = value;
					await onChange(() => this.plugin.saveSettings());
				}));

		// ── 随机化 ────────────────────────────────────────────
		containerEl.createEl('h3', { text: '随机化' });

		new Setting(containerEl)
			.setName('随机化')
			.setDesc('开启后每次渲染线条随机变化；关闭后结果固定，可配合随机种子复现')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.randomize)
				.onChange(async (value) => {
					this.plugin.settings.randomize = value;
					seedSetting.setDisabled(value);
					await onChange(() => this.plugin.saveSettings());
				}));

		const seedSetting = new Setting(containerEl)
			.setName('随机种子')
			.setDesc('固定种子以获得可复现的输出，留空则不固定（随机化开启时无效）')
			.addText(text => text
				.setPlaceholder('例如：42')
				.setValue(this.plugin.settings.seed !== null ? String(this.plugin.settings.seed) : '')
				.onChange(async (value) => {
					const num = parseInt(value);
					this.plugin.settings.seed = value === '' || isNaN(num) ? null : num;
					await onChange(() => this.plugin.saveSettings());
				}));
		seedSetting.setDisabled(this.plugin.settings.randomize);

		// ── 线条风格 ──────────────────────────────────────────
		containerEl.createEl('h3', { text: '线条风格' });

		new Setting(containerEl)
			.setName('粗糙度 (roughness)')
			.setDesc('线条粗糙程度，数值越大越潦草，留空使用默认值')
			.addText(text => text
				.setPlaceholder('默认')
				.setValue(this.plugin.settings.roughness !== null ? String(this.plugin.settings.roughness) : '')
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.roughness = value === '' || isNaN(num) ? null : num;
					await onChange(() => this.plugin.saveSettings());
				}));

		new Setting(containerEl)
			.setName('弯曲度 (bowing)')
			.setDesc('线条弯曲程度，数值越大弯曲越明显，留空使用默认值')
			.addText(text => text
				.setPlaceholder('默认')
				.setValue(this.plugin.settings.bowing !== null ? String(this.plugin.settings.bowing) : '')
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.bowing = value === '' || isNaN(num) ? null : num;
					await onChange(() => this.plugin.saveSettings());
				}));

		// ── 填充风格 ──────────────────────────────────────────
		containerEl.createEl('h3', { text: '填充风格' });

		new Setting(containerEl)
			.setName('填充线间距 (hachureGap)')
			.setDesc('填充线之间的间距（px），越小越密')
			.addText(text => text
				.setPlaceholder('2')
				.setValue(this.plugin.settings.hachureGap !== null ? String(this.plugin.settings.hachureGap) : '')
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.hachureGap = value === '' || isNaN(num) ? null : num;
					await onChange(() => this.plugin.saveSettings());
				}));

		new Setting(containerEl)
			.setName('填充线宽度 (fillWeight)')
			.setDesc('填充线的宽度（px）')
			.addText(text => text
				.setPlaceholder('1.5')
				.setValue(this.plugin.settings.fillWeight !== null ? String(this.plugin.settings.fillWeight) : '')
				.onChange(async (value) => {
					const num = parseFloat(value);
					this.plugin.settings.fillWeight = value === '' || isNaN(num) ? null : num;
					await onChange(() => this.plugin.saveSettings());
				}));

		// ── 预览 ──────────────────────────────────────────────
		containerEl.createEl('h3', { text: '预览' });

		this.previewEl = containerEl.createDiv({ cls: 'handdrawn-mermaid-preview' });
		this.previewEl.style.cssText = 'border:1px solid var(--background-modifier-border);border-radius:6px;padding:16px;min-height:120px;display:flex;align-items:center;justify-content:center;';

		this.refreshPreview();
	}
	private schedulePreviewRefresh() {
		if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refreshPreview();
		}, 500);
	}

	private async refreshPreview() {
		if (!this.previewEl) return;
		this.previewEl.empty();

		const loading = this.previewEl.createSpan({ text: '渲染中...' });
		loading.style.color = 'var(--text-muted)';

		try {
			const mermaid = await loadMermaid();
			const id = 'handdrawn-preview-' + Date.now();

			const renderContainer = document.body.createDiv();
			renderContainer.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
			let svg: string;
			try {
				const result = await mermaid.render(id, PREVIEW_DIAGRAM, renderContainer);
				svg = result.svg;
			} finally {
				renderContainer.remove();
			}

			const parser = new DOMParser();
			const doc = parser.parseFromString(svg, 'image/svg+xml');
			const svgEl = doc.documentElement as unknown as SVGSVGElement;

			this.previewEl.empty();

			if (this.plugin.settings.enabled) {
				const result = await convertToHanddrawn(svgEl, this.plugin.settings);
				if (result) {
					result.style.maxWidth = '100%';
					this.previewEl.appendChild(result);
					return;
				}
			}

			const rawSvg = this.previewEl.createEl('div');
			rawSvg.innerHTML = svg;
			const rawSvgEl = rawSvg.querySelector('svg');
			if (rawSvgEl) rawSvgEl.style.maxWidth = '100%';
		} catch (e) {
			this.previewEl.empty();
			const err = this.previewEl.createSpan({ text: '预览失败: ' + (e as Error).message });
			err.style.color = 'var(--text-error)';
		}
	}

	hide(): void {
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
	}
}
