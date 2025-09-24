import { GoogleGenAI } from '@google/genai';
import { NodeCue } from 'subtitle';
import z from 'zod';

import type { LLMService } from '@/services/types/index.js';
import type LogService from '@/services/LogService.js';

import BaseLLMService from '@/services/BaseLLMService.js';

export type GoogleOptions = {
	api_key: string;
	model: string;
	temperature: number;
};

class GoogleLLMService extends BaseLLMService implements LLMService {
	/**
	 * The Google instance.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _google: GoogleGenAI;

	/**
	 * The options to process.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _options: GoogleOptions;

	/**
	 * The name of the service.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public readonly name: string = 'google';

	/**
	 * Create a new GoogleLLMService instance.
	 *
	 * @param options - The options to process.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	constructor(
		options: GoogleOptions,
		target_language: string,
		log: LogService,
	) {
		super(target_language, log);

		this._options = z
			.object({
				api_key: z.string({ message: 'Google API key is required.' }),
				model: z
					.string({ message: 'Google model is required.' })
					.optional()
					.default('gemini-2.0-flash'),
				temperature: z.coerce
					.number({ message: 'Temperature must be a number.' })
					.min(0, { message: 'Temperature must be greater than 0.' })
					.max(1, { message: 'Temperature must be less than 1.' })
					.optional()
					.default(0.3),
			})
			.parse(options);

		this._google = new GoogleGenAI({
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
		const completion = await this._google.models.generateContent({
			config: {
				temperature: this._options.temperature,
			},
			contents: this._translationPrompt(subtitle[index], {
				next: subtitle?.[index + 1],
				previous: output.slice(-4),
			}).map(p => ({
				parts: [{ text: p.content }],
				role: 'user',
			})),
			model: this._options.model,
		});

		return completion.text ?? null;
	}
}

export default GoogleLLMService;
