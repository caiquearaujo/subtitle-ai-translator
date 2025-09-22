import type { NodeCue } from 'subtitle';

import type { TranslateOptions } from '@/types/index.js';

import { breakPosition } from '@/utils/index.js';

/**
 * Postprocessing the cues.
 *
 * @param options - The options to postprocess.
 * @param cues - The cues to postprocess.
 * @returns The postprocessed cues.
 */
const PostprocessingCuesAction = (
	options: TranslateOptions,
	cues: Array<NodeCue>,
): Array<NodeCue> => {
	for (const cue of cues) {
		const break_position = breakPosition(cue.data.text, options.app.break);

		if (break_position === -1) {
			continue;
		}

		cue.data.text = [
			cue.data.text.slice(0, break_position),
			cue.data.text.slice(break_position).trim(),
		].join('\n');
	}

	return cues;
};

export default PostprocessingCuesAction;
