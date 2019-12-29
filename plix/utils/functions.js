module.exports.setLoop = function setLoop(fn){
    if (typeof requestAnimationFrame === "function") {
        let stopped = false;
        const loop = () => {
            if (stopped) return;
            fn();
            requestAnimationFrame(loop)
        };
        requestAnimationFrame(loop);
        return () => stopped = true;
    } else {
        const interval = setInterval(fn, 1);
        return () => clearInterval(interval);
    }
};

module.exports.range = function range(start, end) {
    const a = Math.min(start,end);
    const reversed = (start > end);
    const length = reversed ? start-end : end - start;
    const arr = (new Array(length + 1)).fill(undefined).map((_, i) => i + a);
    if (reversed) return arr.reverse();
    return arr;
};