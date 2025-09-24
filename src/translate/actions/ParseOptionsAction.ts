/* eslint-disable no-console */
import path from 'node:path';

import chalk from 'chalk';
import z from 'zod';

import type { SupportedServices, TranslateOptions } from '@/types/index.js';
import type { LLMService } from '@/services/types/index.js';

import { resolveAbspath, loadConfigIni } from '@/utils/index.js';
import OpenAiLLMService from '@/services/OpenAiLLMService.js';
import OllamaLLMService from '@/services/OllamaLLMService.js';
import LogService from '@/services/LogService.js';

/**
 * Solve the service.
 *
 * @param service - The service to solve.
 * @param config - The config to solve.
 * @param target_language - The target language to solve.
 * @returns The solved service.
 */
const SolveService = (
	service: SupportedServices,
	target_language: string,
	log: LogService,
	config: Record<string, any>,
): LLMService => {
	if (service === 'openai') {
		return new OpenAiLLMService(config.openai, target_language, log);
	}

	return new OllamaLLMService(config.ollama, target_language, log);
};

/**
 * Display the options.
 *
 * @param options - The options to display.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const DisplayOptions = (options: TranslateOptions) => {
	console.log(
		chalk.yellow('LLM Service:'),
		chalk.white(options.app.service.name),
	);
	console.log(
		chalk.yellow('Subtitle File:'),
		chalk.white(options.cmd.source.abspath),
	);
	console.log(
		chalk.yellow('Target Language:'),
		chalk.white(options.cmd.target),
	);
	console.log(
		chalk.yellow('Output File:'),
		chalk.white(options.cmd.output.abspath),
	);

	if (options.app.debug) {
		console.log(chalk.blue('Debug mode enabled'));
	}
};

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
					break: z.coerce
						.number({ message: 'Break length must be a number.' })
						.int({ message: 'Break length must be an integer.' })
						.positive({
							message: 'Break length must be a positive number.',
						})
						.optional()
						.default(42),
					checkpoint: z.coerce.boolean().optional().default(false),
					debug: z.coerce.boolean().optional().default(false),
					service: z
						.enum(['openai', 'ollama'], {
							message: 'LLM service is required.',
						})
						.optional()
						.default('openai'),
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

		const log = new LogService(parsed.data.app.debug);

		const opts = {
			app: {
				break: parsed.data.app.break,
				checkpoint: parsed.data.app.checkpoint,
				debug: parsed.data.app.debug,
				log: log,
				service: SolveService(
					parsed.data.app.service,
					parsed.data.cmd.target,
					log,
					config,
				),
			},
			cmd: {
				checkpoint: path.resolve(
					output.path,
					`${output.filename}.checkpoint.json`,
				),
				output: output,
				source: source,
				target: parsed.data.cmd.target,
			},
		};

		DisplayOptions(opts);

		return opts;
	} catch (error: any) {
		console.error(chalk.red(error.message));
		process.exit(1);
	}
};

export default ParseOptionsAction;
