const EMPTY_OBJECT = {};

module.exports = class PlixPlayingTrack {

    constructor(data, ledCount, bufferHandler, effects){
        this._data = data;
        this.effects = effects;
        this.samples = data.samples;
        this.samplesList = Object.keys(data.samples).sort((i1,i2) => {
            return data.samples[i1].priority - data.samples[i2].priority
        });
        const trackMeta = this.trackMeta = data.track;
        this.records = data.records;
        this.ledCount = ledCount;
        this.bufferHandler = bufferHandler;

        this.bpm = trackMeta.bpm;
        this.bpms = trackMeta.bpm/60000;
        this.beatCount = trackMeta.bpm_count;

        this._initSamplesData();
        this._tick = this._tick.bind(this);
    }

    play() {
        if (this._interval != null) {
            this.stop();
        }
        this.startTime = Date.now();
        this._interval = setInterval(this._tick, 5);
    }

    stop() {
        console.log("clear interval");
        clearInterval(this._interval);
        this._interval = null;
    }

    getBeat(){
        const timeDif = Date.now()-this.startTime;
        return timeDif*this.bpms;
    }

    updateTime(ms){
        this.startTime = Date.now()-ms;
    }

    _initSamplesData(){
        const samplesInitData = this.samplesInitData = {};
        for (let sampleName of this.samplesList) {
            const sample = this.samples[sampleName];
            const effectName = sample.effect;
            const effect = this.effects[effectName];
            if (!effect) {
                throw new Error("No effect found for sample: " + sampleName, "Effects:", effects)
            }
            console.log(sample.init_data);
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
            this._handleSample(this.samples[sampleName], this.samplesInitData[sampleName], this.bufferHandler, beat)
        }
        this.onTick(this.bufferHandler)
    }

    _handleSample(sample, initData, bufferHandler, beat) {
        const beats = sample.beats.filter(b => beat >= b && beat <= b+sample.length);
        beats.forEach((beatAdd,i) => {
            const records = sample.record
                .filter(rec => (rec[0]+beatAdd) <= beat && beat <= (rec[1]+beatAdd));
            if (!records.length) return;
            const effect_name = sample.effect;
            const effect = this.effects[effect_name];
            records.forEach(rec => {
                effect(bufferHandler,rec[0]+beatAdd,rec[1]+beatAdd,beat,initData,rec[2] || EMPTY_OBJECT)
            })
        });
    }

    onTick(bufferHandler){}


};