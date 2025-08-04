import { globSync }  from 'glob';
import { EXCLUDE_PARTIALS } from './constants.js';

export default function createSiteData() {
    const obj = globSync(['src/data/**/*.json', ...EXCLUDE_PARTIALS])
          .reduce(
              (accum, next) => Object.assign(accum, next),
              {}
          );
    obj.cacheBuster = Date.now();
    return obj;
}
