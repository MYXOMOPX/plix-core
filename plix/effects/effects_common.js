module.exports.blink = function blink(stage, initParams, params, setFn, beat, bufferHandler) {
    const position = params.position || initParams.position;
    const color = params.color || initParams.color;
    if (stage < 0.5) {
        bufferHandler.set(position,color);
    }
};
