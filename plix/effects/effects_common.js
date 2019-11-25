module.exports.blink = function blink(bufferHandler, beat_start, beat_end, beat, initParams, params) {
    const position = params.position || initParams.position;
    const color = params.color || initParams.color;
    if (beat < beat_start+0.1) {
        bufferHandler.set(position,color);
    }
};