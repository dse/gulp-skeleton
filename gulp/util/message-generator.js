/**
 * For printing out gulp file operations
 */

import { Transform } from 'node:stream';

export default function messageGenerator(prefix) {
    return new Transform({
        objectMode: true,
        transform(record, encoding, callback) {
            console.log(`${prefix} ${record.path}`);
            this.push(record);
            callback(null);
        }
    });
}
