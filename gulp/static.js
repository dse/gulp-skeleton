import gulp from 'gulp';
import { DIST, EXCLUDE_PARTIALS } from './constants.js';

export default function staticTask() {
    return gulp.src(['public/**/*', ...EXCLUDE_PARTIALS], { encoding: false })
               .pipe(gulp.dest(`${DIST}`));
}
