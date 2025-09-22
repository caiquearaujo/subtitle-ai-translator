export type TranslateOptions = {
	app: {
		api_key: string;
		break: number;
		model: string;
		reasoning: 'minimal' | 'medium' | 'high' | 'low';
		temperature: number;
	};
	cmd: {
		checkpoint: string;
		output: PathResolution;
		source: PathResolution;
		target: string;
	};
};

export type Progress = {
	done: number;
	onFlush?: () => void;
	start_time: number;
	status?: string;
	total: number;
};

export type PathResolution = {
	abspath: string;
	extension: string;
	filename: string;
	path: string;
};
