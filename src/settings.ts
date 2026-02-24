export interface HanddrawnMermaidSettings {
	enabled: boolean;
	fontFamily: string;
	pencilFilter: boolean;
	randomize: boolean;
	seed: number | null;
	roughness: number | null;
	bowing: number | null;
	hachureGap: number | null;
	fillWeight: number | null;
}

export const DEFAULT_SETTINGS: HanddrawnMermaidSettings = {
	enabled: true,
	fontFamily: 'Comic Sans MS, cursive',
	pencilFilter: false,
	randomize: false,
	seed: null,
	roughness: null,
	bowing: null,
	hachureGap: 2,
	fillWeight: 1.5,
};
