import gulp from 'gulp';
import data from 'gulp-data';
import nunjucks from 'gulp-nunjucks-render';
import createSiteData from './site-data.js';
import { DIST, EXCLUDE_PARTIALS } from './constants.js';

export default function nunjucksTask() {
    return gulp.src(['src/pages/**/*.njk', ...EXCLUDE_PARTIALS], { base: 'src/pages' })
               .pipe(data(createSiteData))
               .pipe(nunjucks({ path: 'src/pages' }))
               .pipe(gulp.dest(`${DIST}`));
}
