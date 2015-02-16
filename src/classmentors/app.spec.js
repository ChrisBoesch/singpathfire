/* jshint camelcase: false*/
/* global describe, beforeEach, module, inject */

(function() {
  'use strict';

  describe('clm', function() {

    /**
     * Test core singpath fire controllers.
     *
     */
    describe('controllers', function() {
      var $controller, $rootScope, $q;

      beforeEach(module('clm'));

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

      describe('clmDataStore', function() {

        beforeEach(module('clm'));

      });

    });


  });

})();
