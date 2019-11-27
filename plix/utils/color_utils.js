module.exports.COLOR_BLACK = 0;

module.exports.colorToNumber = function colorToNumber([r, g, b]) {
    return (r << 16) | (g << 8)| b;
};
module.exports.numberToColor = function numberToColor(number) {
    if (number == null) return [0,0,0];
    return [16,8,0].map(offset => (number>>offset)&255);
};


module.exports.gain = function gain(color, gain) {
    return color.map(c => {
        n = c*gain;
        if (n > 255) return 255;
        return n;
    })
};

module.exports.shade = function shade(color, colorTo, stage) {
    return color.map((c,i) => {
        const dif = colorTo[i]-c;
        return c+(dif*stage);
    })
};

module.exports.sum = function sum(color1, color2) {
    return color1.map((c,i) => {
        const res = c+color2[i];
        if (res > 255) return 255;
        if (res < 0) return 0;
        return res;
    })
};

module.exports.dif = function dif(color1, color2) {
    return color1.map((c,i) => {
        const res = c-color2[i];
        if (res > 255) return 255;
        if (res < 0) return 0;
        return res;
    })
};
