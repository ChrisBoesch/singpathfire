// Karma configuration
// Generated on Tue Jan 20 2015 13:49:12 GMT+0000 (GMT)

module.exports = function(config) {
  'use strict';

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'src/vendor/alertifyjs/src/js/alertify.js',
      'src/vendor/crypto-js/src/core.js',
      'src/vendor/crypto-js/src/hmac.js',
      'src/vendor/crypto-js/src/pbkdf2.js',
      'src/vendor/crypto-js/src/sha1.js',
      'src/vendor/crypto-js/src/sha256.js',
      'src/vendor/firebase/firebase.js',
      'src/vendor/moment/moment.js',
      'src/vendor/angular/angular.js',
      'src/vendor/angular-animate/angular-animate.js',
      'src/vendor/angular-route/angular-route.js',
      'src/vendor/angular-messages/angular-messages.js',
      'src/vendor/angular-loading-bar/build/loading-bar.js',
      'src/vendor/angular-strap/dist/angular-strap.js',
      'src/vendor/angular-strap/dist/angular-strap.tpl.js',
      'src/vendor/angularfire/dist/angularfire.js',
      'src/vendor/angular-mocks/angular-mocks.js',
      'src/app/app.js',
      'src/app/app-fixtures.js',
      'src/app/components/**/*.js',
      'src/app/**/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
      'src/app/**/*.e2e.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
