import fs from 'fs';

import { skel2json } from './spine-skel2json.js';
import { atlas } from './spine-atlas.js';

const filePrefix = './assets/illust_admiral';
const skelBin  = fs.readFileSync(filePrefix + '.skel');
const atlasTxt = fs.readFileSync(filePrefix + '.atlas', 'utf8');

console.log('LOG: Input file:', filePrefix);
const atlasJson = atlas(atlasTxt);
const skelJson = skel2json(skelBin, atlasJson, 1);

fs.writeFileSync(filePrefix + '_sl2j.json', JSON.stringify(skelJson, null, '    '));
