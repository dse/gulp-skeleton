/*jshint module: false, strict: global */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

let config;

if (fs.existsSync('.buildconfig.js')) {
    throw new Error(`.buildconfig.js not supported!  You must use .buildconfig.cjs.`);
} else if (fs.existsSync('.buildconfig.cjs')) {
    config = require(path.resolve('.buildconfig.cjs'));
} else if (fs.existsSync('.buildconfig.json')) {
    config = JSON.parse(fs.readFileSync('.buildconfig.json').toString());
} else {
    config = {};
}

module.exports = config;
