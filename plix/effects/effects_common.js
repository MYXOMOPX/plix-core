const colorUtils = require("../../index").colorUtils;

const WHITE = [255,255,255];
const BLACK = [0,0,0];

const effects = {};

// module.exports.blink = function blink(stage, initParams, params, setFn, beat, bufferHandler) {
//     const position = params.position || initParams.position;
//     const color = params.color || initParams.color;
//     if (stage < 0.5) {
//         bufferHandler.set(position,color);
//     }
// };
effects.light = function light(initParams, data, bufferHandler) {
    const positions = data.positions;
    const color = data.recordParams.color || initParams.color || WHITE;
    positions.forEach(x => {
        bufferHandler.set(x,color)
    });
};

function getValueFromRepeatList(index, listData){
    if (listData instanceof Array) return listData[index];
    if (typeof listData !== "object") return false;
    const type = listData.type;
    if (type === "each") {
        const keys = Object.keys(listData);
        const foundKey = keys.filter(x => x !== "type").find(key => {
           const NIndex = key.indexOf("n");
           const nVal = Number(key.substring(0,NIndex));
           const plusIndex = key.indexOf("+");
           let additionalVal = 0;
           if (plusIndex >= 0) additionalVal = Number(key.substring(plusIndex+1));
           return index%nVal === additionalVal;
        });
        return listData[foundKey];
    } else if (type === "after") {
        let keys = Object.keys(listData);
        keys.splice(keys.indexOf("type"),1);
        const foundKey = keys.map(x => Number(x)).reverse().find(key => {
            return key <= index;
        });
        return listData[foundKey]
    }
}


effects.mod_filter_positions = function blink(initParams, data, bufferHandler) {
    let index, listData;
    if (initParams.records) {
        index = data.recordIndex;
        listData = initParams.records;
    } else {
        index = data.repeatIndex;
        listData = initParams.repeats;
    }
    const postitionIndexes = getValueFromRepeatList(index,listData);
    if (!postitionIndexes) return;
    data.positions = data.positions.filter((x,i) => postitionIndexes.indexOf(i) >= 0);
};

// effects.mod_strob = function glitch_mod(initParams, data, bufferHandler) {
//     const localBH = bufferHandler.getEmpty();
//     const stage = data.stage;
//     const blinkCount = initParams.count || 1;
//     const stagePart = 1/blinkCount;
//     const gGain = initParams.gain || 1;
//     let blinkTime = 0;
//     while ((blinkTime+1)*stagePart < stage) blinkTime++;
//
//     const isEven = blinkTime%2 === 0;
//     const gain = (1-(stage-blinkTime*stagePart))*blinkCount;
//     for (let i = isEven ? 0 : 1; i < bufferHandler.length; i+=2) {
//         localBH.set(i, colorUtils.gain(WHITE, gain*gGain));
//     }
//     bufferHandler.combineWith(localBH,"dif");
// };

effects.mod_strob = function glitch_mod(initParams, data, bufferHandler, modStage) {
    const stage = modStage;
    const blinkCount = initParams.count || 1;
    const stagePart = 1/blinkCount;
    let blinkTime = 0;
    while ((blinkTime+1)*stagePart < stage) blinkTime++;
    const gain = (1-(stage-blinkTime*stagePart)*blinkCount);
    effects.mod_gain({
        value: gain,
    }, data, bufferHandler)
};
effects.mod_gain = function mod_gain(initParams, data, bufferHandler) {
    const value = initParams.value;
    for (let i = 0; i < bufferHandler.length; i++) {
        const clr = bufferHandler.buffer[i];
        if (clr === null) continue;
        const color = colorUtils.numberToColor(clr);
        bufferHandler.set(i,colorUtils.gain(color,value));
    }
};

effects.mod_filter_records = function mod_filter_records(initParams, data, bufferHandler){
    const mode = initParams.mode;
    const repeat = data.repeatIndex;
    const record = data.recordIndex;
    const recordList = initParams.map[repeat] || [];
    if (mode === "blacklist") {
        if (recordList.indexOf(record) >= 0) {
            bufferHandler.reset();
        }
    } else if (mode === "whitelist") {
        if (recordList.indexOf(record) < 0) {
            bufferHandler.reset();
        }
    }
};


effects.mod_animate_position_size = function mod_animate_position_size(initParams, data, bufferHandler, stage){
    const valueMap = initParams.values;
    const points = Object.keys(valueMap).map(x => Number(x));
    const values = Object.values(valueMap);
    if (points[0] !== 0) {
        points.unshift(0);
        values.unshift(0);
    }
    if (points[points.length-1] !== 1) {
        points.push(1);
        values.push(values[values.length-1]);
    }
    const targetPointI = points.findIndex(p => p >= stage);
    const targetPoint = points[targetPointI];
    const prevPoint = points[targetPointI-1];

    const targetValue = values[targetPointI];
    const prevValue = values[targetPointI-1];

    const pointStage = (stage-prevPoint)/(targetPoint-prevPoint);
    const valueDif = targetValue-prevValue;
    const currentValue = prevValue + valueDif*pointStage;

    data.positions = data.positions.map(pos => {
        const leds = pos.slice(0);
        if (currentValue >= 0) {
            for (let i = 0; i < currentValue; i++) {
                leds.unshift(leds[0]-1);
                leds.push(leds[leds.length-1]+1);
            }
        } else {
            const val = currentValue*-1;
            for (let i = 0; i < val; i++) {
                leds.pop();
                leds.shift();
            }
        }
        return leds;
    });
};

module.exports = effects;