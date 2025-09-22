/* eslint-disable no-console */
import { writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { Command } from 'commander';
import chalk from 'chalk';

const InitCommand = (program: Command) => {
	program
		.command('init')
		.description('Create the configuration file on home directory.')
		.action(async () => {
			try {
				const content = [
					'[app]',
					'model = gpt-5-mini',
					'temperature = 0.3',
					'api_key =',
					'break = 42',
				];

				const file = path.resolve(
					homedir(),
					'.config/subtitle-ai-translator.ini',
				);

				await writeFile(file, content.join('\n'), {
					flag: 'wx',
					mode: 0o600,
				});

				console.log(
					chalk.green(
						`✅ Configuration file created successfully at ${file}`,
					),
				);
			} catch (error: any) {
				console.error(chalk.red(error.message));
				process.exit(1);
			}
		});
};

export default InitCommand;
