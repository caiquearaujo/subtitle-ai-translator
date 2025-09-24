import { homedir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import ini from 'ini';

import type { PathResolution } from '@/types/index.js';

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

/**
 * Wrap the line.
 *
 * @param input - The input to wrap.
 * @param break_len - The break length.
 * @returns The wrapped line.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const wrapLine = (input: string, break_len: number): string => {
	const text = (input ?? '')
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/\s+([—–])\s+/g, '\n$1');

	const segments = text
		.split('\n')
		.map(s => s.trim())
		.filter(Boolean);

	const out: string[] = [];

	for (const seg of segments) {
		const break_position = breakPosition(seg, break_len);

		if (break_position === -1) {
			out.push(seg);
			continue;
		}

		out.push(seg.slice(0, break_position));
		out.push(seg.slice(break_position).trim());
	}

	return out.join('\n');
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
export const padNumber = (number: number, length: number = 2): string => {
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
export const visibleWidth = (s: string): number => {
	return stringWidth(stripAnsi(s));
};
