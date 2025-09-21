/* eslint-disable no-console */
import { Command } from 'commander';
import chalk from 'chalk';
import debug from 'debug';

import ParseOptionsAction from '@/translate/actions/ParseOptionsAction.js';

const GenerateAppKeysCommand = (program: Command) => {
	program
		.command('translate')
		.description('Translate a STR file to an specific language.')
		.option('-s, --source <path>', 'Source file. It must be a STR file.')
		.option(
			'-t, --target <language>',
			'Target language. It must be a valid language code in ISO 639-1 format.',
		)
		.option(
			'-o, --output <path>',
			'Output path. Name will be the same as the source file, but with the target language code. If not provided, it will be saved in the same directory as the source file.',
		)
		.option(
			'-b, --break <length>',
			'Break the text into lines of the specified length.',
		)
		.action(async op => {
			try {
				const options = ParseOptionsAction(op);
				debug('cmd')('Translate Options: %o', options);

				process.exit(0);
			} catch (error: any) {
				console.error(chalk.red(error.message));
				process.exit(1);
			}
		});
};

export default GenerateAppKeysCommand;
