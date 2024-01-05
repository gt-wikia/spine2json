import fs from 'fs';

import { json2patch } from './modules/spine-skel2json.js';
import { atlas } from './modules/spine-atlas.js';

const filePrefix = './assets/';
const args = process.argv;
const argc = args.length === 3 ? true : false;

function help(){
    console.log('Usage:');
    console.log(' > node app json_filename_in_assets_folder');
    console.log('e.g:');
    console.log(' > node app illust_admiral');
    process.exit();
}

if(argc && args[2].match(/\\/) || argc && args[2].match(/\//)){
    help();
}

if(args.length !== 3) {
    help();
}

try{
    const fileName = args[2];
    console.log('LOG: Input file:', filePrefix + fileName);
    
    const skelBin  = fs.readFileSync(filePrefix + fileName + '.skel');
    const skelJson = fs.readFileSync(filePrefix + fileName + '.json', 'utf8');
    const atlasTxt = fs.readFileSync(filePrefix + fileName + '.atlas', 'utf8');
    
    const atlasJson = atlas(atlasTxt);
    const skelPJson = json2patch(skelBin, skelJson, atlasJson);
    
    fs.writeFileSync(filePrefix + fileName + '_j2p.json', JSON.stringify(skelPJson));
    console.log('LOG: DONE!');
}
catch(e){
    console.log('LOG: Failed!');
    console.log(e);
}
