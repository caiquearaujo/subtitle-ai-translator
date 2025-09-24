import type { NodeCue } from 'subtitle';

import type { TranslateOptions } from '@/types/index.js';

import { wrapLine } from '@/utils/index.js';

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
		cue.data.text = wrapLine(cue.data.text, options.app.break);
	}

	return cues;
};

export default PostprocessingCuesAction;
