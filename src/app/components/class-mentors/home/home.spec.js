/* jshint camelcase: false*/
/* global describe, beforeEach, module, it, inject, expect, jasmine */

(function() {
  'use strict';

  describe('spf class mentors home components', function() {
    var $controller, $rootScope, $q;

    beforeEach(module('spf'));

    beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    }));


    describe('ClassMemtorsHomeCtrl', function() {
      var auth, ctrl;

      beforeEach(function() {
        auth = jasmine.createSpyObj('spfAuth', ['login', 'logout']);
        ctrl = $controller('ClassMemtorsHomeCtrl', {
          spfAuth: auth,
        });
      });

      it('Should fail', function() {
        expect(ctrl.auth).toBe(auth);
      });

    });

  });

})();
