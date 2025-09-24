import type { LLMService } from '@/services/types/index.js';

import LogService from '@/services/LogService.js';

export type TranslateOptions = {
	app: {
		break: number;
		checkpoint: boolean;
		debug: boolean;
		log: LogService;
		service: LLMService;
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

export type SupportedServices = 'openai' | 'ollama' | 'google';
