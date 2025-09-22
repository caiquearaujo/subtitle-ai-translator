/* eslint-disable no-console */
import type { NodeCue } from 'subtitle';
import type OpenAI from 'openai';

import chalk from 'chalk';
import debug from 'debug';

import type { TranslateOptions } from '@/types/index.js';

import { translationPrompt } from '@/utils/index.js';

/**
 * Translate the cue.
 *
 * @param options - The options to translate.
 * @param subtitle - The subtitle to translate.
 * @param openai
 * @returns The translated subtitle.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const TranslateCueAction = async (
	options: TranslateOptions,
	subtitle: Array<NodeCue>,
	openai: OpenAI,
): Promise<Array<NodeCue>> => {
	const output: Array<NodeCue> = [];

	for (let i = 0; i < subtitle.length; i++) {
		try {
			const cue = subtitle[i];

			const completion = await openai.chat.completions.create(
				{
					messages: translationPrompt(options, cue, {
						next: subtitle?.[i + 1],
						previous: output.slice(-4),
					}),
					model: 'gpt-5-mini',
					temperature: options.app.temperature,
				},
				{ timeout: 60000 },
			);

			const content = completion.choices[0].message.content;

			if (!content) {
				throw new Error('Failed to translate cue. No content returned.');
			}

			output.push({
				data: {
					...cue.data,
					text: content,
				},
				type: 'cue',
			});

			debug('cmd')('Line %d of %d translated.', i + 1, subtitle.length);
			debug('cmd')('Original: %s\nTranslated: %s', cue.data.text, content);
		} catch (error: any) {
			console.error(chalk.red('❌ Failed to translate cue.'));
			console.error(chalk.red(error.message));
			process.exit(1);
		}
	}

	return output;
};

export default TranslateCueAction;
