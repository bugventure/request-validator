'use strict';

module.exports = function chain() {
    var args = Array.apply(null, arguments);

    return function middleware(req, res, next) {
        // make a copy of the functions, so that this middleware
        // can be called multiple times without side effects
        var steps = args.slice(0);

        (function dequeue() {
            var step = steps.shift(),
                callback = steps.length ? function (err) {
                    if (err) {
                        return next(err);
                    }

                    dequeue();
                } : next;

            if (!(step instanceof Function)) {
                return next();
            }

            try {
                step(req, res, callback);
            }
            catch (e) {
                next(e);
            }
        })();
    };
};