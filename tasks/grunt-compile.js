var Rx = require('rx');
var Observable = Rx.Observable;
var fs = require('fs');
var readDir = Rx.Observable.fromNodeCallback(fs.readdir);
var writeFile = Rx.Observable.fromNodeCallback(fs.writeFile);
var readFile = Rx.Observable.fromNodeCallback(fs.readFile);
var stats = Rx.Observable.fromNodeCallback(fs.stat);

module.exports = function(grunt) {
    grunt.registerMultiTask('compile', 'Compiling the source codes.', function() {
        var done = this.async();
        var targetFolder = this.target;

        readDir('src/js/' + targetFolder).
            selectMany(build).
            subscribe(function() {
                console.log('Finishing file: ' + arguments);
            }, done, done);
    });
};

// Takes in a set of files and builds the combined index.html file for the
// project.
function build(dir, files) {
    var fileObs = files.
        map(function(f) {
            return [readFile(dir + f), Observable.returnValue(f)];
        }).
        reduce(function(a, b) {
            return a.concat(b);
        }, []);
    return Observable.zip.apply(null, fileObs.concat(assemble));

    function assemble() {
        var contents = {};
        var args = Array.prototype.slice.call(arguments, 0);
        for (var i = 0; i < args.length; i += 2) {
            var contents = args[i].toString();
            var name = args[i + 1];

            if (name === 'index.js') {
                contents.script = contents;
            } else if (name.indexOf('css')) {
                contents.css = contents;
            } else if (name.indexOf('html')) {
                contents.html = contents;
            } else if (name.indexOf('js')) {
                contents.app = contents;
            }
        }
    }
}


if (require.main === module) {
    var dir = 'src/js/toggle/';
    readDir('src/js/toggle').
        selectMany(build.bind(null, dir)).
        subscribe(function() {
            console.log('Finishing file: ' + arguments);
        }, function(err) {
            console.log("OHH NO: " + err);
        });
}
