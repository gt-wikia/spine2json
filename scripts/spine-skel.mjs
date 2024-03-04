// constants
const BlendMode = ['normal', 'additive', 'multiply', 'screen'];
const TransformMode = ['normal', 'onlyTranslation', 'noRotationOrReflection', 'noScale', 'noScaleOrReflection'];
const PositionMode = ['fixed', 'percent'];
const SpacingMode = ['length', 'fixed', 'percent'];
const RotateMode = ['tangent', 'chain', 'chainScale'];
const AttachmentType = ['region', 'boundingbox', 'mesh', 'linkedmesh', 'path', 'point', 'clipping'];

// timelines
const SlotTimelineType = ['attachment', 'color', 'twoColor'];
const BoneTimelineType = ['rotate', 'translate', 'scale', 'shear'];
const PathTimelineType = ['position', 'spacing', 'mix'];

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
        if (typeof fixedNum === 'undefined') {
            fixedNum = 8;
        }
        var value = this.buffer.getFloat32(this.index);
        this.index += 4;
        return +value.toFixed(fixedNum);
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
        return null;
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
        const verticesLength = vertexCount << 1;
        if (!this.readBoolean()) {
            return this.readFloatArray(verticesLength, this.scale);
        }
        const vertex = [];
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
    readPathName: function (pathIndex) {
        pathIndex = !isNaN(pathIndex) ? pathIndex : this.readInt(true);
        return this.json.path[pathIndex].name;
    },
    readSkinName: function (skinIndex) {
        skinIndex = !isNaN(skinIndex) ? skinIndex : this.readInt(true);
        return this.json.skins[skinIndex].name;
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
            throw new Error('not implemented: non-default skin!');
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
        if(name === null){
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
                if (path === null){
                    path = name;
                }
                att.name = path;
                att.rotation = this.readFloat();
                att.x = this.readFloat() * this.scale;
                att.y = this.readFloat() * this.scale;
                att.scaleX = this.readFloat();
                att.scaleY = this.readFloat();
                att.width = this.readFloat() * this.scale;
                att.height = this.readFloat() * this.scale;
                att.color = this.readColor();
                let findImage = this.atlas[0].data.find(v => {
                    return v.file == att.name;
                });
                if(att.width != findImage.size[0] || att.height != findImage.size[1]){
                    att.scaleX = +(att.scaleX * (att.width  / findImage.size[0])).toFixed(4);
                    att.scaleY = +(att.scaleY * (att.height / findImage.size[1])).toFixed(4);
                }
                return att;
            case 'boundingbox':
                throw new Error('not implemented: skin attachment boundingbox');
                n = this.readInt(true);
                att.vertexCount = n;
                att.vertices = this.readVertices(n);
                return att
            case 'mesh':
                path = this.readStringRef();
                if (path === null){
                    path = name;
                }
                att.name = path;
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
                throw new Error('not implemented: skin attachment linkedmesh');
                return att;
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
                throw new Error('not implemented: skin attachment point');
                return att;
            case 'clipping':
                throw new Error('not implemented: skin attachment clipping');
                return att;
            default:
                return att;
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
            for (let timelineIndex = 0; timelineIndex < timelineCount; timelineIndex++) {
                let timelineType = SlotTimelineType[input.readByte()];
                
                let timelineName;
                switch(timelineType){
                    case 'twoColor':
                        throw new Error('not implemented: animation slot twoColor!');
                        timelineName = 'color';
                        break;
                    default:
                        timelineName = timelineType;
                }
                
                data.slots[slotName][timelineName] = [];
                
                let frameCount = input.readInt(true);
                for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                    let frameData = {};
                    frameData.time = input.readFloat(4);
                    
                    switch(timelineType){
                        case 'attachment':
                            frameData.name = input.readStringRef();
                            break;
                        case 'color':
                            frameData.color = input.readColor();
                            if(frameIndex < frameCount-1){
                                let curveData = input.readCurve();
                                Object.assign(frameData, curveData);
                            }
                            break;
                        case 'twoColor':
                            throw new Error('not implemented: animation slot twoColor!');
                            frameData.light = input.readColor();
                            frameData.dark = input.readColor();
                            if(frameIndex < frameCount-1){
                                let curveData = input.readCurve();
                                Object.assign(frameData, curveData);
                            }
                            break;
                        default:
                            throw new Error('not implemented: animation slot unknown type!');
                    }
                    
                    data.slots[slotName][timelineName].push(frameData);
                }
            }
        }
        
        let boneCount = input.readInt(true);
        if(boneCount > 0){
            data.bones = {};
        }
        for (let i = 0; i < boneCount; i++) {
            let boneName = input.readBoneName();
            data.bones[boneName] = {};
            
            let timelineCount = input.readInt(true);
            for (let timelineIndex = 0; timelineIndex < timelineCount; timelineIndex++) {
                let timelineType = BoneTimelineType[input.readByte()];
                data.bones[boneName][timelineType] = [];
                
                let frameCount = input.readInt(true);
                for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                    let frameData = {};
                    frameData.time = input.readFloat(4);
                    
                    switch(timelineType){
                        case 'rotate':
                            frameData.angle = input.readFloat(4);
                            if(frameIndex < frameCount-1){
                                let curveData = input.readCurve();
                                Object.assign(frameData, curveData);
                            }
                            break;
                        case 'translate':
                        case 'scale':
                        case 'shear':
                            frameData.x = input.readFloat(4);
                            frameData.y = input.readFloat(4);
                            if(frameIndex < frameCount-1){
                                let curveData = input.readCurve();
                                Object.assign(frameData, curveData);
                            }
                            break;
                        default:
                            throw new Error('not implemented: animation slot unknown type!');
                    }
                    
                    data.bones[boneName][timelineType].push(frameData);
                }
            }
        }
        
        let ikCount = input.readInt(true);
        if(ikCount > 0){
            data.ik = {};
            throw new Error('not implemented: animation ik');
        }
        
        let transformCount = input.readInt(true);
        if(transformCount > 0){
            data.transform = {};
            throw new Error('not implemented: animation transform');
        }
        
        let pathCount = input.readInt(true);
        if(pathCount > 0){
            data.path = {};
        }
        for (let i = 0; i < pathCount; i++) {
            let pathName = input.readPathName();
            data.path[pathName] = {};
        
            let timelineCount = input.readInt(true);
            for (let timelineIndex = 0; timelineIndex < timelineCount; timelineIndex++) {
                let timelineType = PathTimelineType[input.readByte()];
                data.path[pathName][timelineType] = [];
                
                let frameCount = input.readInt(true);
                for(let frameIndex = 0; frameIndex < frameCount; frameIndex++){
                    let frameData = {};
                    frameData.time = input.readFloat(4);
                    
                    switch(timelineType){
                        case 'position':
                            frameData.position = input.readFloat();
                            break;
                        case 'spacing':
                            frameData.spacing = input.readFloat();
                            break;
                        case 'mix':
                            frameData.rotateMix = input.readFloat();
                            frameData.translateMix = input.readFloat();
                            break;
                        default:
                            throw new Error('not implemented: animation path unknown type!');
                    }
                    
                    if(frameIndex < frameCount-1){
                        let curveData = input.readCurve();
                        Object.assign(frameData, curveData);
                    }
                    
                    data.path[pathName][timelineType].push(frameData);
                }
            }
        }
        
        // deforms also skins
        let deformCount = input.readInt(true);
        if(deformCount > 0){
            data.deform = {};
        }
        for (let i = 0; i < deformCount; i++) {
            let skinName = input.readSkinName();
            data.deform[skinName] = {};
            
            let slotCount = input.readInt(true);
            for (let slotSeq = 0; slotSeq < slotCount; slotSeq++) {
                let slotName = input.readSlotName();
                data.deform[skinName][slotName] = {};
                
                let timelineCount = input.readInt(true);
                for (let timelineIndex = 0; timelineIndex < timelineCount; timelineIndex++) {
                    let attachmentName = input.readStringRef();
                    data.deform[skinName][slotName][attachmentName] = [];
                    
                    let frameCount = input.readInt(true);
                    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                        let frameData = {};
                        frameData.time = input.readFloat(4);
                        
                        let end = input.readInt(true);
                        
                        if(end != 0){
                            let start = input.readInt(true);
                            frameData.offset = start;
                            frameData.vertices = [];
                            
                            end += start;
                            for (let v = start; v < end; v++){
                                frameData.vertices.push(input.readFloat() * input.scale);
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
        
        let draworderCount = input.readInt(true);
        if(draworderCount > 0){
            data.draworder = [];
            for(let i=0; i < draworderCount; i++){
                const draworder = {};
                draworder.time = input.readFloat();
                draworder.offsets = [];
                let changeCount = input.readInt(true);
                for(let changeIndex=0; changeIndex < changeCount; changeIndex++){
                    const draworderOffset = {};
                    draworderOffset.slot = input.readSlotName();
                    draworderOffset.offset = input.readInt(true);
                    draworder.offsets.push(draworderOffset);
                }
                data.draworder.push(draworder);
            }
        }
        
        let eventCount = input.readInt(true);
        if(eventCount > 0){
            data.events = {};
            throw new Error('not implemented: animation event');
        }
        
        return data;
    },
    readCurve: function(){
        let curveType = this.readInt(true);
        switch(curveType){
            case 0:
                return {};
            case 1:
                return { curve: 'stepped' };
            case 2:
                return this.readBezierCurve();
            default:
                throw new Error('not implemented: curve type', curveType);
        }
    },
    readBezierCurve: function () {
        let data = {};
        let curve = [];
        for(let c = 0; c < 4; c++){
            curve.push(this.readFloat(4));
        }
        if(curve[0] != 0){
            data.curve = curve[0];
        }
        if(curve[1] != 0){
            data.c2 = curve[1];
        }
        if(curve[2] != 1){
            data.c3 = curve[2];
        }
        if(curve[3] != 1){
            data.c4 = curve[3];
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
        if (defaultSkin !== null) {
            input.json.skins.push(defaultSkin);
        }
        
        // non-default skins
        let skinsCount = input.readInt(true);
        if(skinsCount < 1 && defaultSkin === null){
            input.json.skins = undefined;
        }
        for (let i = 0; i < skinsCount; i++) {
            throw new Error('not implemented: non default skin!');
        }
        
        let eventCount = input.readInt(true);
        if(eventCount < 1){
            input.json.events = undefined;
        }
        for (let i = 0; i < eventCount; i++) {
            throw new Error('not implemented: events');
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
