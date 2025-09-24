import type { NodeCue } from 'subtitle';

import chalk from 'chalk';

import LogService from '@/services/LogService.js';

/**
 * BaseLLMService class.
 *
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
abstract class BaseLLMService {
	/**
	 * The log service.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _log: LogService;

	/**
	 * The target language.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _target_language: string;

	/**
	 * Create a new BaseLLMService instance.
	 *
	 * @param target_language - The target language.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	public constructor(target_language: string, log: LogService) {
		this._target_language = target_language;
		this._log = log;
	}

	/**
	 * The translation prompt.
	 *
	 * @param target_language - The target language.
	 * @param cue - The cue.
	 * @param context - The context.
	 * @returns The translation prompt.
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	protected _translationPrompt(
		cue: NodeCue,
		context?: Partial<{ next: NodeCue; previous: Array<NodeCue> }>,
	): Array<{ content: string; role: 'system' | 'user' }> {
		const content = ['INPUT:'];

		if (context?.previous && context.previous.length > 0) {
			content.push(
				`CONTEXT (PREVIOUS LINES) >>> ${context.previous.map(p => p.data.text).join(' ')}`,
			);
		}

		if (context?.next) {
			content.push(`CONTEXT (NEXT LINE) >>> ${context.next.data.text}`);
		}

		content.push(`CURRENT LINE >>> ${cue.data.text}`);

		const messages: Array<{ content: string; role: 'system' | 'user' }> = [
			{
				content: [
					'You are a professional subtitle/localization translator.',
					'',
					'INPUT FORMAT will be "<TYPE> >>> <LINE CONTENT>", you should translate ONLY the LINE CONTENT of CURRENT LINE. Input will include:',
					'- An optional CONTEXT (PREVIOUS LINES);',
					'- An optional CONTEXT (NEXT LINE);',
					'- A CURRENT LINE of subtitle text (no timestamps).',
					'',
					'YOUR TASK:',
					'- Translate the LINE CONTENT of CURRENT LINE into the requested target locale in natural, idiomatic language;',
					'- Keep meaning, tone and register; Do not add any explanations or metadata to response;',
					'- Preserve numbers, brand/character names, emojis, URLs, formatting, and placeholders or HTML/tags markups such as <i>...</i>, [i]...[/i];',
					'- Respect any glossary/style notes present in chat history;',
					'- Avoid to use unnatural or complex words when translating to target language. Keep it simple and natural;',
					'- Keep attention to the context to keep gender, references and consistency;',
					'- Try to follow the same formatting of CURRENT LINE. If CURRENT LINE start with lower case, keep that;',
					'- You may use context to help you guide yourself while translating CURRENT LINE. If there is a previous lines, current line must to soft connect to them if make sense.',
					'',
					'OUTPUT:',
					'- You should response witl ONLY the translated line (single line), no quotes, no brackets, no extra text;',
					'- MAKE SURE TO ONLY OUTPUT THE TRANSLATED LINE, NO OTHER TEXT. If you do chain of thought, make sure to do it internally and not to output it.',
					'',
					'SCOPE OF RESPONSIBILITY:',
					`- Translate to ${this._target_language};`,
					'- Formality: informal;',
					'- Profanity policy: keep original intensity.',
					'',
				].join('\n'),
				role: 'system',
			},
			{
				content: content.join('\n'),
				role: 'user',
			},
		];

		this._log.debug(
			chalk.blue('Translation Prompt'),
			'\n',
			chalk.yellow('>>>'),
			'\n',
			`${messages[0].content}\n${messages[1].content}`,
			'\n',
			chalk.yellow('<<<'),
			'\n',
		);

		return messages;
	}
}

export default BaseLLMService;
