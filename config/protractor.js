'use strict';


exports.config = {
  // seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['../src/**/*.e2e.js'],
  directConnect: true,
  chromeDriver: '../node_modules/protractor/selenium/chromedriver',
  capabilities: {
    'browserName': 'chrome'
  },
  baseUrl: 'http://localhost:5555'
};
