import type { NodeCue } from 'subtitle';

import chalk from 'chalk';
import debug from 'debug';

import type { TranslateOptions } from '@/types/index.js';

import CheckpointService from '@/services/CheckpointService.js';
import ProgressService from '@/services/ProgressService.js';

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
	const checkpoint = new CheckpointService(options);
	const progress = new ProgressService(options);

	const output = checkpoint.load({
		source: options.cmd.source.abspath,
		target: options.cmd.target,
	});

	// @note bootstrap the progress
	progress.bootstrap(subtitle.length);

	if (output.length > 0) {
		progress.status(chalk.yellow(`Resuming from checkpoint`));
	}

	for (let i = output.length; i < subtitle.length; i++) {
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

			options.app.log.line(i, subtitle.length, cue.data.text, content);

			if (i % 10 === 0) {
				await checkpoint.save(output, i + 1);
				progress.status(chalk.yellow(`Progress saved to checkpoint`));

				debug('cmd')(
					'Progress saved to checkpoint at %s',
					options.cmd.checkpoint,
				);

				continue;
			}

			// wait for 50ms to avoid rate limit
			await new Promise(resolve => setTimeout(resolve, 100));

			progress.step(i);
		} catch (error: any) {
			progress.status(
				chalk.red(`❌  Failed to translate cue: ${error.message}`),
			);

			try {
				await checkpoint.save(
					output,
					Math.min(output.length, subtitle.length),
				);

				progress.status(chalk.yellow(`Progress saved to checkpoint`));
			} catch {
				// ignore
			}

			options.app.log.debug(error);
			process.exit(1);
		}
	}

	await checkpoint.remove();
	progress.status(chalk.green(`Completed`));

	return output;
};

export default TranslateCueAction;
