import path from 'node:path';
import fs from 'node:fs';

import type { PathResolution } from '@/types/index.js';

/**
 * Parse the absolute path of the file.
 *
 * @param abspath - The absolute path of the file.
 * @returns The absolute path of the file.
 * @since 1.0.0
 * @author Caique Araujo <caique@piggly.com.br>
 */
export const resolveAbspath = (abspath: string): PathResolution => {
	const _abspath = path.resolve(abspath);

	const data = {
		abspath: _abspath,
		extension: path.extname(_abspath),
		filename: path.basename(_abspath, path.extname(_abspath)),
		path: path.dirname(_abspath),
	};

	if (fs.existsSync(data.path) === false) {
		throw new Error(`"${data.path}" does not exist.`);
	}

	if (data.filename.length !== 0 && data.extension !== '') {
		if (fs.existsSync(data.abspath) === false) {
			throw new Error(`File "${data.abspath}" does not exist.`);
		}

		// @todo evaluate mime-type from file binary
		if (data.extension !== '.srt') {
			throw new Error('Invalid file extension. It must be a STR file.');
		}
	}

	return data;
};
