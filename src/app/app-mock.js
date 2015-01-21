(function() {
  'use strict';

  angular.module('spfMocked', ['spf', 'ngMockE2E']).run([
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
