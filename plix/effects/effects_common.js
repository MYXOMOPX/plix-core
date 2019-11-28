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


effects.mod_filter_positions = function blink(initParams, data, bufferHandler) {
    const recs = initParams.records[data.recordIndex];
    if (recs === null) return;
    data.positions = data.positions.filter((x,i) => recs.indexOf(i) >= 0);
};

effects.mod_strob = function glitch_mod(initParams, data, bufferHandler) {
    const localBH = bufferHandler.getEmpty();
    const stage = data.stage;
    const blinkCount = initParams.count || 1;
    const stagePart = 1/blinkCount;
    const gGain = initParams.gain || 1;
    let blinkTime = 0;
    while ((blinkTime+1)*stagePart < stage) blinkTime++;

    const isEven = blinkTime%2 === 0;
    const gain = (1-(stage-blinkTime*stagePart))*blinkCount;
    for (let i = isEven ? 0 : 1; i < bufferHandler.length; i+=2) {
        localBH.set(i, colorUtils.gain(WHITE, gain*gGain));
    }
    bufferHandler.combineWith(localBH,"dif");
};
effects.mod_gain = function mod_gain(initParams, data, bufferHandler) {
    const localBH = bufferHandler.getEmpty();
    const value = initParams.value;
    const gain = 1-value;
    const gainedColor = colorUtils.gain(WHITE, gain);
    for (let i = 0; i < localBH.length; i++) {
        const color = colorUtils.numberToColor(bufferHandler.buffer[i]);
        localBH.set(i,colorUtils.gain(color,value));
    }
    bufferHandler.combineWith(localBH,"just");
};

module.exports = effects;