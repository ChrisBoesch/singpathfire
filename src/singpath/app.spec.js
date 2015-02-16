/* jshint camelcase: false*/
/* global describe, beforeEach, module, inject */

(function() {
  'use strict';

  describe('spf', function() {

    /**
     * Test core singpath fire controllers.
     *
     */
    describe('controllers', function() {
      var $controller, $rootScope, $q;

      beforeEach(module('spf'));

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));


    });


    /**
     * Test core singpath fire services
     */
    describe('services', function() {


      describe('spfDataStore', function() {

        beforeEach(module('spf'));

      });

    });


  });

})();
