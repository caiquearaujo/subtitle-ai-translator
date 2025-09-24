import type { NodeCue } from 'subtitle';

import chalk from 'chalk';
import debug from 'debug';

import type { TranslateOptions } from '@/types/index.js';

import {
	loadCheckpoint,
	saveCheckpoint,
	renderProgress,
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
): Promise<Array<NodeCue>> => {
	const { output, progress } = loadCheckpoint(options, subtitle, {
		source: options.cmd.source.abspath,
		target: options.cmd.target,
	});

	// @note bootstrap the progress
	renderProgress(progress, true);

	if (output.length > 0) {
		progress.status = chalk.yellow(`Resuming from checkpoint`);
		renderProgress(progress);
	}

	for (let i = output.length; i < subtitle.length; i++) {
		progress.done = i + 1;

		try {
			const cue = subtitle[i];
			const content = await options.app.service.process(i, subtitle, output);

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

			if (i % 10 === 0) {
				await saveCheckpoint(
					options.cmd.checkpoint,
					options,
					output,
					i + 1,
				);

				progress.status = chalk.yellow(`Progress saved to checkpoint`);
				renderProgress(progress);

				debug('cmd')(
					'Progress saved to checkpoint at %s',
					options.cmd.checkpoint,
				);

				continue;
			}

			// wait for 50ms to avoid rate limit
			await new Promise(resolve => setTimeout(resolve, 100));

			renderProgress(progress);
		} catch (error: any) {
			progress.status = chalk.red(
				`❌  Failed to translate cue: ${error.message}`,
			);
			renderProgress(progress);

			try {
				await saveCheckpoint(
					options.cmd.checkpoint,
					options,
					output,
					Math.min(output.length, subtitle.length),
				);

				progress.status = chalk.yellow(`Progress saved to checkpoint`);
				renderProgress(progress);
			} catch {
				// ignore
			}

			process.exit(1);
		}
	}

	await removeFile(options.cmd.checkpoint);
	progress.status = chalk.green(`Completed`);
	renderProgress(progress);

	return output;
};

export default TranslateCueAction;
