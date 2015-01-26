exports.module = function(angular, firebaseUrl) {
  'use strict';

  angular.module('spfMocked', ['spf', 'ngMockE2E']).config([
    'spfFirebaseProvider',
    function(spfFirebaseProvider) {
      spfFirebaseProvider.setBaseUrl(firebaseUrl);
    }
  ]).run([
    '$httpBackend',
    function($httpBackend) {

      $httpBackend.whenGET(/.*/).passThrough();
      $httpBackend.whenPOST(/.*/).passThrough();
      $httpBackend.whenPUT(/.*/).passThrough();
      $httpBackend.whenDELETE(/.*/).passThrough();
      $httpBackend.whenJSONP(/.*/).passThrough();
    }
  ]);

};
