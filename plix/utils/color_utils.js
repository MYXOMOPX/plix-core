module.exports.COLOR_BLACK = 0;

module.exports.toNumberColor = function toNumberColor([r, g, b]) {
    return (r << 16) | (g << 8)| b;
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
