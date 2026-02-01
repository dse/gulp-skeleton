import gulp from "gulp";
import data from "gulp-data";
import browserSync from "browser-sync";
import beautify from "gulp-beautify";
import fs from "node:fs";
import sitemap from "gulp-sitemap";

import nunjucks from "nunjucks-render";
// import { nunjucksCompile as nunjucks } from "gulp-nunjucks";

import * as sassPkg from "sass";
import gulpSass from "gulp-sass";

import * as rollup from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
// import webpack from "webpack";

import baseSiteData from "./src/data/site-data.js";

let devMode;
let distDir;

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
            "node_modules",
        ],
        quietDeps: true,
        // silenceDeprecations: [
        //     "import",
        // ],
    },
    gulpNunjucksRender: {
        "path": "src/html",
    },
    sitemap: {
        siteUrl: baseSiteData.url,
    },
    data: getSiteData,
};

function getSiteData() {
    return JSON.parse(fs.readFilesSync("src/data/site-data.json", "utf-8"));
}

let server;

function serverTask(cb) {
    if (server) {
        cb?.();
        return;
    }
    server = browserSync.create();
    server.init(config.browserSync, cb);
}

function reloadTask(cb) {
    server?.reload();
    cb?.();
}

const sass = gulpSass(sassPkg);

function sassTask() {
    return gulp.src(["src/styles/**/*.scss", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS])
               .pipe(sass(config.sass))
               .pipe(gulp.dest(`${distDir}/css`));
}

let resetHtmlLastRunFlag = true;

function htmlTask() {
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

function rollupTask() {
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

function sitemapTask() {
    return gulp.src([`${distDir}/html/**/*.html`, ...EXCLUDE_TEMP])
               .pipe(sitemap(config.sitemap))
               .pipe(gulp.dest(`${distDir}`));
}

function watchTask() {
    gulp.watch(["src/styles/**/*", ...EXCLUDE_TEMP],
               gulp.series(sassTask, reloadTask));
    gulp.watch(["src/html/**/*", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS],
               gulp.series(sassTask, reloadTask));
    gulp.watch(["src/html/**/_*/**/*", "src/html/**/_*", ...EXCLUDE_TEMP],
               gulp.series(resetHtmlLastRun, htmlTask, reloadTask));
    gulp.watch(["src/js/**/*", ...EXCLUDE_TEMP],
               gulp.series(rollupTask, reloadTask));
}

function initTask(cb) {
    fs.rmSync(distDir, { recursive: true });
    fs.mkdirSync(distDir, { recursive: true });
    cb?.();
}

function copyStaticFilesTask() {
    return gulp.src(["public/**/*", ...EXCLUDE_TEMP],
                    { encoding: false })
               .pipe(gulp.dest(distDir));
}

function setDevMode(cb) {
    devMode = true;
    distDir = "_dev";
    cb?.();
}

function setProdMode(cb) {
    devMode = false;
    distDir = "dist";
    cb?.();
}

const devTask = gulp.series(
    setDevMode,
    initTask,
    gulp.parallel(
        rollupTask,
        sassTask,
        htmlTask,
    ),
    serverTask,
    watchTask,
);

const buildTask = gulp.series(
    setProdMode,
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
    devTask     as dev,
    buildTask   as build,
    sassTask    as sass,
    htmlTask    as html,
    rollupTask  as js,
    config      as config,
    getSiteData as getSiteData, // for gulpfiles importing this
};
