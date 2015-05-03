/* eslint-env jasmine */
/* global module, inject */

(function() {
  'use strict';

  describe('sign in components', function() {
    var $controller;

    beforeEach(module('spf.shared'));

    beforeEach(inject(function(_$controller_) {
      $controller = _$controller_;
    }));

    describe('SpfSignFormCtrl', function() {
      var deps;

      beforeEach(function() {
        deps = {
          $scope: {
            currentUser: {}
          }
        };
      });

      it('should have a country property', function() {
        var ctrl, sg;

        ctrl = $controller('SpfSignFormCtrl', deps);

        expect(ctrl.countries).toEqual(jasmine.any(Array));

        sg = ctrl.countries.find(function(country) {
          return country.code === 'SG';
        });
        expect(sg).toBeDefined();
        expect(sg.name).toBe('Singapore');
      });

      it('should have a schools property', function() {
        var ctrl, nus;

        ctrl = $controller('SpfSignFormCtrl', deps);

        expect(ctrl.schools).toEqual(jasmine.any(Array));

        nus = ctrl.schools.find(function(school) {
          return school.name === 'NUS High School';
        });
        expect(nus.type).toBe('Junior College');
        expect(nus.iconUrl).toBe('/assets/icons/schools/NUS_HS.jpeg');
      });

      it('should have an ageGroups property', function() {
        var ctrl;

        ctrl = $controller('SpfSignFormCtrl', deps);

        expect(ctrl.ageGroups).toEqual(jasmine.any(Array));
        expect(ctrl.ageGroups.slice(0, 1).pop()).toBe(1990);
        expect(ctrl.ageGroups.slice(-1).pop()).toBe(2011);
      });

      it('should make sure the user school is in the school list', function() {
        deps.$scope = {
          currentUser: {
            school: {
              name: 'NUS High School'
            }
          }
        };

        var ctrl = $controller('SpfSignFormCtrl', deps);
        var nus = ctrl.schools.find(function(school) {
          return school.name === 'NUS High School';
        });

        expect(deps.$scope.currentUser.school).toBe(nus);
      });

    });

  });

})();
