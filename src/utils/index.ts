import type { NodeCue } from 'subtitle';
import type OpenAI from 'openai';

import { writeFile, unlink } from 'node:fs/promises';
import readline from 'node:readline';
import { homedir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import chalk from 'chalk';
import ini from 'ini';

import type {
	TranslateOptions,
	PathResolution,
	Progress,
} from '@/types/index.js';

/**
 * Parse the absolute path of the file.
 *
 * @param abspath - The absolute path of the file.
 * @returns The absolute path of the file.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const resolveAbspath = (abspath: string): PathResolution => {
	const _abspath = path.resolve(abspath);

	const data = {
		abspath: _abspath,
		extension: path.extname(_abspath),
		filename: path.basename(_abspath, path.extname(_abspath)),
		path: path.dirname(_abspath),
	};

	if (fs.existsSync(data.path) === false) {
		throw new Error(`"${data.path}" does not exist.`);
	}

	if (data.filename.length !== 0 && data.extension !== '') {
		if (fs.existsSync(data.abspath) === false) {
			throw new Error(`File "${data.abspath}" does not exist.`);
		}

		// @todo evaluate mime-type from file binary
		if (data.extension !== '.srt') {
			throw new Error('Invalid file extension. It must be a STR file.');
		}
	}

	return data;
};

/**
 * Generate the translation prompt.
 *
 * @param options - The options to translate.
 * @param cue - The cue to translate.
 * @param context - The context to translate.
 * @returns The translation prompt.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const translationPrompt = (
	options: TranslateOptions,
	cue: NodeCue,
	context?: Partial<{ next: NodeCue; previous: Array<NodeCue> }>,
): Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> => {
	const content = [
		`Target language to translate to: ${options.cmd.target}`,
		'Formality: neutral-informal',
		'Profanity policy: keep original intensity',
		'\n',
	];

	if (context?.previous && context.previous.length > 0) {
		content.push(
			`CONTEXT (PREVIOUS LINES) >>> ${context.previous.map(p => p.data.text).join('\n')}`,
		);
	}

	if (context?.next) {
		content.push(`CONTEXT (NEXT LINE) >>> ${context.next.data.text}`);
	}

	content.push(`CURRENT LINE >>> ${cue.data.text}`);

	const messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> = [
		{
			content: [
				'You are a professional subtitle/localization translator.',
				'INPUT: The CURRENT LINE of subtitle text (no timestamps).',
				'INPUT FORMAT: <meaning> >>> <line>',
				'TASK: translate CURRENT LINE into the requested target locale in natural, idiomatic language.',
				'Keep meaning, tone, and register; do not add explanations or metadata.',
				'Preserve numbers, brand/character names, emojis, URLs, and placeholders such as {name} or markup such as <i>…</i>.',
				'Respect any glossary/style notes present in chat history.',
				'If context is provided in the user message, use it; otherwise prefer the most neutral reading.',
				'Avoid to use unnatural or complex words when translating to target language. Keep it simple and natural.',
				'OUTPUT: only the translated line (single line), no quotes, no brackets, no extra text.',
			].join('\n'),
			role: 'system',
		},
		{
			content: content.join('\n'),
			role: 'user',
		},
	];

	return messages;
};

/**
 * Get the completion.
 *
 * @param options - The options to get the completion.
 * @param openai - The openai to get the completion.
 * @param subtitle - The subtitle to get the completion.
 * @param output - The output to get the completion.
 * @param cue - The cue to get the completion.
 * @param i - The index to get the completion.
 * @returns The completion.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const getCompletion = async (
	options: TranslateOptions,
	openai: OpenAI,
	subtitle: Array<NodeCue>,
	output: Array<NodeCue>,
	cue: NodeCue,
	i: number,
): Promise<string | null> => {
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

	return completion.choices[0].message.content;
};

/**
 * Load the config.ini file.
 *
 * @returns The config.ini file.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const loadConfigIni = () => {
	const config = ini.parse(
		fs.readFileSync(
			path.resolve(homedir(), '.config/subtitle-ai-translator.ini'),
			'utf8',
		),
	);

	return config;
};

/**
 * Try to load a checkpoint file.
 *
 * Returns the saved output cues if present and compatible.
 *
 * @param checkpoint_path - The checkpoint path.
 * @param match - The match to load.
 * @returns The loaded checkpoint.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const loadCheckpoint = (
	options: TranslateOptions,
	subtitle: Array<NodeCue>,
	match?: Partial<{ source: string; target: string }>,
): { output: Array<NodeCue>; progress: Progress } => {
	const progress: Progress = {
		done: 0,
		start_time: Date.now(),
		total: subtitle.length,
	};

	progress.onFlush = () => {
		progress.status = undefined;
	};

	try {
		if (!fs.existsSync(options.cmd.checkpoint)) {
			return { output: [], progress };
		}

		const raw = fs.readFileSync(options.cmd.checkpoint, 'utf8');
		const json = JSON.parse(raw);

		if (
			match &&
			((match.source && json?.meta?.source !== match.source) ||
				(match.target && json?.meta?.target !== match.target))
		) {
			return { output: [], progress };
		}

		return {
			output: Array.isArray(json?.output)
				? (json.output as Array<NodeCue>)
				: [],
			progress,
		};
	} catch {
		return { output: [], progress };
	}
};

/**
 * Save the current output into a checkpoint file.
 *
 * @param file - The file to save.
 * @param options - The options to save.
 * @param output - The output to save.
 * @param next_index - The next index to save.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const saveCheckpoint = async (
	file: string,
	options: TranslateOptions,
	output: Array<NodeCue>,
	next_index: number,
) => {
	await writeFile(
		file,
		JSON.stringify({
			meta: {
				next_index,
				source: options.cmd.source.abspath,
				target: options.cmd.target,
			},
			output,
			version: 1,
		}),
	);
};

/**
 * Remove a file if it exists.
 *
 * @param file - The file to remove.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const removeFile = async (file: string) => {
	try {
		if (fs.existsSync(file)) {
			await unlink(file);
		}
	} catch {
		// ignore
	}
};

/**
 * Find the break position.
 *
 * @param text - The text to find the break position.
 * @param break_len - The break length.
 * @returns The break position.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const breakPosition = (text: string, break_len: number): number => {
	if (text.length <= break_len) {
		return -1;
	}

	const space_positions: Array<number> = [];

	for (let i = 0; i < text.length; i++) {
		if (text[i] === ' ') {
			space_positions.push(i);
		}
	}

	const closest_position = space_positions.reduce((closest, current) => {
		return Math.abs(current - break_len) < Math.abs(closest - break_len)
			? current
			: closest;
	}, space_positions[0]);

	return closest_position;
};

/** Application Progress */
/**
 * Pad a number.
 *
 * @param number - The number to pad.
 * @param length - The length to pad.
 * @returns The padded number.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const padNumber = (number: number, length: number = 2): string => {
	return number.toString().padStart(length, '0');
};

/**
 * Get the visible width of a string.
 *
 * @param s - The string to get the visible width.
 * @returns The visible width.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const visibleWidth = (s: string): number => {
	return stringWidth(stripAnsi(s));
};

/**
 * Calculate the bar width.
 *
 * @param prefix - The prefix to calculate the bar width.
 * @param suffix - The suffix to calculate the bar width.
 * @param min - The minimum width.
 * @returns The bar width.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const calcBarWidth = (prefix: string, suffix: string, min = 10) => {
	const columns = process.stdout.isTTY ? (process.stdout.columns ?? 80) : 80;
	const fixed = visibleWidth(prefix) + 1 + 1 + visibleWidth(suffix);
	return Math.max(min, columns - fixed);
};

/**
 * Format a duration.
 *
 * @param ms - The duration to format.
 * @returns The formatted duration.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const displayDuration = (ms: number): string => {
	if (Number.isFinite(ms) === false) {
		return '--:--:--';
	}

	const total_seconds = Math.floor(ms / 1000);
	const hours = Math.floor(total_seconds / 3600);
	const minutes = Math.floor((total_seconds % 3600) / 60);
	const seconds = total_seconds % 60;

	if (hours > 0) {
		return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
	}

	return `${padNumber(minutes)}:${padNumber(seconds)}`;
};

/**
 * Display the progress.
 *
 * @param ratio - The ratio to display.
 * @param width - The width to display.
 * @returns The progress.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const displayProgress = (ratio: number, width: number = 32): string => {
	const clamped = Math.max(0, Math.min(1, ratio));
	const filled = Math.round(clamped * width);
	const empty = width - filled;

	return `${chalk.green('█'.repeat(filled))}${chalk.dim('░'.repeat(Math.max(0, empty)))}`;
};

/**
 * Render the progress.
 *
 * @param progress - The progress to render.
 * @param bootstrap - Whether to bootstrap the progress.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const renderProgress = (
	progress: Progress,
	bootstrap: boolean = false,
) => {
	if (process.stdout.isTTY === false) {
		return;
	}

	const ratio = progress.total > 0 ? progress.done / progress.total : 0;
	const percentage = Math.round(ratio * 100);
	const elapsed = Date.now() - progress.start_time;
	const eta =
		progress.done > 0
			? (elapsed / progress.done) * (progress.total - progress.done)
			: Number.POSITIVE_INFINITY;

	const prefix = `${progress.done + 1} of ${progress.total} ${String(percentage).padStart(3)}%`;
	const suffix = `${chalk.dim('ETA')} ${displayDuration(eta)}`;
	const bar = displayProgress(ratio, calcBarWidth(prefix, suffix));

	const line_one = [prefix, bar, suffix];
	const line_two = progress.status ? [chalk.dim(progress.status)] : [];

	if (bootstrap) {
		process.stdout.write(`${line_one.join(' ')}\n${line_two.join(' ')}`);

		if (progress.onFlush) {
			progress.onFlush();
		}

		return;
	}

	readline.moveCursor(process.stdout, 0, -2);
	readline.cursorTo(process.stdout, 0);

	readline.clearLine(process.stdout, 0);
	process.stdout.write(`\x1B[2K${line_one.join(' ')}\n`);
	readline.clearLine(process.stdout, 0);
	process.stdout.write(`\x1B[2K${line_two.join(' ')}\n`);

	if (progress.onFlush) {
		progress.onFlush();
	}
};
