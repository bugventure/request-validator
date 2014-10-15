'use strict';

var middleware = require('./lib/middleware.js'),
    create = middleware.create;

create.use = middleware.use;

module.exports = create;