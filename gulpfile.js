import gulp from "gulp";
import data from "gulp-data";
import browserSync from "browser-sync";
import beautify from "gulp-beautify";
import fs from "node:fs";
import sitemap from "gulp-sitemap";
import { glob } from "glob";
import { Transform } from "node:stream";

import nunjucks from "gulp-nunjucks-render";
// import { nunjucksCompile as nunjucks } from "gulp-nunjucks";

import * as sassPkg from "sass";
import gulpSass from "gulp-sass";

import * as rollup from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
// import webpack from "webpack";

let devMode;
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

let config;

function createConfig() {
    return {
        browserSync: {
            server: [
                "./dist",
                "./public",
            ],

        },
        sass: {
            includePaths: [
                "."                 // @import url("node_modules/...");
            ],
            quietDeps: true,
            silenceDeprecations: [
                "import",
            ],

        },
        gulpNunjucksRender: {
            "path": "src/pages",

        },
        sitemap: {
            siteUrl: siteData.url,

        },
        data: () => {
            return getSiteData();
        },
    };
}

export function getSiteData() {
    const filenames = glob.sync("src/data/**/*.json");
    filenames.sort();
    const o = {};
    for (const filename of filenames) {
        const text = fs.readFileSync(filename, "utf-8");
        const obj = JSON.parse(text);
        Object.assign(o, obj);
    }
    Object.assign(o, {
        "cacheBuster": String(new Date().getTime()) + "." + String(Math.floor(1 + Math.random())).slice(2)
    });
    return o;
}

let server;

function serverTask(cb) {
    if (server) {
        cb?.();
        return;
    }
    server = browserSync.create();
    const bsConfig = config.browserSync;
    console.log(JSON.stringify(bsConfig, null, 4));
    server.init(bsConfig, cb);
}

function reloadTask(cb) {
    server?.reload();
    cb?.();
}

const sass = gulpSass(sassPkg);

function sassTask() {
    return gulp.src(["src/styles/**/*.scss", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS])
               .pipe(processing())
               .pipe(sass(config.sass))
               .pipe(gulp.dest(`dist/css`))
               .pipe(wrote());
}

let resetHtmlLastRunFlag = true;

function htmlTask() {
    const since = resetHtmlLastRunFlag ? {} : { since: gulp.lastRun(htmlTask) };
    return gulp.src(["src/pages/**/*.njk", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS], { ...since })
               .pipe(processing())
               .pipe(data(config.data))
               .pipe(nunjucks(config.gulpNunjucksRender))
               .pipe(beautify.html())
               .pipe(gulp.dest(`dist`))
               .pipe(wrote());
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
            const filename = `dist/js/main.js`;
            return bundle.write({
                file: filename,
                format: "umd",
                name: "library",
            });
        });
}

function sitemapTask() {
    return gulp.src([`dist/**/*.html`, ...EXCLUDE_TEMP])
               .pipe(processing())
               .pipe(sitemap(config.sitemap))
               .pipe(gulp.dest(`dist`))
               .pipe(wrote());
}

function watchTask() {
    gulp.watch(["src/styles/**/*", ...EXCLUDE_TEMP],
               gulp.series(sassTask, reloadTask));
    gulp.watch(["src/pages/**/*", ...EXCLUDE_TEMP, ...EXCLUDE_PARTIALS],
               gulp.series(htmlTask, reloadTask));
    gulp.watch(["src/pages/**/_*/**/*", "src/pages/**/_*", ...EXCLUDE_TEMP],
               gulp.series(resetHtmlLastRun, htmlTask, reloadTask));
    gulp.watch(["src/js/**/*", ...EXCLUDE_TEMP],
               gulp.series(rollupTask, reloadTask));
}

function initTask(cb) {
    if (fs.existsSync("dist")) {
        fs.rmSync("dist", { recursive: true });
    }
    fs.mkdirSync("dist", { recursive: true });
    config = createConfig();
    cb?.();
}

function copyStaticFilesTask() {
    return gulp.src(["public/**/*", ...EXCLUDE_TEMP],
                    { encoding: false })
               .pipe(gulp.dest("dist"));
}

function setDevModeTask(cb) {
    devMode = true;
    cb?.();
}

function setProdModeTask(cb) {
    devMode = false;
    cb?.();
}

const devTask = gulp.series(
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

const buildTask = gulp.series(
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
    devTask,
    buildTask,
    setDevModeTask,
    setProdModeTask,
    initTask,
    rollupTask,
    sassTask,
    htmlTask,
    serverTask,
    watchTask,
    sitemapTask,
    copyStaticFilesTask,
    config,
};

function processing() {
    return new Transform({
        objectMode: true,
        transform (chunk, encoding, callback) {
            console.debug(`processing ${chunk.path}`);
            this.push(chunk);
            callback();
        },
    });
}

function wrote() {
    return new Transform({
        objectMode: true,
        transform (chunk, encoding, callback) {
            console.debug(`wrote ${chunk.path}`);
            this.push(chunk);
            callback();
        },
    });
}

export {
    // as typed on the cmdline
    devTask     as dev,
    buildTask   as build,
    sassTask    as sass,
    htmlTask    as html,
    rollupTask  as js,
};
