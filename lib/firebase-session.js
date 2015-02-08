'use strict';

var yaml = require('js-yaml');
var fs = require('fs');
var q = require('q');
var path = require('path');
var readFile = q.nfbind(fs.readFile);
var realPath = q.nfbind(fs.realpath);
var request = require('request');
var TokenGenerator = require('firebase-token-generator');
var urljoin = require('url-join');


function readSecret(root, pattern) {
  var secretPath = path.join(root, pattern);
  return realPath(secretPath).then(function(p){
    if (path === '/') {
      return;
    }
    return readFile(p, 'utf-8');
  });
}


function findSecret(pattern, root) {
  root = root || './';
  return readSecret(root, pattern).catch(function(){
    return findSecret(pattern, path.join(root, '../'));
  });
}

// extract server url and secret key from ../../config/secret-keys.yaml
function getSecret(serverName, secretPath) {
  return findSecret(secretPath).then(function(text) {
    if (text === undefined) {
      throw new Error('secrets not found');
    }

    var servers = yaml.safeLoad(text);
    return servers[serverName];
  });
}

// Template for a new user auth data.
function newUser(uid, name) {
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
function createSession(baseUrl, token) {
  var defer = q.defer();

  request.post({
    url: urljoin(baseUrl, 'sessions.json', '?auth=' + token),
    body: JSON.stringify({
      client: 'singpath-e2e'
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


/**
 * Return firebase config, initiate them if necessary.
 *
 * The config should have a url and a collection of token.
 *
 */
exports.create = function(serverName, firebaseKeyPath) {
  var config = {};

  firebaseKeyPath = firebaseKeyPath || 'config/secret-keys.yaml';

  return getSecret(serverName, firebaseKeyPath).then(function(server) {
    config.tokens = makeTokens(server);
    return createSession(server.url, config.tokens.admin);
  }).then(function(sessionUrl) {
    config.url = sessionUrl;
    return config;
  });
};

/**
 * Delete session.
 */
exports.remove = function(url, token) {
  var defer = q.defer();

  request.del({
    url: urljoin(url + '.json?auth=' + token),
  }, function(err, resp, body) {
    if (err) {
      defer.reject(err);
    } else if (resp.statusCode !== 200) {
      defer.reject(new Error(body));
    } else {
      defer.resolve(true);
    }
  });

  return defer.promise;
};
