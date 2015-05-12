/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('spf', function() {

    // /**
    //  * Test core singpath fire controllers.
    //  *
    //  */
    // describe('controllers', function() {
    //   var $controller, $rootScope, $q;

    //   beforeEach(module('spf'));

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

      describe('spfDataStore', function() {

        beforeEach(module('spf'));

        var $firebaseObject, $firebaseArray, spfAuth, spfAuthData, spfFirebase;

        beforeEach(function() {
          $firebaseObject = {};
          $firebaseObject.prototype = {
            $remove: jasmine.createSpy('$firebaseObject.prototype.$remove')
          };
          $firebaseArray = {};
          $firebaseArray.prototype = {
            $$added: jasmine.createSpy('$firebaseArray.prototype.$$added')
          };
          spfAuth = jasmine.createSpyObj('spfAuth', ['login', 'logout', 'onAuth']);
          spfAuthData = jasmine.createSpyObj('spfAuth', ['user']);
          spfFirebase = jasmine.createSpyObj('spfFirebase', [
            'ref',
            'obj',
            'loadedObj',
            'array',
            'loadedArray',
            'set',
            'push',
            'patch',
            'remove',
            'objFactory',
            'arrayFactory',
            'cleanObj'
          ]);

          spfFirebase.cleanObj.and.callFake(function(obj) {
            if (obj == null) {
              return null;
            }

            if (angular.isString(obj) || angular.isNumber(obj) || typeof obj === 'boolean') {
              return obj;
            }

            return Object.assign({}, obj);
          });

          module(function($provide) {
            $provide.value('spfAuth', spfAuth);
            $provide.value('spfAuthData', spfAuthData);
            $provide.value('spfFirebase', spfFirebase);
            $provide.value('$firebaseObject', $firebaseObject);
            $provide.value('$firebaseArray', $firebaseArray);
          });
        });

        describe('profile', function() {

          it('should extend firebaseObject', function() {
              var extendedObj = {};
              spfFirebase.objFactory.and.returnValue(extendedObj);
              inject(function(spfDataStore) {
                expect(spfDataStore._profileFactory).toBe(extendedObj);
              });
            }
          );

          it('should query the /singpath/userProfiles', inject(function($rootScope, spfDataStore) {
            var profileObj = jasmine.createSpyObj('profileObj', ['$loaded']);

            spfDataStore._profileFactory = jasmine.createSpy('spfDataStore._profileFactory');
            spfDataStore._profileFactory.and.returnValue(profileObj);
            spfDataStore.profile('bob');
            $rootScope.$apply();

            expect(spfDataStore._profileFactory.calls.count()).toBe(1);
            expect(spfDataStore._profileFactory.calls.argsFor(0)).toEqual(jasmine.any(Array));

            var path = spfDataStore._profileFactory.calls.argsFor(0)[0].join('/');
            expect(path).toBe('singpath/userProfiles/bob');
          }));

        });

        describe('currentUserProfile', function() {

          it('should resolve to an empty profile if the user is not logged in', inject(
            function($q, $rootScope, spfDataStore) {
              var result;

              spfAuth.user = undefined;
              spfDataStore.currentUserProfile().then(function(profile) {
                result = profile;
              });
              $rootScope.$apply();
              expect(result).toBeUndefined();
            }
          ));

          it('should query the current user data', inject(
            function($q, spfDataStore) {
              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfDataStore.currentUserProfile();
              expect(spfAuthData.user).toHaveBeenCalled();
            }
          ));

          it('should query the current user profile', inject(
            function($q, $rootScope, spfDataStore) {
              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfDataStore.profile = jasmine.createSpy('spfDataStore.profile');
              spfDataStore.profile.and.returnValue({});

              spfDataStore.currentUserProfile();
              $rootScope.$apply();
              expect(spfDataStore.profile).toHaveBeenCalledWith('bob');
            }
          ));

          it('should return the user profile if profile is empty', inject(
            function($q, $rootScope, spfDataStore) {
              var actual;
              var expected = {};

              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfDataStore.profile = jasmine.createSpy('spfDataStore.profile');
              spfDataStore.profile.and.returnValue(expected);

              spfDataStore.currentUserProfile().then(function(resp) {
                actual = resp;
              });
              $rootScope.$apply();
              expect(actual).toBe(expected);
            }
          ));

          it('should return the user profile if profile is set', inject(
            function($q, $rootScope, spfDataStore) {
              var actual;
              var expected = {user: {}};

              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfDataStore.profile = jasmine.createSpy('spfDataStore.profile');
              spfDataStore.profile.and.returnValue(expected);

              spfDataStore.currentUserProfile().then(function(resp) {
                actual = resp;
              });
              $rootScope.$apply();
              expect(actual).toBe(expected);
            }
          ));

          it('should update profile if outdated', inject(
            function($q, $rootScope, spfDataStore) {
              var userData = {
                publicId: 'bob',
                displayName: 'bob',
                gravatar: 'http://example.com/',
                country: {name: 'Singapore', code: 'SG'},
                yearOfBirth: 1990,
                school: {name: 'Other', type: 'Other'}
              };
              var profile = {
                user: {
                  displayName: 'bob',
                  gravatar: 'http://example.com/'
                }
              };
              var result;

              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when(userData));
              spfDataStore.profile = jasmine.createSpy('spfDataStore.profile');
              spfDataStore.profile.and.returnValue(profile);
              spfFirebase.set.and.returnValue($q.when());

              spfDataStore.currentUserProfile().then(function(resp) {
                result = resp;
              });
              $rootScope.$apply();
              expect(result).toBe(profile);
              expect(spfFirebase.set.calls.count()).toBe(1);
              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'singpath/userProfiles/bob/user'
              );
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({
                displayName: 'bob',
                gravatar: 'http://example.com/',
                country: {name: 'Singapore', code: 'SG'},
                yearOfBirth: 1990,
                school: {name: 'Other', type: 'Other'}
              });
            }
          ));

        });

      });

    });

  });

})();
