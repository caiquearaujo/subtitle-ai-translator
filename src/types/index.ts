export type TranslateOptions = {
	break: number;
	output: PathResolution;
	source: PathResolution;
	target: string;
};

export type PathResolution = {
	abspath: string;
	extension: string;
	filename: string;
	path: string;
};
