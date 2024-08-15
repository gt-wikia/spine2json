const json2patch = (buffer, data, atlas) => {
    const skelBin = new SkeletonBinary(buffer, atlas, 1);
    skelBin.buildJson();
    
    let input = JSON.parse(data);
    atlas = atlas[0];
    
    // revert back to original skeleton data from skel
    input.skeleton = skelBin.json.skeleton;
    
    // remove spine version from json
    if(input.skeleton.spine == '3.8.87'){
        console.log(`LOG: Spine version removed from data`);
        delete input.skeleton.spine;
    }
    
    // patch  attachment
    for(let s in input.skins){
        let atts = input.skins[s].attachments;
        for(let a in Object.keys(atts)){
            let attItem = Object.keys(atts)[a];
            let att = atts[attItem];
            for(let a2 in Object.keys(att)){
                let attName = Object.keys(att)[a2];
                let attData = att[attName];
                if(!attData.type || attData.type == 'region'){
                    let findImage = atlas.data.find(v => {
                        return v.name == attName;
                    });
                    if(attData.width != findImage.size[0] || attData.height != findImage.size[1]){
                        if(!attData.scaleX){
                            attData.scaleX = 1;
                        }
                        if(!attData.scaleY){
                            attData.scaleY = 1;
                        }
                        attData.scaleX = +(attData.scaleX * (attData.width  / findImage.size[0])).toFixed(4);
                        attData.scaleY = +(attData.scaleY * (attData.height / findImage.size[1])).toFixed(4);
                    }
                }
            }
        }
    }
    return input;
};

export {
    json2patch
};
