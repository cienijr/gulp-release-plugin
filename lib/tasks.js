'use strict';

var through = require('through2'),
    versionFinder = require('./utils/version'),
    filter = require('gulp-filter'),
    gutil = require('gulp-util'),
    git = require('gulp-git'),
    bump = require('./bump'),
    tag = require('./tag'),
    _ = require('lodash');

module.exports = function (gulp, defaults) {

    defaults = _.defaults({
        key: 'version',

        files: {
            reference: 'package.json',
            targets: [
                './package.json',
                './bower.json'
            ],
            destination: './',
        },

        versionPrefix: '',

        releaseType: 'patch',
        messages: {
            commit: '[Gulp Release Plugin] Bump project version: %VERSION%',
            tag: '[Gulp Release Plugin] Create release tag: %VERSION%'
        }
    }, defaults);

    var applyVersion = function (message) {
        var json = null;

        gulp.src(defaults.files.targets)
            .pipe(filter(defaults.files.reference))
            .pipe(through.obj(function (file, enc, cb) {
                if (file.isNull()) {
                    cb(null, file);
                    return;
                }

                if (file.isStream()) {
                    cb(new gutil.PluginError('gulp-release-plugin', 'Streaming not supported'));
                    return;
                }

                json = file.contents.toString();
                cb(null, file);
            }));

        return message.replace('%VERSION%', versionFinder(json, defaults.key));
    };

    var bumpVersion = function (version, commitMessage) {
        var type = null;
        if (version && (version === 'patch' || version === 'minor'
            || version === 'major' || version === 'prerelease')) {
            type = version;
            version = null;
        }

        return gulp.src(defaults.files.targets)
            .pipe(bump({
                key: defaults.key,
                version: version,
                type: type
            }))
            .pipe(gulp.dest(defaults.files.destination))
            .pipe(git.commit(applyVersion(commitMessage || defaults.messages.commit)))
            .pipe(through.obj(function (file, enc, cb) {
                if (file.isNull()) {
                    cb(null, file);
                    return;
                }

                if (file.isStream()) {
                    cb(new gutil.PluginError('gulp-release-plugin', 'Streaming not supported'));
                    return;
                }

                git.push('origin', 'master', {
                    args: '--tags'
                });

                cb(null, file);
                cb(null, file);
            }));
    };

    var createTag = function (tagMessage) {
        return gulp.src(defaults.files.targets)
            .pipe(tag({
                key: defaults.key,
                message: tagMessage || defaults.messages.tag,
                prefix: defaults.versionPrefix
            }));
    };

    var exportTasks = function () {
        gulp.task('bump', bumpVersion);
        gulp.task('tag', createTag);
    };

    return {
        bumpVersion: bumpVersion,
        createTag: createTag,
        exportTasks: exportTasks
    };

};
