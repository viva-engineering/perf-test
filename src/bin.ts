
import * as yargs from 'yargs';
import { resolve } from 'path';
import { Suite } from './suite';
import { SimpleOutput } from './outputs/simple';

const args = yargs
	.scriptName('perf-test')
	.options('s', {
		alias: 'suite',
		type: 'string',
		describe: 'File path to the suite file to execute',
		require: true
	})
	.options('r', {
		alias: 'require',
		type: 'string',
		describe: 'File(s) to be required before executing the suite'
	})
	.help()
	.wrap(Math.min(yargs.terminalWidth(), 120))
	.argv;

const run = async () => {
	if (args.r) {
		if (Array.isArray(args.r)) {
			args.r.forEach((file) => requireFile(file));
		}

		else {
			requireFile(args.r);
		}
	}

	const { suite } = requireFile(args.s);

	if (! isSuite(suite)) {
		console.error(`Suite file "${args.s}" did not export a Suite object called "suite"`);
		process.exit(1);
	}

	const output = new SimpleOutput(suite);

	await suite.exec();
	await output.flush();
};

const isSuite = (suite: any) : suite is Suite => {
	return true;
};

const requireFile = (file: string) => {
	if (file.startsWith('./') || file.startsWith('../')) {
		return require(resolve(process.cwd(), file));
	}

	else {
		return require(file);
	}
};

run();
