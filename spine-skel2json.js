// constants
const BlendMode = ['normal', 'additive', 'multiply', 'screen'];
const TransformMode = ['normal', 'onlyTranslation', 'noRotationOrReflection', 'noScale', 'noScaleOrReflection'];
const PositionMode = ['fixed', 'percent'];
const SpacingMode = ['length', 'fixed', 'percent'];
const RotateMode = ['tangent', 'chain', 'chainScale'];
const AttachmentType = ['region', 'boundingbox', 'mesh', 'linkedmesh', 'path', 'point', 'clipping'];

// timelines
const SlotTimelineType = ['ATTACHMENT', 'COLOR', 'TWO_COLOR'];
const BoneTimelineType = ['ROTATE', 'TRANSLATE', 'SCALE', 'SHEAR'];
const PathTimelineType = ['POSITION', 'SPACING', 'MIX'];

// load
function SkeletonBinary(buffer, atlas, scale){
    this.atlas = atlas;
    this.strings = [];
    this.index = 0;
    this.buffer = new DataView(new Uint8Array(buffer).buffer);
    this.nonessential = false;
    this.scale = !isNaN(scale) && scale != 0 ? scale : 1;
    this.json = {};
}

// methods
SkeletonBinary.prototype = {
    readByte: function () {
        return this.buffer.getInt8(this.index++);
    },
    readShort: function () {
        let value = this.buffer.getInt16(this.index);
        this.index += 2;
        return value;
    },
    readInt32: function () {
        let value = this.buffer.getInt32(this.index);
        this.index += 4;
        return value;
    },
    readInt: function (optimizePositive) {
        let b = this.readByte();
        let result = b & 0x7F;
        if ((b & 0x80) != 0) {
            b = this.readByte();
            result |= (b & 0x7F) << 7;
            if ((b & 0x80) != 0) {
                b = this.readByte();
                result |= (b & 0x7F) << 14;
                if ((b & 0x80) != 0) {
                    b = this.readByte();
                    result |= (b & 0x7F) << 21;
                    if ((b & 0x80) != 0) {
                        b = this.readByte();
                        result |= (b & 0x7F) << 28;
                    }
                }
            }
        }
        return optimizePositive ? result : ((result >>> 1) ^ -(result & 1));
    },
    readStringRef: function () {
        let index = this.readInt(true);
        return index == 0 ? null : this.strings[index - 1];
    },
    readString: function () {
        let byteCount = this.readInt(true);
        switch (byteCount) {
            case 0:
                return null;
            case 1:
                return '';
        }
        byteCount--;
        let chars = '';
        let charCount = 0;
        for (let i = 0; i < byteCount;) {
            let b = this.readByte();
            switch (b >> 4) {
                case 12:
                case 13:
                    chars += String.fromCharCode(((b & 0x1F) << 6 | this.readByte() & 0x3F));
                    i += 2;
                    break;
                case 14:
                    chars += String.fromCharCode(((b & 0x0F) << 12 | (this.readByte() & 0x3F) << 6 | this.readByte() & 0x3F));
                    i += 3;
                    break;
                default:
                    chars += String.fromCharCode(b);
                    i++;
            }
        }
        return chars;
    },
    readFloat: function (fixedNum) {
        var value = this.buffer.getFloat32(this.index);
        this.index += 4;
        if(fixedNum){
            return +value.toFixed(fixedNum);
        }
        return value;
    },
    readBoolean: function () {
        return this.readByte() != 0;
    },
    readHex: function () {
        let hex = this.buffer.getUint8(this.index++).toString(16);
        return hex.padStart(2, '0');
    },
    readColor: function () {
        return this.readHex() + this.readHex() + this.readHex() + this.readHex();
    },
    readDarkColor: function () {
        let value = this.buffer.getInt32(this.index++);
        if(value != -1){
            return this.readHex() + this.readHex() + this.readHex();
        }
        this.index += 3;
        return undefined;
    },
    readFloatArray: function (length, scale) {
        let array = [];
        scale = isNaN(scale) ? 1 : scale;
        for (let i = 0; i < length; i++) {
            array.push(this.readFloat() * scale);
        }
        return array;
    },
    readShortArray: function () {
        let n = this.readInt(true);
        let array = [];
        for (let i = 0; i < n; i++) {
            array.push(this.readShort());
        }
        return array;
    },
    readVertices: function (vertexCount) {
        let verticesLength = vertexCount << 1;
        if (!this.readBoolean()) {
            return this.readFloatArray(verticesLength, this.scale);
        }
        let vertex = [];
        for (let i = 0; i < vertexCount; i++) {
            let boneCount = this.readInt(true);
            vertex.push(boneCount);
            for (let ii = 0; ii < boneCount; ii++) {
                vertex.push(this.readInt(true));
                vertex.push(this.readFloat() * this.scale);
                vertex.push(this.readFloat() * this.scale);
                vertex.push(this.readFloat());
            }
        }
        return vertex;
    },
    readBoneName: function (boneIndex) {
        boneIndex = !isNaN(boneIndex) ? boneIndex : this.readInt(true);
        return this.json.bones[boneIndex].name;
    },
    readSlotName: function (slotIndex) {
        slotIndex = !isNaN(slotIndex) ? slotIndex : this.readInt(true);
        return this.json.slots[slotIndex].name;
    },
    initJson: function () {
        this.json = {
            skeleton: {},
            bones: [],
            slots: [],
            ik: [],
            transform: [],
            path: [],
            skins: [],
            events: [],
            animations: {},
        };
    },
    initBone: function(name, parent){
        const data = {};
        data.name = name;
        if(parent != null){
            data.parent = this.readBoneName(parent);
        }
        return data;
    },
    initSlot: function(name, boneIndex){
        const data = {};
        data.name = name;
        data.bone = this.readBoneName(boneIndex);
        return data;
    },
    readSkin: function(defaultSkin){
        let skin = {};
        let slotCount = 0;
        if (defaultSkin) {
            skin.name = 'default';
            slotCount = this.readInt(true);
            if (slotCount == 0){
                return null;
            }
        }
        else{
            skin.name = this.readStringRef();
            /*
            skin.bones.length = this.readInt(true);
            for (let i = 0, n = skin.bones.length; i < n; i++)
                skin.bones[i] = skeletonData.bones[this.readInt(true)];
            
            for (let i = 0, n = this.readInt(true); i < n; i++)
                skin.constraints.push(skeletonData.ikConstraints[this.readInt(true)]);
            for (let i = 0, n = this.readInt(true); i < n; i++)
                skin.constraints.push(skeletonData.transformConstraints[this.readInt(true)]);
            for (let i = 0, n = this.readInt(true); i < n; i++)
                skin.constraints.push(skeletonData.pathConstraints[this.readInt(true)]);
            */
            console.log('[non default skin] implement me!');
            process.exit();
        }
        skin.attachments = {};
        for (let i = 0; i < slotCount; i++) {
            const slot = {};
            const slotIndex = this.readInt(true);
            for (let ii = 0, nn = this.readInt(true); ii < nn; ii++) {
                let name = this.readStringRef();
                let attachment = this.readAttachment(name);
                if (attachment != null) {
                    slot[name] = attachment;
                }
            }
            skin.attachments[this.readSlotName(slotIndex)] = slot;
        }
        return skin;
    },
    readAttachment: function(attachmentName){
        let name = this.readStringRef();
        if(name == null){
            name = attachmentName;
        }
        
        let path, n;
        let array;
        
        const att = {
            name: name,
            type: AttachmentType[this.readByte()],
        };
        
        switch (att.type) {
            case 'region':
                path = this.readStringRef();
                if (path == null){
                    path = name;
                }
                att.path = path;
                att.rotation = this.readFloat();
                att.x = this.readFloat() * this.scale;
                att.y = this.readFloat() * this.scale;
                att.scaleX = this.readFloat();
                att.scaleY = this.readFloat();
                att.width = this.readFloat() * this.scale;
                att.height = this.readFloat() * this.scale;
                att.color = this.readColor();
                let findImage = this.atlas[0].data.find(v => {
                    return v.file == att.path;
                });
                if(att.width != findImage.size[0] || att.height != findImage.size[1]){
                    att.scaleX = +(att.scaleX * (att.width  / findImage.size[0])).toFixed(4);
                    att.scaleY = +(att.scaleY * (att.height / findImage.size[1])).toFixed(4);
                }
                return att;
            case 'boundingbox':
                console.log('skin att type 2 implement me');
                n = this.readInt(true);
                att.vertexCount = n;
                att.vertices = this.readVertices(n);
                console.log(att);
                process.exit();
                break;
            case 'mesh':
                path = this.readStringRef();
                if (path == null){
                     path = name;
                }
                att.path = path;
                att.color = this.readColor();
                n = this.readInt(true);
                att.uvs = this.readFloatArray(n << 1, 1);
                att.triangles = this.readShortArray();
                att.vertices = this.readVertices(n);
                att.hull = this.readInt(true);
                if (this.nonessential) {
                    att.edges = this.readShortArray();
                    att.width = this.readFloat() * this.scale;
                    att.height = this.readFloat() * this.scale;
                }
                return att;
            case 'linkedmesh':
                console.log('skin att type 4 implement me');
                process.exit();
                break;
            case 'path':
                att.closed = this.readBoolean();
                att.constantSpeed = this.readBoolean();
                n = this.readInt(true);
                att.vertexCount = n;
                att.vertices = this.readVertices(n);
                array = new Array(n / 3);
                for (let i = 0; i < array.length; i++) {
                    array[i] = this.readFloat() * this.scale;
                }
                att.lengths = array;
                if (this.nonessential) {
                    att.color = this.readColor();
                }
                return att;
            case 'point':
                console.log('skin att type 6 implement me');
                process.exit();
                break;
            case 'clipping':
                console.log('skin att type 7 implement me');
                process.exit();
                break;
        }
        
        return null;
    },
    getAttachment: function(skinIndex, slotIndex, attachmentName){
        try{
            let skin = this.json.skins[skinIndex];
            let slot = skin.attachments[this.readSlotName(slotIndex)];
            return slot[attachmentName];
        }
        catch(e){
            return null;
        }
    },
    readAnimation: function(name){
        let input = this;
        let data = {};
        
        // Slot timelines
        let slotCount = input.readInt(true);
        if(slotCount > 0){
            data.slots = {};
        }
        for (let i = 0; i < slotCount; i++) {
            let slotName = input.readSlotName();
            data.slots[slotName] = {};
            
            let timelineCount = input.readInt(true);
            for (let ii = 0; ii < timelineCount; ii++) {
                let timelineType = SlotTimelineType[input.readByte()];
                
                let frameCount = input.readInt(true);
                for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                    let frameData = {};
                    
                    let time = input.readFloat(4);
                    if(time != 0){
                        frameData.time = time;
                    }
                    
                    if(timelineType == 'ATTACHMENT'){
                        data.slots[slotName].attachment = [];
                        frameData.name = input.readStringRef();
                        data.slots[slotName].attachment.push(frameData);
                    }
                    if(timelineType == 'COLOR'){
                        data.slots[slotName].color = [];
                        
                        frameData.color = input.readColor();
                        if(frameIndex < frameCount-1){
                            let curveData = input.readCurve();
                            Object.assign(frameData, curveData);
                        }
                        
                        data.slots[slotName].color.push(frameData);
                    }
                    if(timelineType == 'TWO_COLOR'){
                        console.log('not implemented SLOT_TWO_COLOR');
                        process.exit();
                    }
                }
            }
        }
        
        let boneCount = input.readInt(true);
        if(boneCount > 0){
            data.bones = {};
        }
        for (let i = 0; i < boneCount; i++) {
            let boneName = input.readBoneName();;
            data.bones[boneName] = {};
            
            let timelineCount = input.readInt(true);
            for (let ii = 0; ii < timelineCount; ii++) {
                let timelineType = BoneTimelineType[input.readByte()];
                let timelineName = timelineType.toLowerCase();
                data.bones[boneName][timelineName] = [];
                
                let frameCount = input.readInt(true);
                for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                    let frameData = {};
                    let time = input.readFloat(4);
                    if(time != 0){
                        frameData.time = time;
                    }
                    
                    if(timelineType == 'ROTATE'){
                            let angle = input.readFloat(4);
                            if(angle != 0){
                                frameData.angle = angle;
                            }
                            if(frameIndex < frameCount-1){
                                let curveData = input.readCurve();
                                Object.assign(frameData, curveData);
                            }
                            data.bones[boneName][timelineName].push(frameData);
                    }
                    if(timelineType == 'TRANSLATE' || timelineType == 'SCALE' || timelineType == 'SHEAR'){
                            let x = input.readFloat(4);
                            let y = input.readFloat(4);
                            if(timelineType == 'TRANSLATE' && x != 0 || timelineType == 'SHEAR' && x != 0){
                                frameData.x = x;
                            }
                            if(timelineType == 'TRANSLATE' && y != 0 || timelineType == 'SHEAR' && y != 0){
                                frameData.y = y;
                            }
                            if(timelineType == 'SCALE' && x != 1){
                                frameData.x = x;
                            }
                            if(timelineType == 'SCALE' && y != 1){
                                frameData.y = y;
                            }
                            
                            if(frameIndex < frameCount-1){
                                let curveData = input.readCurve();
                                Object.assign(frameData, curveData);
                            }
                    }
                    data.bones[boneName][timelineName].push(frameData);
                }
            }
        }
        
        let ikCount = input.readInt(true);
        if(ikCount > 0){
            data.ik = {};
            console.log('not implemented Animation IK');
            process.exit();
        }
        
        let transformCount = input.readInt(true);
        if(transformCount > 0){
            data.transform = {};
            console.log('not implemented Animation Transform');
            process.exit();
        }
        
        let pathCount = input.readInt(true);
        if(pathCount > 0){
            data.path = {};
            for (let i = 0; i < pathCount; i++) {
                let index = input.readInt(true);
                let pathData = input.json.path[index];
                data.path[pathData.name] = {};
            
                let timelineCount = input.readInt(true);
                for (let ii = 0; ii < timelineCount; ii++) {
                    let timelineType = PathTimelineType[input.readByte()];
                    let timelineName = timelineType.toLowerCase();
                    data.path[pathData.name][timelineName] = [];
                    
                    let frameCount = input.readInt(true);
                    for(let frameIndex=0;frameIndex < frameCount;frameIndex++){
                        let frameData = {};
                        let time = input.readFloat(4);
                        if(time != 0){
                            frameData.time = time;
                        }
                        
                        if(timelineType == 'POSITION' || timelineType == 'SPACING'){
                            frameData[timelineName] = input.readFloat();
                        }
                        if(timelineType == 'MIX'){
                            frameData[rotateMix] = input.readFloat();
                            frameData[translateMix] = input.readFloat();
                        }
                        
                        if(frameIndex < frameCount-1){
                            let curveData = input.readCurve();
                            Object.assign(frameData, curveData);
                        }
                        
                        data.path[pathData.name][timelineName].push(frameData);
                    }
                }
            }
        }
        
        // deforms also skins
        let deformCount = input.readInt(true);
        if(deformCount > 0){
            data.deform = {};
        }
        for (let i = 0; i < deformCount; i++) {
            let skinIndex = input.readInt(true);
            let skinName = input.json.skins[skinIndex].name;
            data.deform[skinName] = {};
            
            let slotCount = input.readInt(true);
            for (let ii = 0; ii < slotCount; ii++) {
                let slotIndex = input.readInt(true);
                let slotName = this.readSlotName(slotIndex);
                data.deform[skinName][slotName] = {};
                
                let timelineCount = input.readInt(true);
                for (let iii = 0; iii < timelineCount; iii++) {
                    let attachmentName = input.readStringRef();
                    data.deform[skinName][slotName][attachmentName] = [];
                    
                    let frameCount = input.readInt(true);
                    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                        let frameData = {};
                        let time = input.readFloat(5);
                        let end = input.readInt(true);
                        
                        if(time != 0){
                            frameData.time = time;
                        }
                        
                        if(end != 0){
                            let start = input.readInt(true);
                            frameData.offset = start;
                            frameData.vertices = [];
                            
                            end += start;
                            for (let v = start; v < end; v++){
                                frameData.vertices.push(input.readFloat() * this.scale);
                            }
                        }
                        
                        if (frameIndex < frameCount - 1){
                            let curveData = input.readCurve();
                            Object.assign(frameData, curveData);
                        }
                        
                        data.deform[skinName][slotName][attachmentName].push(frameData);
                    }
                    
                }
                
            }
            
        }
        
        let draworder = input.readInt(true);
        if(draworder > 0){
            data.draworder = {};
            console.log('not implemented Animation Draw Order');
            process.exit();
        }
        
        let eventCount = input.readInt(true);
        if(eventCount > 0){
            data.events = {};
            console.log('not implemented Animation Event');
            process.exit();
        }
        
        // console.log(data);
        return data;
    },
    readCurve: function(){
        let curveType = this.readInt(true);
        if(curveType == 0){
            return {};
        }
        if(curveType == 1){
            return { curve: 'stepped' };
        }
        if(curveType == 2){
            return this.readCurveArr();
        }
        console.log('not implemented CURVE');
        console.log(curveType);
        process.exit();
    },
    readCurveArr: function () {
        let data = {};
        let curveArr = [];
        for(let c = 0; c < 4; c++){
            curveArr.push(this.readFloat(4));
        }
        if(curveArr[0] != 0){
            data.curve = curveArr[0];
        }
        if(curveArr[1] != 0){
            data.c2 = curveArr[1];
        }
        if(curveArr[2] != 1){
            data.c3 = curveArr[2];
        }
        if(curveArr[3] != 1){
            data.c4 = curveArr[3];
        }
        return data;
    },
    buildJson: function () {
        // main
        let input = this;
        input.initJson();
        
        // build skeleton
        let skeletonData = input.json.skeleton;
        skeletonData.hash = input.readString();
        skeletonData.spine = input.readString();
        if(skeletonData.spine == '3.8.87'){
            // revert skel version
            skeletonData.spine = '3.8.75';
        }
        skeletonData.x = input.readFloat();
        skeletonData.y = input.readFloat();
        skeletonData.width = input.readFloat();
        skeletonData.height = input.readFloat();
        
        // extra
        input.nonessential = input.readBoolean();
        if (input.nonessential) {
            skeletonData.fps = input.readFloat();
            skeletonData.images = input.readString();
            skeletonData.audio = input.readString();
        }
        
        // show skeleton data
        console.log('LOG: Skeleton info:', skeletonData);
        
        // init arrays
        let n = 0;
        let nn = 0;
        
        // strings
        n = input.readInt(true);
        for (let i = 0; i < n; i++){
            input.strings.push(input.readString());
        }
        
        // bones
        n = input.readInt(true);
        for (let i = 0; i < n; i++) {
            let name = input.readString();
            let parent = i == 0 ? null : input.readInt(true);
            let data = input.initBone(name, parent);
            data.rotation = input.readFloat();
            data.x = input.readFloat() * input.scale;
            data.y = input.readFloat() * input.scale;
            data.scaleX = input.readFloat();
            data.scaleY = input.readFloat();
            data.shearX = input.readFloat();
            data.shearY = input.readFloat();
            data.length = input.readFloat() * input.scale;
            data.transform = TransformMode[input.readInt(true)];
            data.skin = input.readBoolean();
            if (input.nonessential){
                data.color = input.readColor();
            }
            input.json.bones.push(data);
        }
        
        // Slots
        n = input.readInt(true);
        if(n < 1){
            input.json.slots = undefined;
        }
        for (let i = 0; i < n; i++) {
            let slotName = input.readString();
            let boneIndex = input.readInt(true);
            let data = input.initSlot(slotName, boneIndex);
            data.color = input.readColor();
            data.dark = input.readDarkColor();
            data.attachment = input.readStringRef();
            data.blend = BlendMode[input.readInt(true)];
            input.json.slots.push(data);
        }
        
        // ik constraints
        n = input.readInt(true);
        if(n < 1){
            input.json.ik = undefined;
        }
        for (let i = 0; i < n; i++) {
            let data = {};
            data.name = input.readString();
            data.order = input.readInt(true);
            data.skin = input.readBoolean();
            data.bones = [];
            nn = input.readInt(true);
            for (let ii = 0; ii < nn; ii++){
                data.bones.push(input.readBoneName());
            }
            data.target = input.readBoneName();
            data.mix = input.readFloat();
            data.softness = input.readFloat() * input.scale;
            data.bendPositive = input.readByte() > 0 ? true : false;
            data.compress = input.readBoolean();
            data.stretch = input.readBoolean();
            data.uniform = input.readBoolean();
            input.json.ik.push(data);
        }
        
        // transform constraints
        n = input.readInt(true);
        if(n < 1){
            input.json.transform = undefined;
        }
        for (let i = 0; i < n; i++) {
            let data = {};
            data.name = input.readString();
            data.order = input.readInt(true);
            data.skin = input.readBoolean();
            data.bones = [];
            nn = input.readInt(true);
            for (let ii = 0; ii < nn; ii++){
                data.bones.push(input.readBoneName());
            }
            data.target = input.readBoneName();
            data.local = input.readBoolean();
            data.relative = input.readBoolean();
            data.rotation = input.readFloat();
            data.x = input.readFloat() * input.scale;
            data.y = input.readFloat() * input.scale;
            data.scaleX = input.readFloat();
            data.scaleY = input.readFloat();
            data.shearY = input.readFloat();
            data.rotateMix = input.readFloat();
            data.translateMix = input.readFloat();
            data.scaleMix = input.readFloat();
            data.shearMix = input.readFloat();
            input.json.transform.push(data);
        }
        
        // path constraints.
        n = input.readInt(true);
        if(n < 1){
            input.json.path = undefined;
        }
        for (let i = 0; i < n; i++) {
            let data = {};
            data.name = input.readString();
            data.order = input.readInt(true);
            data.skin = input.readBoolean();
            data.bones = [];
            nn = input.readInt(true);
            for (let ii = 0; ii < nn; ii++){
                data.bones.push(input.readBoneName());
            }
            data.target = input.readSlotName();
            data.positionMode = PositionMode[input.readInt(true)];
            data.spacingMode = SpacingMode[input.readInt(true)];
            data.rotateMode = RotateMode[input.readInt(true)];
            data.rotation = input.readFloat();
            data.position = input.readFloat();
            if (data.positionMode == 'fixed'){
                data.position *= input.scale;
            }
            data.spacing = input.readFloat();
            if (data.spacingMode == 'length' || data.spacingMode == 'fixed'){
                data.spacing *= input.scale;
            }
            data.rotateMix = input.readFloat();
            data.translateMix = input.readFloat();
            input.json.path.push(data);
        }
        
        // default skin
        let defaultSkin = input.readSkin(true);
        if (defaultSkin != null) {
            input.json.skins.push(defaultSkin);
        }
        
        // non-default skins
        let skinCount = input.readInt(true);
        for (let i = 0; i < skinCount; i++) {
            console.log('implement non default skins!');
            process.exit();
        }
        
        let eventCount = input.readInt(true);
        for (let i = 0; i < eventCount; i++) {
            console.log('implement events!');
            process.exit();
        }
        
        let animationCount = input.readInt(true);
        if(animationCount > 0){
            input.json.animations = {};
            for (let a = 0; a < animationCount; a++) {
                let animationName = input.readString();
                let animationData = input.readAnimation(animationName);
                input.json.animations[animationName] = animationData;
            }
        }
        
    },
};

const skel2json = (buffer, atlas, scale) => {
    const skelBin = new SkeletonBinary(buffer, atlas, scale);
    skelBin.buildJson();
    return skelBin.json;
};

export {
    skel2json
};
