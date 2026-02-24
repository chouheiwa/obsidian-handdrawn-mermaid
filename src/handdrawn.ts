import { Svg2Roughjs } from 'svg2roughjs';
import type { HanddrawnMermaidSettings } from './settings';

export async function convertToHanddrawn(
	svgEl: SVGSVGElement,
	settings: HanddrawnMermaidSettings
): Promise<SVGSVGElement | null> {
	const container = document.createElement('div');
	container.id = 'handdrawn-mermaid-container-' + Date.now();
	container.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;top:-9999px;left:-9999px;';
	document.body.appendChild(container);

	try {
		const roughConfig: Record<string, number> = {
			hachureGap: settings.hachureGap ?? 2,
			fillWeight: settings.fillWeight ?? 1.5,
		};
		if (settings.roughness !== null) roughConfig.roughness = settings.roughness;
		if (settings.bowing !== null) roughConfig.bowing = settings.bowing;

		container.appendChild(svgEl.cloneNode(true));

		const converter = new Svg2Roughjs('#' + container.id);
		converter.svg = container.querySelector('svg') as SVGSVGElement;
		converter.fontFamily = settings.fontFamily || null;
		converter.pencilFilter = settings.pencilFilter;
		converter.randomize = settings.randomize;
		if (settings.seed !== null) converter.seed = settings.seed;
		converter.roughConfig = roughConfig as never;

		await converter.sketch();

		container.querySelector('svg:not([data-roughjs])')?.remove();

		const sketchSvg = container.querySelector<SVGSVGElement>('svg');
		if (!sketchSvg) return null;

		const width = sketchSvg.getAttribute('width');
		const height = sketchSvg.getAttribute('height');
		if (width && height) {
			sketchSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		}

		sketchSvg.querySelectorAll('text, tspan').forEach((el) => {
			if (el.getAttribute('data-text-fixed') === 'true') return;
			el.setAttribute('dominant-baseline', 'middle');
			el.setAttribute('data-text-fixed', 'true');
		});

		sketchSvg.querySelectorAll('foreignObject').forEach((foreignObj) => {
			if (foreignObj.getAttribute('data-text-fixed') === 'true') return;
			const h = parseFloat(foreignObj.getAttribute('height') || '24');
			const y = parseFloat(foreignObj.getAttribute('y') || '0');
			const newH = h * 1.5;
			foreignObj.setAttribute('height', newH.toString());
			foreignObj.setAttribute('y', (y - (newH - h) / 2).toString());
			foreignObj.setAttribute('data-text-fixed', 'true');
			foreignObj.querySelectorAll('div, span, p').forEach((el: Element) => {
				(el as HTMLElement).style.display = 'flex';
				(el as HTMLElement).style.alignItems = 'center';
				(el as HTMLElement).style.justifyContent = 'center';
				(el as HTMLElement).style.height = '100%';
				(el as HTMLElement).style.lineHeight = '1.2';
			});
		});

		sketchSvg.style.maxWidth = '100%';
		sketchSvg.remove();
		return sketchSvg;
	} finally {
		document.body.removeChild(container);
	}
}
