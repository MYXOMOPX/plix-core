const PlixBufferHandler = require("./buffer/PlixBufferHandler");

const EMPTY_OBJECT = {};


/**
 * @typedef {{
 *    stage: number,
 *    recordIndex: number,
 *    repeatIndex: number,
 *    positions: Array<Array<number>>,
 *    beat: number,
 *    recordParams: Object
 * }} EffectData
 */

/**
 * @type {module.PlixPlayingTrack}
 */

module.exports = class PlixPlayingTrack {

    constructor(data, ledCount, effects){
        this._data = data;
        this.effects = effects;
        this.samples = data.samples;
        this.samplesList = Object.keys(data.samples).sort((i1,i2) => {
            return data.samples[i1].priority - data.samples[i2].priority
        });
        const trackMeta = this.trackMeta = data.track;
        this.records = data.records;
        this.ledCount = ledCount;
        this.bufferHandler = new PlixBufferHandler(ledCount);

        this.bpm = trackMeta.bpm;
        this.bpms = trackMeta.bpm/60000;
        this.beatCount = trackMeta.bpm_count;

        this._handleSamplePositions();
        this._initSamplesData();
        this._initSamplesFunctions();
        this._tick = this._tick.bind(this);
    }

    play() {
        if (this._stopLoop != null) {
            this.stop();
        }
        this.startTime = Date.now();
        this._stopLoop = setLoop(this._tick);
    }

    stop() {
        console.log("stopping");
        this._stopLoop();
        this._stopLoop = null;
    }

    getBeat(){
        const timeDif = Date.now()-this.startTime;
        return timeDif*this.bpms;
    }

    updateTime(ms){
        this.startTime = Date.now()-ms;
    }

    _handleSamplePositions(){
        // ToDo handle array of {from,to}
        const positions = this.positions = {};
        for (let pName in this._data.positions) {
            const posName = pName; // Ignore warnings
            const pos = this._data.positions[posName];
            if (typeof pos === "object") {
                if (pos instanceof Array) {
                    positions[posName] = pos
                } else if (pos.from != null && pos.to != null) {
                    positions[posName] = range(pos.from,pos.to);
                } else {
                    throw new Error(`Bad position '${posName}' specified: ${positions}`);
                }
            }  else if (typeof pos === "number") {
                positions[posName] = [pos]
            } else {
                throw new Error(`Bad position '${posName}' specified: ${positions}`);
            }
        }
        this.samplesList.forEach(sampleName => {
            const sample = this.samples[sampleName];
            sample.positions = sample.positions.map(pos => {
                if (typeof pos === "string") return this.positions[pos];
                return pos;
            });
        })
    }

    _initSamplesFunctions(){
        this.sampleFunctions = {};
        this.samplesList.forEach(sampleName => {
            const sample = this.samples[sampleName];
            const effectFn = this.effects[sample.effect];
            let preModifiers=[], postModifiers=[];
            if (sample.modifiers) {
                preModifiers = sample.modifiers
                                    .filter(descr => descr.type === "pre")
                                    .map(descr => {
                                        const fn = this.effects[descr.effect];
                                        return fn.bind(fn, descr.params || EMPTY_OBJECT)
                                    });
                postModifiers = sample.modifiers
                                    .filter(x => x.type === "post")
                                    .map(descr => {
                                        const fn = this.effects[descr.effect];
                                        return fn.bind(fn, descr.params || EMPTY_OBJECT)
                                    });
            }
            const sequence = [
                ...preModifiers,
                effectFn.bind(effectFn, this.samplesInitData[sampleName]),
                ...postModifiers
            ];
            this.sampleFunctions[sampleName] = (...args) => {
                sequence.forEach(fn => {
                    fn(...args)
                })
            }
        });
    }

    _initSamplesData(){
        // TODO add more params to init function OR probably remove init functions feature;
        const samplesInitData = this.samplesInitData = {};
        for (let sampleName of this.samplesList) {
            const sample = this.samples[sampleName];
            const effectName = sample.effect;
            const effect = this.effects[effectName];
            if (!effect) {
                throw new Error("No effect found for sample: " + sampleName, "Effects:", effects)
            }
            if (effect.init) {
                samplesInitData[sampleName] = effect.init(sample.init_data, this.bufferHandler)
            } else {
                samplesInitData[sampleName] = sample.init_data;
            }
        }
    }

    _tick() {
        const beat = this.getBeat();
        if (beat > this.trackMeta.beats_count) {
            this.stop();
        }
        this.bufferHandler.reset();
        for (let sampleName of this.samplesList) {
            this._handleSample(sampleName, this.bufferHandler, beat)
        }
        this.onTick(this.bufferHandler)
    }

    _handleSample(sampleName, bufferHandler, beat) {
        const sample = this.samples[sampleName];
        const sampleFunction = this.sampleFunctions[sampleName];
        const repeats = sample.beats.filter(b => beat >= b && beat <= b+sample.length);
        const localBufferHandler = new PlixBufferHandler(this.ledCount);
        const positions = sample.positions;
        repeats.forEach((beatAdd,repeatIndex) => {
            const records = sample.record
                .map((rec,i) => [rec,i])
                .filter(data => {
                    const rec = data[0];
                    return (rec[0]+beatAdd) <= beat && beat <= (rec[0]+rec[1]+beatAdd)
                });
            if (!records.length) return;
            records.forEach(([rec,recordIndex]) => {
                const beatStart = rec[0]+beatAdd;
                const beatEnd = rec[0]+rec[1]+beatAdd;
                const stage = (beat-beatStart)/(beatEnd-beatStart);
                const effectData = {
                    stage, recordIndex, repeatIndex, positions, beat, recordParams: rec[2] || EMPTY_OBJECT
                };
                sampleFunction(effectData,localBufferHandler)
            });
            const overlayMethod = sample.overlay_method || "just";
            bufferHandler.combineWith(localBufferHandler,overlayMethod)
        });
    }

    onTick(bufferHandler){}


};

function setLoop(fn){
    if (typeof requestAnimationFrame === "function") {
        let stopped = false;
        const loop = () => {
            if (stopped) return;
            fn();
            requestAnimationFrame(loop)
        };
        requestAnimationFrame(loop);
        return () => stopped = true;
    } else {
        const interval = setInterval(fn, 1);
        return () => clearInterval(interval);
    }
}

function range(start, end) {
    const a = Math.min(start,end);
    const reversed = (start > end);
    const length = reversed ? start-end : end - start;
    const arr = (new Array(length + 1)).fill(undefined).map((_, i) => i + a);
    if (reversed) return arr.reverse();
    return arr;
}