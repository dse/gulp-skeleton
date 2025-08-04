import gulp from 'gulp';
import cleanTask from './clean.js';
import sassTask from './sass.js';
import htmlTask from './html.js';
import rollupTask from './rollup.js';
import staticTask from './static.js';
import nunjucksTask from './nunjucks.js';

const buildTask = gulp.series(
    cleanTask,
    gulp.parallel(sassTask, htmlTask, rollupTask, staticTask, nunjucksTask)
);

export default buildTask;
