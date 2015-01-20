exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['../src/**/*.e2e.js'],
  capabilities: {
    'browserName': 'phantomjs',
    'phantomjs.binary.path': require('phantomjs').path,
    'phantomjs.cli.args': []
  },
  baseUrl: 'http://localhost:5555'
};
