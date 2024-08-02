import fs from 'fs';

import { atlas } from './spine-atlas.mjs';

const args = process.argv;
const argc = args.length === 3 ? true : false;

function exit(){
    console.log('[APP] Wrong args');
    console.log(args);
    process.exit();
}

args[2] = args[2].replace(/\\/g, '/').replace(/\.atlas$/, '');
const WORK_DIR = args[2].split('/').slice(0, -1).join('/');
const filePrefix = WORK_DIR != '' ? WORK_DIR + '/' : './assets/';
args[2] = args[2].split('/').reverse()[0];

if(argc && args[2].match(/\\/) || argc && args[2].match(/\//)){
    exit();
}

if(args.length !== 3) {
    exit();
}

try{
    const fileName = args[2];
    console.log('LOG: Input file:', filePrefix + fileName);
    const atlasTxt = fs.readFileSync(filePrefix + fileName + '.atlas', 'utf8');
    const atlasData = atlas.parse(atlasTxt);
    
    if(atlasData.length > 0){
		for (const atlasPage of atlasData) {
			atlasPage.pma = true;
		}
		
		const atlasPagePMA = atlas.stringify(atlasData);
        
        fs.writeFileSync(filePrefix + fileName + '.pma.atlas', atlasPagePMA);
        
        console.log('LOG: DONE!');
    }
    else{
        console.log('LOG: WRONG INPUT!');
    }
    
    
}
catch(e){
    console.log('LOG: Failed!');
    console.log(e);
}
