import gulp from 'gulp';
import cleanTask from './clean.js';
import sassTask from './sass.js';
import htmlTask from './html.js';
import rollupTask from './rollup.js';
import nunjucksTask from './nunjucks.js';

import serverTask from './server.js';
import watchTask from './watch.js';

const devTask = gulp.series(
    cleanTask,
    gulp.parallel(sassTask, htmlTask, rollupTask, nunjucksTask),
    gulp.parallel(serverTask, watchTask),
);

export default devTask;
