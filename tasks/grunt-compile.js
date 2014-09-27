var Rx = require('rx');
var Observable = Rx.Observable;
var fs = require('fs');
var mkpath = require('mkpath');
var _ = require('lodash');
var readDir = Rx.Observable.fromNodeCallback(fs.readdir);
var writeFile = Rx.Observable.fromNodeCallback(fs.writeFile);
var readFile = Rx.Observable.fromNodeCallback(fs.readFile);
var makePath = Rx.Observable.fromNodeCallback(mkpath);
var stats = Rx.Observable.fromNodeCallback(fs.stat);
var path = require('path');
var browserify = require('browserify');

module.exports = function(grunt) {
    grunt.registerMultiTask('compile', 'Compiling the source codes.', function () {
        var done = this.async();
        var options = this.options({
            src: 'tmp',
            cwd: '.',
            dest: '.'
        });
        var pathToSrc = path.join(options.cwd, options.src);
        readDir(pathToSrc).
            selectMany(function(files) {
                return Observable.fromArray(files);
            }).
            select(function(file) {
                return grunt.file.readJSON(path.join(pathToSrc, file));
            }).
            selectMany(function(json) {
                return Observable.
                    zip(bundle(json.absoluteSrc), buildHtml(json), function(src, html) {
                        return [json, src, html];
                    });
            }).
            selectMany(function(compiledValues) {
                var pathToDestination = path.join(options.dest, compiledValues[0].app);
                var pathToSrc = path.join(pathToDestination, 'js');
                var src = path.join(pathToSrc, 'index.js');
                var html = path.join(pathToDestination, 'index.html');

                var writeSource = writeFile(src, compiledValues[1]);
                var writeHtml = writeFile(html, compiledValues[2]);
                var compile = Observable.zip(writeSource, writeHtml, function() {
                    return 'Great Success!';
                });

                return makePath(pathToDestination).
                    concat(makePath(pathToSrc)).
                    concat(compile).
                    skip(2);
            }).
            subscribe(function(f) {
                console.log(f);
            }, done, done);
    });
};

function bundle(file) {
    var b = browserify(file, {standaloneModule: true});
    b.require('./node_modules/jquery-browserify/lib/jquery.js', {expose: 'jquery'});

    return Rx.Observable.create(function(observer) {
        b.bundle(function(err, res) {
            if (err) {
                observer.onError(err);
            } else {
                observer.onNext(res);
                observer.onCompleted();
            }
        });
    });
}

function buildHtml(json) {
    return Observable.returnValue(_.template(json.indexHtml, json));
}
