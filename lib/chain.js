'use strict';

module.exports = function chain() {
    var steps = Array.apply(null, arguments);

    return function middleware(req, res, next) {
        (function dequeue() {
            var step = steps.shift(),
                callback = steps.length ? function (err) {
                    if (err) {
                        return next(err);
                    }

                    dequeue();
                } : next;

            if (!step) {
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