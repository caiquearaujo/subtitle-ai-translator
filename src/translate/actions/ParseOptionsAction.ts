/* eslint-disable no-console */
import chalk from 'chalk';
import z from 'zod';

import type { TranslateOptions } from '@/types/index.js';

import { resolveAbspath, loadConfigIni } from '@/utils/index.js';

/**
 * Parse the options.
 *
 * @param op - The options to parse.
 * @returns The parsed options.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const ParseOptionsAction = (op: any): TranslateOptions => {
	try {
		const config = loadConfigIni();

		const parsed = z
			.object({
				app: z.object({
					api_key: z.string({ message: 'OpenAI API key is required.' }),
					break: z.coerce
						.number({ message: 'Break length must be a number.' })
						.int({ message: 'Break length must be an integer.' })
						.positive({
							message: 'Break length must be a positive number.',
						})
						.optional()
						.default(42),
					model: z
						.string({ message: 'OpenAI model is required.' })
						.optional()
						.default('gpt-5-mini'),
					temperature: z.coerce
						.number({ message: 'Temperature must be a number.' })
						.min(0, { message: 'Temperature must be greater than 0.' })
						.max(1, { message: 'Temperature must be less than 1.' })
						.optional()
						.default(0.3),
				}),
				cmd: z.object({
					output: z
						.string({ message: 'Output path is required.' })
						.optional(),
					source: z
						.string({ message: 'Source path is required.' })
						.min(1, {
							message: 'Source path is required.',
						}),
					target: z
						.string({ message: 'Target language is required.' })
						.regex(/^[a-z]{2}-[A-Z]{2}$/, {
							message: 'Target language must be in ISO 639-1 format.',
						}),
				}),
			})
			.safeParse({
				...config,
				cmd: op,
			});

		if (!parsed.success) {
			console.error(chalk.red('❌ Invalid options, you must provide:\n'));

			const messages = parsed.error.issues.map(issue => issue.message);
			console.error(chalk.red(messages.join('\n')));
			process.exit(1);
		}

		const source = resolveAbspath(parsed.data.cmd.source);
		const output = {
			abspath: source.abspath.replace(
				source.filename,
				`${source.filename}.${parsed.data.cmd.target}`,
			),
			extension: source.extension,
			filename: `${source.filename}.${parsed.data.cmd.target}`,
			path: source.path,
		};

		if (parsed.data.cmd.output) {
			const _output = resolveAbspath(parsed.data.cmd.output);
			output.path = _output.path;
			output.abspath = _output.abspath;
		}

		return {
			app: {
				api_key: parsed.data.app.api_key,
				break: parsed.data.app.break,
				model: parsed.data.app.model,
				temperature: parsed.data.app.temperature,
			},
			cmd: {
				output: output,
				source: source,
				target: parsed.data.cmd.target,
			},
		};
	} catch (error: any) {
		console.error(chalk.red(error.message));
		process.exit(1);
	}
};

export default ParseOptionsAction;
