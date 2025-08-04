const DEV_MODE = getDevMode();
const EXCLUDE_PARTIALS = ['!**/_*', '!**/_*/**/*'];
const EXCLUDE_TEMP_FILES = ['!**/*~', '!**/#*'];
const DIST = DEV_MODE ? '_dev/dist/web' : 'dist/web';

function getDevMode() {
    const env = process.env.NODE_ENV;
    return env === "dev" || (env != null && env !== 'production');
}

export {
    EXCLUDE_PARTIALS,
    EXCLUDE_TEMP_FILES,
    DEV_MODE,
    DIST,
};
