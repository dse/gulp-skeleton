import babel from '@rollup/plugin-babel';
import * as rollup from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import { DIST } from './constants.js';

export default function rollupTask() {
    return rollup
        .rollup({ input: 'src/scripts/split-flap/clock-page.js',
                  plugins: [resolve(), babel({ babelHelpers: 'bundled' })] })
        .then(bundle => {
            const filename = `./${DIST}/split-flap/scripts/main.js`;
            return bundle.write({
                file: filename,
                format: 'umd',
                name: 'library',
            });
        });
}
