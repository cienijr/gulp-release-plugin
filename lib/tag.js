'use strict';

var _ = require('lodash'),
    git = require('gulp-git'),
    gutil = require('gulp-util'),
    through = require('through2'),
    versionFinder = require('./utils/version');

module.exports = function (options) {

    options = _.defaults({
        key: 'version',
        message: 'Release: %VERSION%',
        version: null,
        prefix: ''

    }, options);

    return through.obj(function (file, enc, cb) {
        var version;

        if (options.version) {
            version = options.version;
        } else {
            if (file.isNull()) {
                cb(null, file);
                return;
            }

            if (file.isStream()) {
                cb(new gutil.PluginError('gulp-release-plugin', 'Streaming not supported'));
                return;
            }

            version = versionFinder(file.contents.toString(), options.key);
        }

        var tag = options.prefix + version;
        var message = options.message.replace('%VERSION%', tag);

        gutil.log('About to create tag: \'' + gutil.colors.cyan(tag) + '\'');
        git.tag(tag, message, options);

        cb(null, file);
    });
};