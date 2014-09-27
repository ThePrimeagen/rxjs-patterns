var path = require('path');
module.exports = function(grunt) {

    grunt.loadTasks('tasks');
    grunt.initConfig({
        assemble: {
            options: {
                cwd: process.cwd(),
                src: 'src/js'
            },
            dev: { }
        },
        compile: {
            options: {
                cwd: process.cwd(),
                src: 'tmp',
                dest: 'static'
            },
            dev: { }
        }
    });

    grunt.registerTask('default', ['assemble:dev', 'compile:dev']);
};