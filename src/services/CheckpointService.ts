import type { NodeCue } from 'subtitle';

import { writeFile, unlink } from 'node:fs/promises';
import fs from 'node:fs';

import type { TranslateOptions } from '@/types/index.js';

/**
 * CheckpointService class.
 *
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
class CheckpointService {
	/**
	 * The options.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _options: TranslateOptions;

	/**
	 * Create a new CheckpointService instance.
	 *
	 * @param options - The options to process.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public constructor(options: TranslateOptions) {
		this._options = options;
	}

	/**
	 * Load the checkpoint.
	 *
	 * @param match - The match to load.
	 * @returns The loaded checkpoint.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public load(
		match?: Partial<{ source: string; target: string }>,
	): Array<NodeCue> {
		if (this._options.app.checkpoint === false) {
			return [];
		}

		try {
			if (!fs.existsSync(this._options.cmd.checkpoint)) {
				return [];
			}

			const raw = fs.readFileSync(this._options.cmd.checkpoint, 'utf8');
			const json = JSON.parse(raw);

			if (
				match &&
				((match.source && json?.meta?.source !== match.source) ||
					(match.target && json?.meta?.target !== match.target))
			) {
				return [];
			}

			return Array.isArray(json?.output)
				? (json.output as Array<NodeCue>)
				: [];
		} catch {
			return [];
		}
	}

	/**
	 * Remove the checkpoint.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public async remove(): Promise<void> {
		if (this._options.app.checkpoint === false) {
			return;
		}

		try {
			if (fs.existsSync(this._options.cmd.checkpoint)) {
				await unlink(this._options.cmd.checkpoint);
			}
		} catch {
			// ignore
		}
	}

	/**
	 * Save the checkpoint.
	 *
	 * @param output - The output to save.
	 * @param next_index - The next index to save.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public async save(
		output: Array<NodeCue>,
		next_index: number,
	): Promise<void> {
		if (this._options.app.checkpoint === false) {
			return;
		}

		await writeFile(
			this._options.cmd.checkpoint,
			JSON.stringify({
				meta: {
					next_index,
					source: this._options.cmd.source.abspath,
					target: this._options.cmd.target,
				},
				output,
				version: 1,
			}),
		);
	}
}

export default CheckpointService;
