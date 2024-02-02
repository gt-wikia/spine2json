import fs from 'fs';

import { skel2json } from './spine-skel.mjs';
import { atlas } from './spine-atlas.mjs';

const filePrefix = './assets/';
const args = process.argv;
const argc = args.length === 3 ? true : false;

function exit(){
    console.log('[APP] Wrong args');
    console.log(args);
    process.exit();
}

if(argc && args[2].match(/\\/) || argc && args[2].match(/\//)){
    exit();
}

if(args.length !== 3) {
    exit();
}

try{
    const fileName = args[2];
    console.log('LOG: Input file:', filePrefix + fileName);
    
    const skelBin  = fs.readFileSync(filePrefix + fileName + '.skel');
    const atlasTxt = fs.readFileSync(filePrefix + fileName + '.atlas', 'utf8');
    
    const atlasJson = atlas(atlasTxt);
    const skelJson = skel2json(skelBin, atlasJson, 1);
    
    if(process.env._TSPINE == 1){
        skelJson.skeleton.images = `./images_${process.env._input}/`;
    }
    
    fs.writeFileSync(filePrefix + fileName + '.s2j.json', JSON.stringify(skelJson, null, '	'));
    console.log('LOG: DONE!');
}
catch(e){
    console.log('LOG: Failed!');
    console.log(e);
}
