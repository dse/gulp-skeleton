import fs from 'node:fs';
import { DIST } from './constants.js';

export default function cleanTask(cb) {
    if (fs.existsSync(DIST)) {
        fs.rmSync(`${DIST}`, { recursive: true });
    }
    fs.mkdirSync(`${DIST}`, { recursive: true });
    cb?.();
}
