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

module.exports.min = function min(color1, color2) {
    const hsl1 = rgbToHsl(color1);
    const hsl2 = rgbToHsl(color2);
    return hsl1[2] <= hsl2[2] ? color1 : color2;
};

module.exports.max = function max(color1, color2) {
    const hsl1 = rgbToHsl(color1);
    const hsl2 = rgbToHsl(color2);
    return hsl1[2] >= hsl2[2] ? color1 : color2;
};

module.exports.max_components = function max_components(color1, color2) {
    return color1.map((c,i) => {
        return Math.max(c, color2[i])
    })
};
module.exports.min_components = function min_components(color1, color2) {
    return color1.map((c,i) => {
        return Math.min(c, color2[i])
    })
};



/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 * @param {Number} r       The red color value
 * @param {Number} g       The green color value
 * @param {Number} b       The blue color value
 * @return  Array          The HSL representation
 */
function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [ h, s, l ];
}
module.exports.rgbToHsl = rgbToHsl;
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 * @param {Number} h       The hue
 * @param {Number} s       The saturation
 * @param {Number} l       The lightness
 * @return  Array          The RGB representation
 */
function hslToRgb([h, s, l]) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [ r * 255, g * 255, b * 255 ];
}

module.exports.hslToRgb = hslToRgb;