'use strict';

module.exports = function (jsonString, versionKey) {
    return JSON.parse(jsonString)[versionKey];
};