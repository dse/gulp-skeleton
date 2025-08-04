import browsersync from 'browser-sync';

let server;

export function serverTask() {
    // never completes
    if (server) {
        return;
    }
    console.log(`serverTask: starting server`);
    server = browsersync.create();
    server.init({
        server: ['public', `${DIST}`]
    });
}

export function reloadTask(cb) {
    console.log(`reloadTask: reloading server`);
    if (server) {
        server.reload();
    }
    cb?.();
}

export default serverTask;
