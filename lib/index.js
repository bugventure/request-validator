'use strict';

var middleware = require('./middleware.js'),
    create = middleware.create;

create.use = middleware.use;

module.exports = create;