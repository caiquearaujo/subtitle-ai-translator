import { NodeCue } from 'subtitle';
import { OpenAI } from 'openai';
import z from 'zod';

import type { LLMService } from '@/services/types/index.js';
import type LogService from '@/services/LogService.js';

import BaseLLMService from '@/services/BaseLLMService.js';

export type OpenAiOptions = {
	api_key: string;
	model: string;
	reasoning: 'minimal' | 'medium' | 'high' | 'low';
	temperature: number;
	timeout: number;
};

class OpenAiLLMService extends BaseLLMService implements LLMService {
	/**
	 * The OpenAI instance.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _openai: OpenAI;

	/**
	 * The options to process.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _options: OpenAiOptions;

	/**
	 * The name of the service.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public readonly name: string = 'openai';

	/**
	 * Create a new OpenAiLLMService instance.
	 *
	 * @param options - The options to process.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	constructor(
		options: OpenAiOptions,
		target_language: string,
		log: LogService,
	) {
		super(target_language, log);

		this._options = z
			.object({
				api_key: z.string({ message: 'OpenAI API key is required.' }),
				model: z
					.string({ message: 'OpenAI model is required.' })
					.optional()
					.default('gpt-5-mini'),
				reasoning: z
					.enum(['minimal', 'medium', 'high', 'low'], {
						message: 'Reasoning must be a valid reasoning level.',
					})
					.optional()
					.default('low'),
				temperature: z.coerce
					.number({ message: 'Temperature must be a number.' })
					.min(0, { message: 'Temperature must be greater than 0.' })
					.max(1, { message: 'Temperature must be less than 1.' })
					.optional()
					.default(0.3),
				timeout: z.coerce
					.number({ message: 'Timeout must be a number.' })
					.optional()
					.default(60000),
			})
			.parse(options);

		this._openai = new OpenAI({
			apiKey: this._options.api_key,
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
		const completion = await this._openai.chat.completions.create(
			{
				messages: this._translationPrompt(subtitle[index], {
					next: subtitle?.[index + 1],
					previous: output.slice(-4),
				}),
				model: this._options.model,
				reasoning_effort: this._options.reasoning,
				temperature: this._options.temperature,
			},
			{ timeout: this._options.timeout },
		);

		return completion.choices[0].message.content;
	}
}

export default OpenAiLLMService;
