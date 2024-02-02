import fs from 'fs';

import { atlas } from './spine-atlas.mjs';

const WORK_DIR = process.env._WORK_DIR.replace(/\\/g, '/');
const filePrefix = `${WORK_DIR}/`;

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
    const atlasTxt = fs.readFileSync(filePrefix + fileName + '.atlas', 'utf8');
    const atlasData = atlas(atlasTxt);
    
    if(atlasData.length > 0){
        const atlasPage = atlasData[0];
        let atlasPagePMA = `\n${atlasPage.file}\n`;
        
        for(let k of Object.keys(atlasPage)){
            if(k != 'file' && k != 'data'){
                atlasPagePMA += `${k}: ${atlasPage[k]}\n`;
            }
        }
        
        atlasPagePMA += `pma: true\n`;
        
        for(let i of atlasPage.data){
            for(let v of Object.keys(i)){
                if(v == 'file'){
                    atlasPagePMA += `${i[v]}\n`;
                }
                else{
                    atlasPagePMA += `  ${v}: ${i[v].join(', ')}\n`;
                }
            }
        }
        
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
