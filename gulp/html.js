import gulp from 'gulp';
import { DIST, EXCLUDE_PARTIALS } from './constants.js';

export default function htmlTask() {
    return gulp.src(['src/pages/**/*.html', ...EXCLUDE_PARTIALS])
               .pipe(gulp.dest(`${DIST}`));
}
