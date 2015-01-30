/**
 * It should be served by ./bin/server who will provide `firebaseUrl`.
 *
 */
exports.module = function(angular, config) {
  'use strict';

  angular.module('spfMocked', ['spf', 'ngMockE2E']).

  constant('firebaseConfig', config).

  config([
    'spfFirebaseRefProvider',
    function(spfFirebaseRefProvider) {
      spfFirebaseRefProvider.setBaseUrl(config.url);
    }
  ]).

  config([
    '$provide',
    function($provide) {
      $provide.decorator('spfAuth', [
        '$q',
        '$delegate',
        '$firebaseAuth',
        'spfFirebase',
        function($q, $delegate, $firebaseAuth, spfFirebase) {
          var auth = $firebaseAuth(spfFirebase());

          $delegate.login = function() {
            return auth.$authWithCustomToken(config.tokens.bob).then(function(user) {
              $delegate.user = user.auth;
            });
          };

          return $delegate;
        }
      ]);
    }
  ]).

  run([
    '$httpBackend',
    function($httpBackend) {
      // Requests to mock


      // Anything else should pass.
      //
      $httpBackend.whenGET(/.*/).passThrough();
      $httpBackend.whenPOST(/.*/).passThrough();
      $httpBackend.whenPUT(/.*/).passThrough();
      $httpBackend.whenDELETE(/.*/).passThrough();
      $httpBackend.whenJSONP(/.*/).passThrough();
    }
  ])

  ;

};
