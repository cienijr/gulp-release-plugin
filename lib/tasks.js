'use strict';

var through = require('through2'),
    versionFinder = require('./utils/version'),
    filter = require('gulp-filter'),
    gutil = require('gulp-util'),
    git = require('gulp-git'),
    bump = require('./bump'),
    tag = require('./tag'),
    _ = require('lodash');

module.exports = function (gulp, config) {

    _.defaults(config, {
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
            commit: '[Gulp Release Plugin] Bump project version',
            tag: '[Gulp Release Plugin] Create release tag: %VERSION%'
        }
    });

    var bumpVersion = function (version, commitMessage) {
        version = version || config.releaseType;
        commitMessage = commitMessage || config.messages.commit;

        var type = null;
        if (['patch', 'minor', 'major', 'prerelease'].indexOf(version) !== -1) {
            type = version;
            version = null;
        }

        return gulp.src(config.files.targets)
            .pipe(bump({
                key: config.key,
                version: version,
                type: type
            }))
            .pipe(gulp.dest(config.files.destination))
            .pipe(git.commit(commitMessage || config.messages.commit))
            .pipe(filter(config.files.reference))
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
            }));
    };

    var createTag = function (tagMessage) {
        tagMessage = tagMessage || config.messages.tag;

        return gulp.src(config.files.targets)
            .pipe(filter(config.files.reference))
            .pipe(tag({
                key: config.key,
                message: tagMessage || config.messages.tag,
                prefix: config.versionPrefix
            }));
    };

    var exportTasks = function () {
        gulp.task('bump', function () {
            bumpVersion();
        });
        gulp.task('tag', function () {
            createTag();
        });
    };

    return {
        bumpVersion: bumpVersion,
        createTag: createTag,
        exportTasks: exportTasks
    };

};

