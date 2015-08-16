/* eslint-env jasmine */
/* global module, inject */

(function() {
  'use strict';

  describe('sign in components', function() {
    var $controller, $rootScope, $q;

    beforeEach(module('spf.shared'));

    beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    }));

    describe('SpfSignFormCtrl', function() {
      var deps;

      beforeEach(function() {
        deps = {
          $scope: {
            currentUser: {}
          },
          spfSchools: jasmine.createSpy('spfSchools')
        };

        deps.spfSchools.and.returnValue($q.when({
          'NUS High School': {
            id: 'NUS High School',
            iconUrl: '/assets/crests/NUS_HS.jpeg',
            type: 'Junior College',
            name: 'NUS High School'
          }
        }));
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
        $rootScope.$apply();

        nus = ctrl.schools.find(function(school) {
          return school.name === 'NUS High School';
        });
        expect(nus.type).toBe('Junior College');
        expect(nus.iconUrl).toBe('/assets/crests/NUS_HS.jpeg');
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
              id: 'NUS High School'
            }
          }
        };

        var ctrl = $controller('SpfSignFormCtrl', deps);
        var nus;

        $rootScope.$apply();
        nus = ctrl.schools.find(function(school) {
          return school.id === 'NUS High School';
        });

        expect(deps.$scope.currentUser.school).toBe(nus);
      });

    });

  });

})();
