'use strict';

var yaml = require('js-yaml');
var fs = require('fs');
var q = require('q');
var readFile = q.nfbind(fs.readFile);
var request = require('request');
var TokenGenerator = require('firebase-token-generator');
var urljoin = require('url-join');



// extract server url and secret key from ../../config/secret-keys.yaml
function getSecret(firebaseKeyPath, serverName) {
  return readFile(firebaseKeyPath, 'utf-8').then(function(text) {
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
exports.create = function(firebaseKeyPath, serverName) {
  var config = {};

  return getSecret(firebaseKeyPath, serverName).then(function(server) {
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
