import gulp from 'gulp';
import { EXCLUDE_TEMP_FILES } from './constants.js';
import htmlTask from './html.js';
import nunjucksTask from './nunjucks.js';
import sassTask from './sass.js';
import rollupTask from './rollup.js';
import { reloadTask } from './server.js';

export default function watchTask() {
    // never completes
    gulp.watch(['src/pages/**/*.html', ...EXCLUDE_TEMP_FILES], gulp.series(htmlTask, reloadTask));
    gulp.watch(['src/pages/**/*.njk', ...EXCLUDE_TEMP_FILES], gulp.series(nunjucksTask, reloadTask));
    gulp.watch(['src/styles/**/*.scss', ...EXCLUDE_TEMP_FILES], gulp.series(sassTask, reloadTask));
    gulp.watch(['src/scripts/**/*.js', ...EXCLUDE_TEMP_FILES], gulp.series(rollupTask, reloadTask));
}
