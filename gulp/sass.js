import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';

import { DIST, EXCLUDE_PARTIALS } from './constants.js';

const sass = gulpSass(dartSass);

import config from './config.cjs';
const { sassConfig } = config;

export default function sassTask() {
    return gulp.src(['src/styles/**/*.scss', ...EXCLUDE_PARTIALS])
               .pipe(sass(sassConfig))
    // .pipe(postcss([autoprefixer]))
               .pipe(gulp.dest(`${DIST}/split-flap/styles`));
}
