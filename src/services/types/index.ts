import { NodeCue } from 'subtitle';

/**
 * LLM Service interface.
 *
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export interface LLMService {
	/**
	 * Process the cue.
	 *
	 * @param cue - The cue to process.
	 * @param context - The context to process.
	 * @returns The processed cue.
	 */
	process(
		index: number,
		subtitle: Array<NodeCue>,
		output: Array<NodeCue>,
	): Promise<string | null>;

	/**
	 * The name of the service.
	 *
	 * @since 1.0.0
	 * @author Caique Araujo <caique@piggly.com.br>
	 */
	name: string;
}
