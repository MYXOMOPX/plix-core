const PlixBufferHandler = require("../buffer/PlixBufferHandler");
const EventEmitter = require('events');
const {setLoop, range} = require("../utils/functions");

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

module.exports = class PlixPlayingTrack extends EventEmitter{

    constructor(data, ledCount, effects){
        super();
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
        this.bpm_offset = trackMeta.bpm_offset || 0;
        this.bpms = trackMeta.bpm/60000;
        this.beatsCount = trackMeta.beats_count;
        this.isLoop = trackMeta.loop;

        this._handleSamplePositions();
        this._initSamplesData();
        this._initSamplesFunctions();
        this._tick = this._tick.bind(this);
    }

    play() {
        if (this._stopLoop != null) {
            this._stop("RESTART");
        }
        this.startTime = Date.now();
        this._stopLoop = setLoop(this._tick);
    }

    stop(){
        this._stop();
    }

    _stop(reason="MANUAL") {
        this.emit('stop',reason);
        if (!this._stopLoop) return;
        this._stopLoop();
        this._stopLoop = null;
    }

    getBeat(){
        const time = this.getTime()-this.bpm_offset;
        return time*this.bpms;
    }

    getTime() {
        return Date.now()-this.startTime;
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
                                    .filter(descr => descr.type === "pre");
                postModifiers = sample.modifiers
                                    .filter(x => x.type === "post");
            }
            const sequence = [
                ...preModifiers,
                effectFn,
                ...postModifiers
            ];
            this.sampleFunctions[sampleName] = (sampleBeat, sampleLength, effectStage, ...args) => {
                sequence.forEach(element => {
                    if (typeof element === "function") {
                        element(this.samplesInitData[sampleName], ...args);
                        return;
                    }
                    const fn = this.effects[element.effect];
                    const start = element.start || 0;
                    const length = element.length || sampleLength-start;
                    const end = start+length;
                    if (sampleBeat >= start && sampleBeat <= end) {
                        const modStage = element.use_record_stage ? effectStage : (sampleBeat-start)/(length);
                        fn(element.params, ...args, modStage)
                    }
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
        if (beat >= this.beatsCount) {
            if (this.isLoop) {
                this.startTime = Date.now();
                return;
            }
            this._stop("END");
            return;
        }
        this.bufferHandler.reset();
        for (let sampleName of this.samplesList) {
            this._handleSampleTick(sampleName, this.bufferHandler, beat)
        }
        this.emit('tick',this.bufferHandler);
    }

    _handleSampleTick(sampleName, bufferHandler, beat) {
        const sample = this.samples[sampleName];
        const sampleFunction = this.sampleFunctions[sampleName];
        const repeats = sample.beats
                .map((b,i) => [b,i])
                .filter(([b]) => beat >= b && beat <= b+sample.length);
        const localBufferHandler = new PlixBufferHandler(this.ledCount); // ToDo make localBH for each repeats or records
        const positions = sample.positions;
        repeats.forEach(([beatAdd,repeatIndex]) => {
            const beatOfSample = beat-beatAdd;
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
                sampleFunction(beatOfSample, sample.length, stage, effectData, localBufferHandler)
            });
            const overlayMethod = sample.overlay_method || "just";
            bufferHandler.combineWith(localBufferHandler,overlayMethod)
        });
    }

    get data() {
        return this._data;
    }
};
