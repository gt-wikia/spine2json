import fs from 'fs';

import { skel2json } from './spine-skel2json.js';
import { atlas } from './spine-atlas.js';

const filePrefix = './assets/';
const args = process.argv;

function help(){
    console.log('Usage:');
    console.log(' > node app skel_filename_in_assets_folder');
    console.log('e.g:');
    console.log(' > node app illust_admiral');
    process.exit();
}

if(args.length === 3 && args[2].match(/\\/) || args.length === 3 && args[2].match(/\//)){
    help();
}

if(args.length !== 3) {
    help();
}

try{
    const fileName = args[2];
    console.log('LOG: Input file:', filePrefix + fileName);
    
    const skelBin  = fs.readFileSync(filePrefix + fileName + '.skel');
    const atlasTxt = fs.readFileSync(filePrefix + fileName + '.atlas', 'utf8');
    
    const atlasJson = atlas(atlasTxt);
    const skelJson = skel2json(skelBin, atlasJson, 1);
    
    fs.writeFileSync(filePrefix + fileName + '_s2j.json', JSON.stringify(skelJson));
    console.log('LOG: DONE!');
}
catch(e){
    console.log('LOG: Failed!');
    console.log(e);
}
