const {setLoop, range} = require("../utils/functions");

const GARLAND_EFFECTS = [];

GARLAND_EFFECTS[0] = function(){};

module.exports = class PlixGarland {

    constructor(strip,effectRepeatTimes=6){
        this.strip = strip;
        this.ledCount = strip.ledCount;
        this.effectRepeatTimes = 6;
    }

    start(interval=5000){
        this.startTime = Date.now();
        this.interval = interval;
    }

    stop(){
        this.startTime = null;
        this.interval = null;
    }

    tick(){

    }
};