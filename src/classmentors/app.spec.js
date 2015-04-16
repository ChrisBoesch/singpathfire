/* eslint camelcase: false*/
/* global describe, beforeEach, module, inject, it, jasmine, expect */

(function() {
  'use strict';

  describe('clm', function() {

    // /**
    //  * Test core singpath fire controllers.
    //  *
    //  */
    // describe('controllers', function() {
    //   var $controller, $rootScope, $q;

    //   beforeEach(module('clm'));

    //   beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
    //     $controller = _$controller_;
    //     $rootScope = _$rootScope_;
    //     $q = _$q_;
    //   }));

    // });

    /**
     * Test core singpath fire services
     */
    describe('services', function() {

      describe('clmDataStore', function() {
        var spfAuth, spfAuthData, spfFirebase;

        beforeEach(module('clm'));

        beforeEach(function() {
          spfAuth = jasmine.createSpyObj('spfAuth', ['login', 'logout', 'onAuth']);
          spfAuthData = jasmine.createSpyObj('spfAuthData', ['user']);
          spfFirebase = jasmine.createSpyObj('spfFirebase', [
            'ref',
            'obj',
            'loadedObj',
            'array',
            'loadedArray',
            'set',
            'push',
            'remove',
            'objFactory'
          ]);

          module(function($provide) {
            $provide.value('spfAuth', spfAuth);
            $provide.value('spfAuthData', spfAuthData);
            $provide.value('spfFirebase', spfFirebase);
          });
        });

        describe('badges', function() {

          it('should load all badges', inject(function($rootScope, $q, clmDataStore) {
            var expected = {
              codeCombat: {},
              codeSchool: {},
              treeHouse: {}
            };
            var actual;

            spfFirebase.loadedObj.and.callFake(function(path) {
              var serviceId = path.slice(-1).pop();
              return $q.when(expected[serviceId] || {});
            });

            clmDataStore.badges.all().then(function(badges) {
              actual = badges;
            });
            $rootScope.$apply();

            expect(actual.codeCombat).toBe(expected.codeCombat);
            expect(actual.codeSchool).toBe(expected.codeSchool);
            expect(actual.treeHouse).toBe(expected.treeHouse);

            expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['classMentors/badges', 'codeCombat']);
            expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['classMentors/badges', 'codeSchool']);
            expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['classMentors/badges', 'treeHouse']);
          }));

        });
      });

    });

  });

})();
