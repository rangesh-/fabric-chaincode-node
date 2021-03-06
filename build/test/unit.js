/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const gulp = require('gulp');
const mocha = require('gulp-mocha');
const shell = require('gulp-shell');
const istanbul = require('gulp-istanbul');
const Instrumenter = require('istanbul-api');

const instrumenter = function(opts) {
	return Instrumenter.libInstrument.createInstrumenter(opts);
};

gulp.task('instrument', function() {
	return gulp.src([
		'fabric-contract-api/lib/**/*.js',
		'fabric-shim/lib/**/*.js',
		'fabric-shim-crypto/lib/*.js'])
		.pipe(istanbul({instrumenter: instrumenter}))
		.pipe(istanbul.hookRequire());
});

gulp.task('typescript_check', shell.task([
	'npm run compile --prefix fabric-contract-api',
	'npm run compile --prefix fabric-shim',
], {
	verbose: true, // so we can see the docker command output
	ignoreErrors: false // once compile failed, throw error
}));

gulp.task('test-headless', ['clean-up', 'lint', 'typescript_check', 'instrument', 'protos'], function() {
	// this is needed to avoid a problem in tape-promise with adding
	// too many listeners to the "unhandledRejection" event
	process.setMaxListeners(0);

	return gulp.src([
		'fabric-contract-api/test/unit/**/*.js',
		'fabric-shim-crypto/test/**/*.js',
		'fabric-shim/test/unit/**/*.js'
	])
		.pipe(mocha({
			reporter: 'list'
		}))
		.pipe(istanbul.writeReports({
			reporters: ['lcov', 'json', 'text',
				'text-summary', 'cobertura','html']
		}))
		.pipe(istanbul.enforceThresholds({ thresholds: { global: 100 } }));
});
