const colorUtils = require("../utils/color_utils");

module.exports = class PlixBufferHandler {

    constructor(length){
        this.length = length;
        this.reset();
    }

    reset(){
        this.pixels = new Uint32Array(this.length);
    }

    set(part, color) {
        const clr = typeof color === "number" ? color : colorUtils.toNumberColor(color);
        const typeOfPart = typeof  part;
        if (typeof part === "number") {
            this.pixels[part] = clr
        } else if (typeOfPart === "object") {
            if (part instanceof Array) {
                part.forEach((p) => this.pixels[p] = clr);
            } else if (part.from && part.to) {
                range(part.from, part.to).forEach((p) => this.pixels[p] = clr);
            } else {
                throw new Error("Part not supported: "+part)
            }
        } else {
            throw new Error("Part not supported: "+part)
        }
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
    return (new Array(end - start + 1)).fill(undefined).map((_, i) => i + start);
}