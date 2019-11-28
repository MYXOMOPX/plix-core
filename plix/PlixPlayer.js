const PlixPlayingTrack = require('./PlixPlayingTrack');

module.exports = class PlixPlayer {

    constructor(effects, ledCount){
        this.effects = effects;
        this.ledCount = ledCount;
        this.onTick = this.onTick.bind(this);
    }

    play(trackData){
        if (this.track) {
            this.stop();
        }
        this.track = new PlixPlayingTrack(trackData, this.ledCount, this.effects);
        this.track.play();
        this.track.onTick = this.onTick;
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
    }
};