const colorUtils = require("../utils/color_utils");

module.exports = class PlixBufferHandler {

    constructor(length){
        this.length = length;
        this.reset();
        this._setLed = this._setLed.bind(this);
    }

    reset(){
        this.buffer = new Array(this.length).fill(null);
    }

    _setLed(i,color,method){
        if (method === "sum") {
            const currentColor = colorUtils.numberToColor(this.parent.buffer[i]);
            const resColor = colorUtils.sum(currentColor,color);
            this.buffer[i] = colorUtils.colorToNumber(resColor);
        } else if (method === "dif") {
            const currentColor = colorUtils.numberToColor(this.parent.buffer[i]);
            const resColor = colorUtils.dif(currentColor,color);
            this.buffer[i] = colorUtils.colorToNumber(resColor);
        } else {
            this.buffer[i] = colorUtils.colorToNumber(color);
        }
    }

    set(leds, color, method="just") {
        const typeOfPart = typeof  leds;
        if (typeOfPart === "number") {
            this._setLed(leds,color,method)
        } else if (typeOfPart === "object" && leds instanceof Array) {
            leds.forEach((p) => this._setLed(p,color,method))
        } else {
            throw new Error("Bad leds specified: "+leds)
        }
    }

    // getIndexes(part) {
    //     const typeOfPart = typeof  part;
    //     if (typeOfPart === "number") {
    //         return [part];
    //     } else if (typeOfPart === "object") {
    //         if (part instanceof Array) return part;
    //         else if (part.from && part.to) return range(part.from, part.to);
    //         else return undefined;
    //     }
    //     return undefined;
    // }

    combineWith(bufferHandler, method="just") {
        const bufferB = bufferHandler.buffer;
        let mapFunction;
        if (method === "just") {
            mapFunction = (val,i) => {
                if (bufferB[i] !== null) return bufferB[i];
                return val;
            }
        } else if (method === "sum") {
            mapFunction = (val, i) => {
                const valB = bufferB[i];
                if (val === null && valB === null) return null;
                const currentColor = colorUtils.numberToColor(val);
                const colorB = colorUtils.numberToColor(valB);
                const resColor = colorUtils.sum(currentColor,colorB);
                return colorUtils.colorToNumber(resColor);
            }
        } else if (method === "dif") {
            mapFunction = (val, i) => {
                const valB = bufferB[i];
                if (val === null && valB === null) return null;
                const currentColor = colorUtils.numberToColor(val);
                const colorB = colorUtils.numberToColor(valB);
                const resColor = colorUtils.dif(currentColor,colorB);
                return colorUtils.colorToNumber(resColor);
            }
        }
        this.buffer = this.buffer.map(mapFunction)
    }

    getEmpty(){
        return new PlixBufferHandler(this.length);
    }

    getPixels() {
        return new Uint32Array(this.buffer);
    }
};