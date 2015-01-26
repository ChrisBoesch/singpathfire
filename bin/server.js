#!/usr/bin/env node

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
var path = require('path');
var yaml = require('js-yaml');
var fs = require('fs');
var q = require('q');
var readFile = q.nfbind(fs.readFile);
var express = require('express');
var app = express();
var spfMocked = require('../config/spf-mocked.js');
var request = require('request');
var TokenGenerator = require('firebase-token-generator');
var urljoin = require('url-join');

var argv = require('minimist')(process.argv);
var fileServerOptions = {
  root: argv.root || './build-debug'
};
var port = parseInt(argv.port || 3000, 10);
var host = argv.host || 'localhost';
var firebaseKeyPath = argv.keypath || path.join(__dirname, '../../config/secret-keys.yaml');
var firebaseServer = argv.keypath || 'dev';
var userName = argv.username || 'anom';

var _firebaseConfig = null;
var _firebaseSecret = null;


// extract server url and secret key from ../../config/secret-keys.yaml
function getSecret() {
  'use strict';

  if (_firebaseSecret) {
    return q(_firebaseSecret);
  }

  return readFile(firebaseKeyPath, 'utf-8').then(function(text) {
    var servers = yaml.safeLoad(text);
    _firebaseSecret = servers[firebaseServer];
    return _firebaseSecret;
  });
}

// Template for a new user auth data.
function newUser(uid, name) {
  'use strict';

  return {
    uid: uid,
    google: {
      displayName: name,
      email: name + '@gmail.com'
    }
  };
}


// Generate token for admin, bob and alice.
//
// They will be passed to the
function makeTokens(server) {
  'use strict';

  var tokenGenerator = new TokenGenerator(server.key);

  return {
    admin: tokenGenerator.createToken(newUser('id1', 'admin'), {
      admin: true
    }),
    bob: tokenGenerator.createToken(newUser('id2', 'bob')),
    alice: tokenGenerator.createToken(newUser('id3', 'alice'))
  };
}


// Create a session on the database for the current client.
//
function createSession(baseUrl, token) {
  'use strict';
  var defer = q.defer();

  request.post({
    url: urljoin(baseUrl, 'sessions.json', '?auth=' + token),
    body: JSON.stringify({
      user: userName
    })
  }, function(err, resp, body) {
    if (err) {
      defer.reject(err);
    } else if (resp.statusCode !== 200) {
      defer.reject(new Error(body));
    } else {
      defer.resolve(urljoin(baseUrl, 'sessions', JSON.parse(body).name));
    }
  });

  return defer.promise;
}

// return firebase config, initiate them if necessary.
//
// The config should have a url and a collection of token.
//
function getFirebaseConfig() {
  'use strict';

  if (_firebaseConfig) {
    return q(_firebaseConfig);
  }

  var config = {};

  return getSecret().then(function(server) {
    config.tokens = makeTokens(server);
    return createSession(server.url, config.tokens.admin);
  }).then(function(sessionUrl) {
    config.url = sessionUrl;
    _firebaseConfig = config;
    console.log('The client should use ' + sessionUrl + ' as base url');
    return config;
  });
}


app.use(function(req, res, next) {
  'use strict';

  console.log(new Date(), req.method, req.path);
  next();
});


app.get('/config/spf-mocked.js', function(req, res, next) {
  'use strict';

  getFirebaseConfig().then(function(config){
    res.set('Content-Type', 'application/javascript');
    res.send('(' + spfMocked.module.toString() + ')(angular, ' + JSON.stringify(config.url) + ');');
  }).catch(next);
});


app.get(/.*/, function(req, res, next) {
  'use strict';

  var relativePath = req.path.slice(-1) === '/' ? req.path.slice(1) + 'index.html' : req.path;

  res.sendFile(relativePath, fileServerOptions, function(err) {
    if (err) {
      next();
    }
  });
});


app.listen(port, host, function serverHandler() {
  'use strict';

  console.log('Binding server to', host + ':' + port);
});
