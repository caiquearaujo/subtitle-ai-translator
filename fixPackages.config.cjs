const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname);

function create(abspath, type) {
	var packageJsonFile = path.join(abspath, '/package.json');

	if (!fs.existsSync(packageJsonFile)) {
		fs.writeFile(
			packageJsonFile,
			new Uint8Array(Buffer.from(`{"type": "${type}"}`)),
			function (err) {
				if (err) {
					throw err;
				}
			},
		);
	}
}

function fix() {
	fs.readdir(path.join(buildDir, 'build'), function (err, dirs) {
		if (err) {
			return console.warn(err.message);
		}

		create(path.join(buildDir, 'build'), 'module');
	});
}

fix();
