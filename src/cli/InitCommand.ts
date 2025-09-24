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
					'break = 42',
					'service = openai',
					'checkpoint = true',
					'debug = false',
					'',
					'[openai]',
					'model = gpt-5-mini',
					'temperature = 0.3',
					'api_key =',
					'reasoning = low',
					'timeout = 60000',
					'',
					'[ollama]',
					'model = qwen3:8b',
					'reasoning = true',
					'temperature = 0.3',
					'',
					'[google]',
					'model = gemini-2.0-flash',
					'temperature = 0.3',
					'api_key =',
					'',
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
