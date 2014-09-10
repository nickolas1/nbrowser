/*
http://corner.squareup.com/2013/08/small-grunts.html
example usage:
$> npm install -g grunt-cli
$> npm install
$> grunt watch
*/

module.exports = function (grunt) {
    grunt.initConfig({
        autoprefixer: {
            multiple_files: {
                expand: true,
                flatten: true,
                src: 'css/src/*.css',
                dest: 'css/' 
            }
        },
        watch: {
            styles: {
                files: ['css/src/*.css'],
                tasks: ['autoprefixer'],
            }
        }
    });
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
};