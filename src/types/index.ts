import type { LLMService } from '@/services/types/index.js';

export type TranslateOptions = {
	app: {
		break: number;
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

export type SupportedServices = 'openai' | 'ollama';
