#!/usr/bin/env node
'use strict';

/**
 * Serve static files and app mock.
 *
 * Serving the app mock dynamicly allow to set a session for the e2e
 * test or development session. That way, travis or different developpers
 * using the db won't interfer with each others.
 *
 * They would still need to rely on the same firebase security rules.
 *
 */
var q = require('q');
var express = require('express');
var app = express();
var sessions = require('./../lib/firebase-session');

var argv = require('minimist')(process.argv);
var fileServerOptions = {
  root: argv.root || './build-debug'
};
var port = parseInt(argv.port || 3000, 10);
var host = argv.host || 'localhost';
var firebaseKeyPath = argv.keypath || 'config/secret-keys.yaml';
var firebaseServer = argv.keypath || 'dev';

var _firebaseConfig = null;

var spfMocked = require('../config/spf-mocked.js');
var spfE2EMocked = require('../config/spf-e2e-mocked.js');
var oepMocked = require('../config/oep-mocked.js');
var oepE2EMocked = require('../config/oep-e2e-mocked.js');
var clmMocked = require('../config/clm-mocked.js');
var clmE2EMocked = require('../config/clm-e2e-mocked.js');
var moduleNames = {
  'oep': {
    'demo': oepMocked,
    'e2e': oepE2EMocked
  },
  'spf': {
    'demo': spfMocked,
    'e2e': spfE2EMocked
  },
  'clm': {
    'demo': clmMocked,
    'e2e': clmE2EMocked
  }
};

// return firebase config, initiate them if necessary.
//
// The config should have a url and a collection of token.
//
function getFirebaseConfig() {
  if (_firebaseConfig) {
    return q(_firebaseConfig);
  }

  return sessions.create(firebaseServer, firebaseKeyPath).then(function(config){
    console.log('[info] Created firebase session:' + config.url);
    _firebaseConfig = config;
    return config;
  }).catch(function(err){
    console.log('[error] Failed to create session', err);
    throw err;
  });
}


function removeSession() {
  if (!_firebaseConfig) {
    return q(false);
  }

  return sessions.remove(_firebaseConfig.url, _firebaseConfig.tokens.admin).then(function(){
    console.log('session removed.');
    _firebaseConfig = null;
  }).catch(function(err){
    console.log('Failed to remove', _firebaseConfig.url, err);
  });
}


process.on('exit', removeSession);
process.on('SIGINT', function() {
  return removeSession().then(function(){
    process.exit();
  });
});
process.on('uncaughtException', function(err) {
  console.log(err.stack);
  removeSession().then(function() {
    process.exit();
  });
});


app.use(function(req, res, next) {

  console.log(new Date(), req.method, req.path);
  next();
});


app.get('/config/:moduleName-mocked.js', function(req, res, next) {
  if (!moduleNames[req.params.moduleName]) {
    next();
    return;
  }

  getFirebaseConfig().then(function(config){
    res.set('Content-Type', 'application/javascript');
    res.send('(' + moduleNames[req.params.moduleName].demo.module.toString() + ')(angular, ' + JSON.stringify(config.url) + ');');
  }).catch(next);
});


app.get('/config/:moduleName-e2e-mocked.js', function(req, res, next) {
  if (!moduleNames[req.params.moduleName]) {
    next();
    return;
  }

  getFirebaseConfig().then(function(config){
    res.set('Content-Type', 'application/javascript');
    res.send('(' + moduleNames[req.params.moduleName].e2e.module.toString() + ')(angular, ' + JSON.stringify(config) + ');');
  }).catch(next);
});


app.get(/.*/, function(req, res, next) {
  var relativePath = req.path.slice(-1) === '/' ? req.path.slice(1) + 'index.html' : req.path;
  relativePath = relativePath === 'index.html' ? 'singpath.html' : relativePath;

  res.sendFile(relativePath, fileServerOptions, function(err) {
    if (err) {
      next();
    }
  });
});


app.listen(port, host, function serverHandler() {

  console.log('Binding server to', host + ':' + port);
});
