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

module.exports = function(grunt) {
    grunt.registerMultiTask('assemble', 'Assembling the source codes.', function() {
        var done = this.async();
        var options = this.options({
            cwd: '.',
            src: 'src/js',
            app: 'app/index.html'
        });

        var pathToApp = path.join(options.cwd, options.app);
        var pathToSrc = path.join(options.cwd, options.src);

        readDir(pathToSrc).
            selectMany(build(pathToSrc)).
            selectMany(getDetails).
            selectMany(function(details) {
                return readFile(pathToApp).
                    select(function(html) {
                        details.indexHtml = html.toString();
                        return details;
                    });
            }).
            selectMany(function(results) {
                return makePath('tmp').
                    select(function() {
                        return results;
                    });
            }).
            selectMany(function(results) {
                var name = results.app;
                return writeFile('tmp/' + name + '.json', JSON.stringify(results));
            }).
            subscribe(function() { }, done, done);
    });
};

function build(pathToSrc) {
    return function(files) {
        return Observable.
            fromArray(files).
            filter(ignoreFiles).
            selectMany(enumerateFiles(pathToSrc)).
            reduce(function(a, b) {
                a.push(b);
                return a;
            }, []);
    };
}

function enumerateFiles(pathToSrc) {
    return function(dir) {
        return readDir(path.join(pathToSrc, dir)).
            selectMany(function(files) {
                return Observable.fromArray(files);
            }).
            filter(ignoreFiles).
            select(function(file) {
                return [path.join(pathToSrc, dir, file), dir];
            });
    }
}

function ignoreFiles(f) {
    return !~f.indexOf('DS_Store') && !~f.indexOf('git');
}

// Takes in a set of files and builds the combined index.html file for the
// project.
function getDetails(files) {
    var fileObs = files.
        map(function(fileObject) {
            var f = fileObject[0];
            var dir = fileObject[1];
            return [readFile(f), Observable.returnValue(f), Observable.returnValue(dir)];
        }).
        reduce(function(a, b) {
            return a.concat(b);
        }, []);
    return Observable.zip.apply(null, fileObs.concat(assemble));
}

function assemble() {
    var contents = {
        script: '',
        html: '',
        css: ''
    };
    var args = Array.prototype.slice.call(arguments, 0);
    for (var i = 0; i < args.length; i += 3) {
        var c = args[i].toString();
        var name = args[i + 1];
        var app = args[i + 2];

        if (~name.indexOf('index.js')) {
            contents.script = c;
        } else if (~name.indexOf('css')) {
            contents.css = c;
        } else if (~name.indexOf('html')) {
            contents.html = c;
        } else if (~name.indexOf('js')) {
            contents.absoluteSrc = name;
            contents.src = './js/index.js';
            contents.title = 'Rx - Patterns | ' + app;
            contents.app = app;
        }
    }

    return contents;
}

if (require.main === module) {
    var dir = 'src/js/toggle/';
    readDir('src/js/toggle').
        select(function(files) {
            return files.map(function(f) {
                return dir + f;
            });
        }).
        selectMany(build).
        subscribe(function() {
            console.log('Finishing file: ' + JSON.stringify(arguments[0]));
        }, function(err) {
            console.log("OHH NO: " + err);
        });
}
