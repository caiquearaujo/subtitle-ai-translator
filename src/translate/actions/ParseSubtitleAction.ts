/* eslint-disable no-console */
import fs from 'node:fs';

import { parseSync, NodeCue } from 'subtitle';
import chalk from 'chalk';

import type { TranslateOptions } from '@/types/index.js';

/**
 * Parse the subtitle.
 *
 * @param options - The options to parse.
 * @returns The parsed options.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
const ParseSubtitleAction = (options: TranslateOptions): Array<NodeCue> => {
	try {
		const source = fs.readFileSync(options.source.abspath, 'utf8');
		const raw = parseSync(source);
		const cues: Array<NodeCue> = [];

		for (const node of raw) {
			if (node.type !== 'cue') {
				continue;
			}

			node.data.text = node.data.text.replace(/\n/g, ' ');
			cues.push(node);
		}

		return cues;
	} catch (error: any) {
		console.error(chalk.red('❌ Failed to parse subtitle.'));
		console.error(chalk.red(error.message));
		process.exit(1);
	}
};

export default ParseSubtitleAction;
