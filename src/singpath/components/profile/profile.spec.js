/* eslint-env jasmine */
/* global module, inject */

(function() {
  'use strict';

  describe('profile', function() {

    describe('services', function() {

      beforeEach(module('spf'));

      var spfAuth, spfAuthData, spfDataStore;

      beforeEach(function() {
        spfAuth = jasmine.createSpyObj('spfAuth', ['login', 'logout', 'onAuth']);
        spfAuthData = jasmine.createSpyObj('spfAuth', ['user']);
        spfDataStore = {
          currentUserProfile: jasmine.createSpy('spfDataStore.currentUserProfile'),
          initProfile: jasmine.createSpy('spfDataStore.initProfile')
        };

        module(function($provide) {
          $provide.value('spfAuth', spfAuth);
          $provide.value('spfAuthData', spfAuthData);
          $provide.value('spfDataStore', spfDataStore);
        });
      });

      describe('spfProfileCtrlInitialData', function() {

        it('should reject if the user is logged of', inject(
          function($q, $rootScope, spfProfileCtrlInitialData) {
            var err;

            spfProfileCtrlInitialData().catch(function(e) {
              err = e;
            });

            $rootScope.$apply();
            expect(err).toBeDefined();
          }
        ));

        it('should resolve if the user is logged in', inject(
          function($q, $rootScope, spfProfileCtrlInitialData) {
            var err;

            spfAuth.user = {uid: 'google:1'};
            spfDataStore.currentUserProfile.and.returnValue($q.when());

            spfProfileCtrlInitialData().catch(function(e) {
              err = e;
            });

            $rootScope.$apply();
            expect(err).toBeUndefined();
          }
        ));

        it('should resolve to an object holding auth', inject(
          function($q, $rootScope, spfProfileCtrlInitialData) {
            var result;

            spfAuth.user = {uid: 'google:1'};
            spfDataStore.currentUserProfile.and.returnValue($q.when());

            spfProfileCtrlInitialData().then(function(resp) {
              result = resp;
            });

            $rootScope.$apply();
            expect(result).toBeDefined();
            expect(result).toEqual(jasmine.any(Object));
            expect(result.auth).toBe(spfAuth);
          }
        ));

        it('should resolve to an object holding user profile', inject(
          function($q, $rootScope, spfProfileCtrlInitialData) {
            var result;
            var expected = {};

            spfAuth.user = {uid: 'google:1'};
            spfDataStore.currentUserProfile.and.returnValue($q.when(expected));

            spfProfileCtrlInitialData().then(function(resp) {
              result = resp;
            });

            $rootScope.$apply();
            expect(result).toBeDefined();
            expect(result).toEqual(jasmine.any(Object));
            expect(result.profile).toBe(expected);
          }
        ));

        it('should resolve to an object holding current user data', inject(
          function($q, $rootScope, spfProfileCtrlInitialData) {
            var result;
            var expected = {};

            spfAuth.user = {uid: 'google:1'};
            spfDataStore.currentUserProfile.and.returnValue($q.when());
            spfAuthData.user.and.returnValue($q.when(expected));

            spfProfileCtrlInitialData().then(function(resp) {
              result = resp;
            });

            $rootScope.$apply();
            expect(result).toBeDefined();
            expect(result).toEqual(jasmine.any(Object));
            expect(result.currentUser).toBe(expected);
          }
        ));

        it('should initiate the profile if the firebaseObj profile is null', inject(
          function($q, $rootScope, spfProfileCtrlInitialData) {
            spfAuth.user = {uid: 'google:1'};
            spfDataStore.currentUserProfile.and.returnValue($q.when({
              $value: null
            }));
            spfAuthData.user.and.returnValue($q.when());

            spfProfileCtrlInitialData();

            $rootScope.$apply();
            expect(spfDataStore.initProfile).toHaveBeenCalled();
          }
        ));

      });

    });

    describe('controllers', function() {
      var $controller, $rootScope, $q;

      beforeEach(module('spf'));

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));

      describe('SpfProfileCtrl', function() {
        var deps;

        beforeEach(function() {
          deps = {
            initialData: {
              auth: {},
              profile: {},
              currentUser: jasmine.createSpyObj('currentUser', ['$save'])
            },
            spfFirebase: jasmine.createSpyObj('spfFirebase', ['cleanObj']),
            spfAlert: jasmine.createSpyObj('spfAlert', ['success']),
            spfAuthData: jasmine.createSpyObj('spfAuthData', ['publicId']),
            spfDataStore: jasmine.createSpyObj('spfDataStore', ['initProfile', 'currentUserProfile'])
          };
        });

        it('should have an auth property', function() {
          var ctrl;

          ctrl = $controller('SpfProfileCtrl', deps);
          expect(ctrl.auth).toBe(deps.initialData.auth);
        });

        it('should have a currentUser property', function() {
          var ctrl;

          ctrl = $controller('SpfProfileCtrl', deps);
          expect(ctrl.currentUser).toBe(deps.initialData.currentUser);
        });

        it('should have a currentUser property', function() {
          var ctrl;

          ctrl = $controller('SpfProfileCtrl', deps);
          expect(ctrl.profile).toBe(deps.initialData.profile);
        });

        it('should have a savingProfile property', function() {
          var ctrl;

          ctrl = $controller('SpfProfileCtrl', deps);
          expect(ctrl.savingProfile).toBe(false);
        });

        describe('saveProfile', function() {

          it('should set savingProfile to true while saving profile', function() {
            var ctrl;

            ctrl = $controller('SpfProfileCtrl', deps);
            ctrl.currentUser.$save.and.returnValue($q.when());
            ctrl.saveProfile(ctrl.currentUser);
            expect(ctrl.savingProfile).toBe(true);

            $rootScope.$apply();
            expect(ctrl.savingProfile).toBe(false);
          });

          it('should create user profile', function() {
            var ctrl;
            var profile = {};

            ctrl = $controller('SpfProfileCtrl', deps);
            ctrl.profile = undefined;
            deps.spfAuthData.publicId.and.returnValue($q.when());
            deps.spfDataStore.initProfile.and.returnValue(profile);

            ctrl.saveProfile(ctrl.currentUser);
            $rootScope.$apply();

            expect(deps.spfAuthData.publicId).toHaveBeenCalledWith(ctrl.currentUser);
            expect(deps.spfDataStore.initProfile).toHaveBeenCalled();
            expect(ctrl.profile).toBe(profile);
          });

          it('should update user profile', function() {
            var ctrl;
            var profile = {};

            ctrl = $controller('SpfProfileCtrl', deps);
            ctrl.currentUser.$save.and.returnValue($q.when());
            deps.spfDataStore.currentUserProfile.and.returnValue(profile);

            ctrl.saveProfile(ctrl.currentUser);
            $rootScope.$apply();

            expect(ctrl.currentUser.$save).toHaveBeenCalled();
            expect(deps.spfDataStore.currentUserProfile).toHaveBeenCalled();
            expect(ctrl.profile).toBe(profile);
          });

        });

      });

    });

  });

})();
