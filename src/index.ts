import { Command } from 'commander';

import TranslateCommand from '@/cli/TranslateCommand.js';

const program = new Command();

const commands = [TranslateCommand];
commands.forEach(command => command(program));

program.parse(process.argv);
