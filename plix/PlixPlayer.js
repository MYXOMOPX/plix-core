const PlixPlayingTrack = require('./PlixPlayingTrack');
const EventEmitter = require('events');

module.exports = class PlixPlayer extends EventEmitter {

    constructor(effects, ledCount){
        super();
        this.effects = effects;
        this.ledCount = ledCount;
        this.onTick = this.onTick.bind(this);
        this.onTrackStop = this.onTrackStop.bind(this);
    }

    async play(trackData){
        if (this._track) {
            this.stop("RESTART");
        }
        this._track = new PlixPlayingTrack(trackData, this.ledCount, this.effects);
        this._track.play();
        this._track.addListener("tick",this.onTick);
        this._track.addListener("stop",this.onTrackStop);
    }

    updateTime(ms){
        if (this._track) this._track.updateTime(ms);
    }

    stop(reason="MANUAL"){
        if (this._track) {
            this._track.stop();
            this._track = null;
        }
    }

    getBeat(){
        if (this._track) return this._track.getBeat();
        return -1;
    }
    getTime(){
        if (this._track) return this._track.getTime();
        return -1;
    }

    onTick(bufferHandler){
        throw new Error("On tick not implemented");
    }

    onTrackStop(reason){
        this._track = null;
        console.log(`Track stopped. Reason: ${reason}`)
    }

    get track(){
        return this._track;
    }

    get isPlaying(){
        return (this._track != null)
    }
};