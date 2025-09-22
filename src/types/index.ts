export type TranslateOptions = {
	app: {
		api_key: string;
		break: number;
		model: string;
		temperature: number;
	};
	cmd: {
		output: PathResolution;
		source: PathResolution;
		target: string;
	};
};

export type PathResolution = {
	abspath: string;
	extension: string;
	filename: string;
	path: string;
};
