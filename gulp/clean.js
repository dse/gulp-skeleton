import fs from 'node:fs';
import { DIST } from './constants.js';

export default function cleanTask(cb) {
    fs.rmSync(`${DIST}`, { recursive: true });
    fs.mkdirSync(`${DIST}`, { recursive: true });
    cb?.();
}
