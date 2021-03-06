/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

var gulp = require('gulp');
var jsdoc = require('gulp-jsdoc3');
var fs = require('fs-extra');
const path=require('path');
const replace = require('gulp-replace');
let currentBranch=process.env.GERRIT_BRANCH;

if (!currentBranch){
	currentBranch='master';
}


let docsRoot;
if (process.env.DOCS_ROOT){
	docsRoot = process.env.DOCS_ROOT;
} else {
	docsRoot = './docs/gen';
}

gulp.task('clean', function(){
	return fs.removeSync(path.join(docsRoot,currentBranch));
});

let docSrc = [
	'fabric-shim/README.md',
	'fabric-shim/lib/chaincode.js',
	'fabric-shim/lib/stub.js',
	'fabric-shim/lib/iterators.js'
];


gulp.task('jsdocs', ['clean'], function (cb) {
	gulp.src(docSrc, { read: false }).pipe(
		jsdoc({
			opts: {
				tutorials: './docs/tutorials',
				destination: path.join(docsRoot,currentBranch)
			},
			templates: {
				systemName: 'Hyperledger Fabric node.js Shim',
				theme: 'cosmo'
			}
		},cb)
	);
});


gulp.task('docs-dev',['docs'], function(){
	gulp.watch(docSrc,['docs']);
});


gulp.task('docs',['jsdocs'],()=>{

	const relativePath = '.';
	const packageJson = require(path.join(__dirname,'..','package.json'));
	let mapping = ['ClientIdentity',
		'ChaincodeFromContract',
		'CommonIterator',
		'ChaincodeInterface',
		'ChaincodeStub',
		'HistoryQueryIterator',
		'ChaincodeStub.SignedProposal',
		'Shim',
		'Meta',
		'StateQueryIterator'
	];

	mapping = mapping.map((e)=>{
		return `'${e}.html'`;
	});

	// jsdocs produced
	// if this is the master build then we need to ensure that the index.html and
	// the 404.html page are properly setup and configured.
	if (currentBranch==='master'){
		gulp.src('./docs/redirectTemplates/*.html' )
			.pipe(replace('LATEST__VERSION',packageJson.docsLatestVersion))
			.pipe(replace('FILENAME__MAPPING',mapping.join(',')))
			.pipe(replace('RELATIVE__PATH',relativePath))
			.pipe(gulp.dest(docsRoot));
	} else {
		console.log(`Not updating or routing logic, as not master branch - it is ${currentBranch}`);  // eslint-disable-line no-console
	}
});
