/* eslint-disable no-console */
import chalk from 'chalk';
import z from 'zod';

import type { TranslateOptions } from '@/types/index.js';

import { resolveAbspath } from '@/utils/index.js';

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
		const parsed = z
			.object({
				break: z.coerce
					.number({ message: 'Break length must be a number.' })
					.int({ message: 'Break length must be an integer.' })
					.positive({ message: 'Break length must be a positive number.' })
					.optional()
					.default(42),
				output: z
					.string({ message: 'Output path is required.' })
					.optional(),
				source: z.string({ message: 'Source path is required.' }).min(1, {
					message: 'Source path is required.',
				}),
				target: z
					.string({ message: 'Target language is required.' })
					.regex(/^[a-z]{2}-[A-Z]{2}$/, {
						message: 'Target language must be in ISO 639-1 format.',
					}),
			})
			.safeParse(op);

		if (!parsed.success) {
			console.error(chalk.red('❌ Invalid options, you must provide:\n'));

			const messages = parsed.error.issues.map(issue => issue.message);
			console.error(chalk.red(messages.join('\n')));
			process.exit(1);
		}

		const source = resolveAbspath(parsed.data.source);
		const output = {
			abspath: source.abspath.replace(
				source.filename,
				`${source.filename}.${parsed.data.target}`,
			),
			extension: source.extension,
			filename: `${source.filename}.${parsed.data.target}`,
			path: source.path,
		};

		if (parsed.data.output) {
			const _output = resolveAbspath(parsed.data.output);
			output.path = _output.path;
			output.abspath = _output.abspath;
		}

		return {
			break: parsed.data.break,
			output,
			source,
			target: parsed.data.target,
		};
	} catch (error: any) {
		console.error(chalk.red(error.message));
		process.exit(1);
	}
};

export default ParseOptionsAction;
