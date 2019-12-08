const PlixPlayingTrack = require('./PlixPlayingTrack');
const EventEmitter = require('events');

module.exports = class PlixPlayer extends EventEmitter {

    constructor(effects, ledCount){
        super();
        this.effects = effects;
        this.ledCount = ledCount;
        this.onTick = this.onTick.bind(this);
        this.onStop = this.onStop.bind(this);
    }

    play(trackData){
        if (this.track) {
            this.stop();
        }
        this.track = new PlixPlayingTrack(trackData, this.ledCount, this.effects);
        this.track.play();
        this.track.addListener("tick",this.onTick);
        this.track.addListener("stop",this.onStop);
    }

    updateTime(ms){
        if (this.track) this.track.updateTime(ms);
    }

    stop(){
        if (this.track) {
            this.track.stop();
            this.track = null;
        }
    }

    getBeat(){
        if (this.track) return this.track.getBeat();
        return -1;
    }
    getTime(){
        if (this.track) return this.track.getTime();
        return -1;
    }

    onTick(bufferHandler){
        throw new Error("On tick not implemented");
    }

    onStop(reason){
        console.log(`Track stopped. Reason: ${reason}`)
    }
};