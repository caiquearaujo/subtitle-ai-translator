import readline from 'node:readline';

import chalk from 'chalk';

import type { TranslateOptions, Progress } from '@/types/index.js';

import { visibleWidth, padNumber } from '@/utils/index.js';

/**
 * ProgressService class.
 *
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
class ProgressService {
	/**
	 * The bootstrap.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _bootstrap: boolean = true;

	/**
	 * The options.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _options: TranslateOptions;

	/**
	 * The progress.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _progress: Progress;

	/**
	 * Create a new ProgressService instance.
	 *
	 * @param options - The options to process.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public constructor(options: TranslateOptions) {
		const progress: Progress = {
			done: 0,
			start_time: Date.now(),
			total: 0,
		};

		progress.onFlush = () => {
			progress.status = undefined;
		};

		this._options = options;
		this._progress = progress;
	}

	/**
	 * Bootstrap the progress.
	 *
	 * @returns The progress service.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public bootstrap(length: number): this {
		this._bootstrap = true;
		this._progress.done = 0;
		this._progress.start_time = Date.now();
		this._progress.status = undefined;
		this._progress.total = length;

		this._render();
		return this;
	}

	/**
	 * Set the status.
	 *
	 * @param status - The status to set.
	 * @returns The progress service.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public status(status: string) {
		this._progress.status = status;
		this._render();
		return this;
	}

	/**
	 * Set the progress.
	 *
	 * @returns The progress service.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public step(step: number): this {
		this._progress.done = step;
		this._render();
		return this;
	}

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
	protected _calcBarWidth(prefix: string, suffix: string, min = 10) {
		const columns = process.stdout.isTTY
			? (process.stdout.columns ?? 80)
			: 80;
		const fixed = visibleWidth(prefix) + 1 + 1 + visibleWidth(suffix);
		return Math.max(min, columns - fixed);
	}

	/**
	 * Display the duration.
	 *
	 * @param ms - The duration in milliseconds.
	 * @returns The duration.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _displayDuration(ms: number): string {
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
	}

	/**
	 * Display the progress.
	 *
	 * @param ratio - The ratio to display.
	 * @param width - The width to display.
	 * @returns The progress.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _displayProgress(ratio: number, width: number = 32): string {
		const clamped = Math.max(0, Math.min(1, ratio));
		const filled = Math.round(clamped * width);
		const empty = width - filled;

		return `${chalk.green('█'.repeat(filled))}${chalk.dim('░'.repeat(Math.max(0, empty)))}`;
	}

	/**
	 * Render the progress.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _render() {
		if (process.stdout.isTTY === false || this._options.app.debug) {
			return;
		}

		const _done = this._progress.done + 1;

		const ratio = this._progress.total > 0 ? _done / this._progress.total : 0;
		const percentage = Math.round(ratio * 100);
		const elapsed = Date.now() - this._progress.start_time;
		const eta =
			_done > 0
				? (elapsed / _done) * (this._progress.total - _done)
				: Number.POSITIVE_INFINITY;

		const prefix = `${_done} of ${this._progress.total} ${String(percentage).padStart(3)}%`;
		const suffix = `${chalk.dim('ETA')} ${this._displayDuration(eta)}`;
		const bar = this._displayProgress(
			ratio,
			this._calcBarWidth(prefix, suffix),
		);

		const line_one = [prefix, bar, suffix];
		const line_two = this._progress.status
			? [chalk.dim(this._progress.status)]
			: [];

		if (this._bootstrap) {
			process.stdout.write(`${line_one.join(' ')}\n${line_two.join(' ')}`);

			if (this._progress.onFlush) {
				this._progress.onFlush();
			}

			this._bootstrap = false;
			return;
		}

		readline.moveCursor(process.stdout, 0, -2);
		readline.cursorTo(process.stdout, 0);

		readline.clearLine(process.stdout, 0);
		process.stdout.write(`\x1B[2K${line_one.join(' ')}\n`);
		readline.clearLine(process.stdout, 0);
		process.stdout.write(`\x1B[2K${line_two.join(' ')}\n`);

		if (this._progress.onFlush) {
			this._progress.onFlush();
		}
	}
}

export default ProgressService;
