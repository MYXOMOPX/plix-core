const colorUtils = require("../utils/color_utils");

module.exports = class PlixBufferHandler {

    constructor(length){
        this.length = length;
        this.reset();
        this._setLed = this._setLed.bind(this);
        this.set_just = this.set_just.bind(this);
        this.set_sum = this.set_sum.bind(this);
        this.set_dif = this.set_dif.bind(this);
    }

    reset(){
        this.pixels = new Uint32Array(this.length);
    }

    _setLed(i,color,method){
        if (method === "sum") {
            const currentColor = colorUtils.numberToColor(this.pixels[i]);
            const resColor = colorUtils.sum(currentColor,color);
            this.pixels[i] = colorUtils.colorToNumber(resColor);
        } else if (method === "dif") {
            const currentColor = colorUtils.numberToColor(this.pixels[i]);
            const resColor = colorUtils.dif(currentColor,color);
            this.pixels[i] = colorUtils.colorToNumber(resColor);
        } else {
            this.pixels[i] = colorUtils.colorToNumber(color);
        }
    }

    set(part, color, method="just") {
        const typeOfPart = typeof  part;
        if (typeof part === "number") {
            this._setLed(part,color,method)
        } else if (typeOfPart === "object") {
            if (part instanceof Array) {
                part.forEach((p) => this._setLed(p,color,method));
            } else if (part.from && part.to) {
                range(part.from, part.to).forEach((p) => this._setLed(p,color,method));
            } else {
                throw new Error("Part not supported: "+part)
            }
        } else {
            throw new Error("Part not supported: "+part)
        }
    }

    set_just(part,color) {
        return this.set(part,color,"just")
    }
    set_sum(part,color) {
        return this.set(part,color,"sum")
    }
    set_dif(part,color) {
        return this.set(part,color,"dif")
    }

    getIndexes(part) {
        const typeOfPart = typeof  part;
        if (typeOfPart === "number") {
            return [part];
        } else if (typeOfPart === "object") {
            if (part instanceof Array) return part;
            else if (part.from && part.to) return range(part.from, part.to);
            else return undefined;
        }
        return undefined;
    }

    getPixels() {
        return this.pixels;
    }
};

function range(start, end) {
    const a = Math.min(start,end);
    const reversed = (start > end);
    const length = reversed ? start-end : end - start;
    const arr = (new Array(length + 1)).fill(undefined).map((_, i) => i + a);
    if (reversed) return arr.reverse();
    return arr;
}