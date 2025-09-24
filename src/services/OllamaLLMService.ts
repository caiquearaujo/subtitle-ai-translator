import { NodeCue } from 'subtitle';
import { Ollama } from 'ollama';
import z from 'zod';

import { LLMService } from '@/services/types/index.js';
import { translationPrompt } from '@/utils/index.js';

export type OllamaOptions = {
	host: string;
	model: string;
	reasoning: 'medium' | 'high' | 'low' | 'off';
};

class OllamaLLMService implements LLMService {
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
	 * The target language.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _target_language: string;

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
	constructor(options: OllamaOptions, target_language: string) {
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
				reasoning: z
					.enum(['medium', 'high', 'low', 'off'], {
						message: 'Reasoning must be a valid reasoning level.',
					})
					.optional()
					.default('off'),
			})
			.parse(options);

		this._ollama = new Ollama({
			host: this._options.host,
		});

		this._target_language = target_language;
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
			messages: translationPrompt(this._target_language, subtitle[index], {
				next: subtitle?.[index + 1],
				previous: output.slice(-4),
			}),
			model: this._options.model,
			think:
				this._options.reasoning === 'off' ? false : this._options.reasoning,
		});

		return completion.message.content;
	}
}

export default OllamaLLMService;
