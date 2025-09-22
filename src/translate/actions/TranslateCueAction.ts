/* eslint-disable no-console */
import type { NodeCue } from 'subtitle';
import type OpenAI from 'openai';

import chalk from 'chalk';
import debug from 'debug';

import type { TranslateOptions } from '@/types/index.js';

import {
	translationPrompt,
	loadCheckpoint,
	saveCheckpoint,
	removeFile,
} from '@/utils/index.js';

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
	const output: Array<NodeCue> = loadCheckpoint(options, {
		source: options.cmd.source.abspath,
		target: options.cmd.target,
	});

	if (output.length > 0) {
		console.info(
			chalk.yellow(
				`Resuming from checkpoint (${output.length}/${subtitle.length}) at ${options.cmd.checkpoint}`,
			),
		);
	}

	for (let i = output.length; i < subtitle.length; i++) {
		try {
			const cue = subtitle[i];

			const completion = await openai.chat.completions.create(
				{
					messages: translationPrompt(options, cue, {
						next: subtitle?.[i + 1],
						previous: output.slice(-4),
					}),
					model: options.app.model,
					reasoning_effort: options.app.reasoning,
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

			if (i % 10 === 0) {
				console.log(
					`☑️ Line ${i + 1} of ${subtitle.length} (${Math.round(((i + 1) / subtitle.length) * 100)}%) translated.`,
				);

				await saveCheckpoint(
					options.cmd.checkpoint,
					options,
					output,
					i + 1,
				);

				debug('cmd')(
					'Progress saved to checkpoint at %s',
					options.cmd.checkpoint,
				);
			}

			debug('cmd')('Line %d of %d translated.', i + 1, subtitle.length);
			debug('cmd')('Original: %s\nTranslated: %s', cue.data.text, content);

			// wait for 50ms to avoid rate limit
			await new Promise(resolve => setTimeout(resolve, 50));
		} catch (error: any) {
			console.error(chalk.red('❌ Failed to translate cue.'));
			console.error(chalk.red(error.message));

			try {
				await saveCheckpoint(
					options.cmd.checkpoint,
					options,
					output,
					Math.min(output.length, subtitle.length),
				);
			} catch {
				// ignore
			}

			process.exit(1);
		}
	}

	await removeFile(options.cmd.checkpoint);
	return output;
};

export default TranslateCueAction;
