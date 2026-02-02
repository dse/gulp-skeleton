import gulp from "gulp";
import data from "gulp-data";
import browserSync from "browser-sync";
import beautify from "gulp-beautify";
import fs from "node:fs";
import sitemap from "gulp-sitemap";
import glob from "glob";

import nunjucks from "nunjucks-render";
// import { nunjucksCompile as nunjucks } from "gulp-nunjucks";

import * as sassPkg from "sass";
import gulpSass from "gulp-sass";

import * as rollup from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
// import webpack from "webpack";

let devMode;
let distDir;
let siteData = getSiteData();

const EXCLUDE_PARTIALS = [
    "!**/_*",
    "!**/_*/**/*",
];

const EXCLUDE_TEMP = [
    "!**/*~",
    "!**/#*#",
    "!**/*.tmp",
    "!**/*.tmp.*",
    "!**/*.tmp-*",
    "!**/*.bak",
    "!**/*.bak.*",
    "!**/*.bak-*",
    "!**/*.ORIG",
    "!**/*.ORIG.*",
    "!**/*.ORIG-*",
    "!**/*.orig",
    "!**/*.orig.*",
    "!**/*.orig-*",
];

const config = {
    browserSync: {
        server: [distDir, "public"],
    },
    sass: {
        includePaths: [
            "."                 // @import url("node_modules/...");
        ],
        quietDeps: true,
        // silenceDeprecations: [
        //     "import",
        // ],
    },
    gulpNunjucksRender: {
        "path": "src/pages",
    },
    sitemap: {
        siteUrl: siteData.url,
    },
    data: getSiteData,
};

export function getSiteData() {
    const filenames = glob.sync("src/data/**/*.json");
    filenames.sort();
    const o = {};
    for (const filename of filenames) {
        const text = fs.readFileSync(filename, "utf-8");
        const obj = JSON.parse(text);
        Object.assign(o, obj);
    }
    return o;
}

let server;

export function serverTask(cb) {
    if (server) {
        cb?.();
        return;
    }
    server = browserSync.create();
    server.init(config.browserSync, cb);
}

export function reloadTask(cb) {
    server?.reload();
    cb?.();
}

const sass = gulpSass(sassPkg);

export function sassTask() {
    return gulp.src(["src/styles/**/*.scss", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS])
               .pipe(sass(config.sass))
               .pipe(gulp.dest(`${distDir}/css`));
}

let resetHtmlLastRunFlag = true;

export function htmlTask() {
    const since = resetHtmlLastRunFlag ? {} : { since: gulp.lastRun(htmlTask) };
    return gulp.src(["src/pages/**/*.njk", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS], { ...since })
               .pipe(data(config.data))
               .pipe(nunjucks(config.gulpNunjucksRender))
               .pipe(beautify.html())
               .pipe(gulp.dest(`${distDir}`));
}

function resetHtmlLastRun(cb) {
    // Invoked when a partial changes before htmlTask is invoked, so
    // that everything is recompiled.
    resetHtmlLastRunFlag = true;
    cb?.();
}

export function rollupTask() {
    return rollup
        .rollup({ input: "src/scripts/main.js",
                  plugins: [resolve(), babel({ babelHelpers: "bundled" })] })
        .then(bundle => {
            const filename = `${distDir}/js/main.js`;
            return bundle.write({
                file: filename,
                format: "umd",
                name: "library",
            });
        });
}

export function sitemapTask() {
    return gulp.src([`${distDir}/**/*.html`, ...EXCLUDE_TEMP])
               .pipe(sitemap(config.sitemap))
               .pipe(gulp.dest(`${distDir}`));
}

export function watchTask() {
    gulp.watch(["src/styles/**/*", ...EXCLUDE_TEMP],
               gulp.series(sassTask, reloadTask));
    gulp.watch(["src/pages/**/*", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS],
               gulp.series(sassTask, reloadTask));
    gulp.watch(["src/pages/**/_*/**/*", "src/pages/**/_*", ...EXCLUDE_TEMP],
               gulp.series(resetHtmlLastRun, htmlTask, reloadTask));
    gulp.watch(["src/js/**/*", ...EXCLUDE_TEMP],
               gulp.series(rollupTask, reloadTask));
}

export function initTask(cb) {
    fs.rmSync(distDir, { recursive: true });
    fs.mkdirSync(distDir, { recursive: true });
    cb?.();
}

export function copyStaticFilesTask() {
    return gulp.src(["public/**/*", ...EXCLUDE_TEMP],
                    { encoding: false })
               .pipe(gulp.dest(distDir));
}

export function setDevModeTask(cb) {
    devMode = true;
    distDir = "_dev";
    cb?.();
}

export function setProdModeTask(cb) {
    devMode = false;
    distDir = "dist";
    cb?.();
}

export const devTask = gulp.series(
    setDevModeTask,
    initTask,
    gulp.parallel(
        rollupTask,
        sassTask,
        htmlTask,
    ),
    serverTask,
    watchTask,
);

export const buildTask = gulp.series(
    setProdModeTask,
    initTask,
    gulp.parallel(
        rollupTask,
        sassTask,
        gulp.series(
            gulp.parallel(
                copyStaticFilesTask,
                htmlTask,
            ),
            sitemapTask,
        ),
    ),
);

export {
    // as typed on the cmdline
    devTask     as dev,
    buildTask   as build,
    sassTask    as sass,
    htmlTask    as html,
    rollupTask  as js,
    config      as config,
};
