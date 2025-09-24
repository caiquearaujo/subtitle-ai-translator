/* eslint-disable no-console */

import chalk from 'chalk';

/**
 * LogService class.
 *
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
class LogService {
	/**
	 * The debug mode.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _debug: boolean;

	/**
	 * Create a new LogService instance.
	 *
	 * @param debug - The debug mode.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public constructor(debug: boolean) {
		this._debug = debug;
	}

	/**
	 * Log a debug message.
	 *
	 * @param message - The message to log.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public debug(...args: any[]) {
		if (this._debug === false) {
			return;
		}

		console.debug(...args);
	}

	/**
	 * Log a line.
	 *
	 * @param original - The original line.
	 * @param translated - The translated line.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public line(
		index: number,
		length: number,
		original: string,
		translated: string,
	) {
		if (this._debug === false) {
			return;
		}

		console.debug(
			chalk.yellow('Line %d of %d translated'),
			index + 1,
			length,
		);

		console.debug('Original line', '\n', chalk.blue(original));
		console.debug('Translated line', '\n', chalk.green(translated));
		console.debug('');
	}
}

export default LogService;
