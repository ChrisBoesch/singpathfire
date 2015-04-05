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
      'src/vendor/crypto-js/core.js',
      'src/vendor/crypto-js/md5.js',
      'src/vendor/crypto-js/hmac.js',
      'src/vendor/crypto-js/pbkdf2.js',
      'src/vendor/crypto-js/sha1.js',
      'src/vendor/crypto-js/sha256.js',
      'src/vendor/firebase/firebase.js',
      'src/vendor/moment/moment.js',
      'src/vendor/ace-builds/ace.js',
      'src/vendor/angular/angular.js',
      'src/vendor/angular-animate/angular-animate.js',
      'src/vendor/angular-route/angular-route.js',
      'src/vendor/angular-messages/angular-messages.js',
      'src/vendor/angular-aria/angular-aria.js',
      'src/vendor/angular-material/angular-material.js',
      'src/vendor/angular-loading-bar/loading-bar.js',
      'src/vendor/angularfire/angularfire.js',
      'src/shared/components/polyfills/object.assign.js',
      'src/vendor/angular-mocks/angular-mocks.js',
      'src/classmentors/app.js',
      'src/shared/app.js',
      'src/singpath/app.js',
      'src/classmentors/**/*.js',
      'src/shared/**/*.js',
      'src/singpath/**/*.js'
    ],

    // list of files to exclude
    exclude: [
      'src/badgetracker/**/*.e2e.js',
      'src/classmentors/**/*.e2e.js',
      'src/shared/**/*.e2e.js',
      'src/singpath/**/*.e2e.js',
      'src/badgetracker/*.-mock.js',
      'src/classmentors/*.-mock.js',
      'src/shared/*.-mock.js',
      'src/singpath/*.-mock.js'
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
