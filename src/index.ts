import { Command } from 'commander';

import TranslateCommand from '@/cli/TranslateCommand.js';
import InitCommand from '@/cli/InitCommand.js';

const program = new Command();

const commands = [TranslateCommand, InitCommand];
commands.forEach(command => command(program));

program.parse(process.argv);
