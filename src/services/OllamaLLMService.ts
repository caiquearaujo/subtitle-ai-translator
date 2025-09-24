import { NodeCue } from 'subtitle';
import { Ollama } from 'ollama';
import z from 'zod';

import type { LLMService } from '@/services/types/index.js';
import type LogService from '@/services/LogService.js';

import BaseLLMService from '@/services/BaseLLMService.js';

export type OllamaOptions = {
	host: string;
	model: string;
	reasoning: boolean;
	temperature: number;
};

class OllamaLLMService extends BaseLLMService implements LLMService {
	/**
	 * The Ollama instance.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _ollama: Ollama;

	/**
	 * The options to process.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _options: OllamaOptions;

	/**
	 * The name of the service.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public readonly name: string = 'ollama';

	/**
	 * Create a new OllamaLLMService instance.
	 *
	 * @param options - The options to process.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	constructor(
		options: OllamaOptions,
		target_language: string,
		log: LogService,
	) {
		super(target_language, log);

		this._options = z
			.object({
				host: z
					.string()
					.url({ message: 'Ollama host is required.' })
					.optional()
					.default('http://localhost:11434'),
				model: z
					.string({ message: 'Ollama model is required.' })
					.optional()
					.default('aya:8b'),
				reasoning: z.coerce
					.boolean({ message: 'Reasoning must be a boolean.' })
					.optional()
					.default(false),
				temperature: z.coerce
					.number({ message: 'Temperature must be a number.' })
					.min(0, { message: 'Temperature must be greater than 0.' })
					.max(1, { message: 'Temperature must be less than 1.' })
					.optional()
					.default(0.3),
			})
			.parse(options);

		this._ollama = new Ollama({
			host: this._options.host,
		});
	}

	/**
	 * Process the cue.
	 *
	 * @param index - The index of the cue.
	 * @param subtitle - The subtitle.
	 * @param output - The output.
	 * @returns The processed cue.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public async process(
		index: number,
		subtitle: Array<NodeCue>,
		output: Array<NodeCue>,
	): Promise<string | null> {
		const completion = await this._ollama.chat({
			messages: this._translationPrompt(subtitle[index], {
				next: subtitle?.[index + 1],
				previous: output.slice(-4),
			}),
			model: this._options.model,
			options: { temperature: this._options.temperature },
			think: this._options.reasoning,
		});

		return completion.message.content;
	}
}

export default OllamaLLMService;
