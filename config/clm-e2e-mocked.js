/**
 * It should be served by ./bin/server who will provide `firebaseUrl`.
 *
 */
exports.module = function(angular, config) {
  'use strict';

  angular.module('clmMocked', ['clm', 'ngMockE2E', 'spf.shared']).

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
        'spfFirebaseRef',
        function($q, $delegate, $firebaseAuth, spfFirebaseRef) {
          var auth = $firebaseAuth(spfFirebaseRef());

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
