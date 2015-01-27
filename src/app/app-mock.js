/**
 * By default, the app is using the staging DB and mock some http request.
 *
 */
(function() {
  'use strict';

  angular.module('spfMocked', ['spf', 'ngMockE2E']).config([
    'spfFirebaseProvider',
    function(spfFirebaseProvider){
      spfFirebaseProvider.setBaseUrl('https://singpath-play.firebaseIO.com');
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

})();
