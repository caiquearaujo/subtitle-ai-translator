import type { NodeCue } from 'subtitle';
import type OpenAI from 'openai';

import { homedir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import ini from 'ini';

import type { TranslateOptions, PathResolution } from '@/types/index.js';

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
