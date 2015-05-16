/* eslint-env jasmine */
/* global module, inject, angular */

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

      describe('clmService', function() {
        var spfFirebase, profile;

        beforeEach(module('clm'));

        beforeEach(function() {
          profile = {
            $id: 'bob',
            services: {
              codeCombat: {
                details: {
                  id: 'bob',
                  name: 'Bob Smith'
                }
              }
            }
          };

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
            'objFactory'
          ]);

          module(function($provide) {
            $provide.value('spfFirebase', spfFirebase);
          });
        });

        beforeEach(module('clm'));

        describe('details', function() {

          it('should return the user details if they set', inject(function(clmService) {
            var service = clmService('codeCombat');
            var details = service.details(profile);

            expect(details.id).toEqual('bob');
          }));

          it('should return undefined if the details are not sets', inject(function(clmService) {
            var service = clmService('codeCombat');
            var details = service.details({
              services: {
                codeSchool: {
                  details: {
                    id: 'bob',
                    name: 'Bob Smith'
                  }
                }
              }
            });

            expect(details).toBeUndefined();
          }));

        });

        describe('saveDetails', function() {

          it('should claim the user name for that service', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');

            delete profile.services;
            spfFirebase.set.and.returnValue($q.when());

            service.saveDetails(profile, {id: '12345', name: 'bob smith'});
            $rootScope.$apply();

            expect(spfFirebase.set.calls.count()).toBeGreaterThan(0);
            expect(spfFirebase.set.calls.argsFor(0)).toEqual([jasmine.any(Array), 'bob']);
            expect(
              spfFirebase.set.calls.argsFor(0)[0].join('/')
            ).toBe(
              'classMentors/servicesUserIds/codeCombat/12345'
            );
          }));

          it('should update the user profile', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');

            delete profile.services;
            spfFirebase.set.and.returnValue($q.when());

            service.saveDetails(profile, {id: '12345', name: 'bob smith'});
            $rootScope.$apply();

            expect(spfFirebase.set.calls.count()).toBeGreaterThan(1);
            expect(spfFirebase.set.calls.argsFor(1)).toEqual([
              jasmine.any(Array), {
                id: '12345',
                name: 'bob smith',
                registeredBefore: {'.sv': 'timestamp'}
              }
            ]);
            expect(
              spfFirebase.set.calls.argsFor(1)[0].join('/')
            ).toBe(
              'classMentors/userProfiles/bob/services/codeCombat/details'
            );
          }));

        });

        describe('userIdTaken', function() {

          it('should check if the claim for the user id exist', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');

            spfFirebase.loadedObj.and.returnValue($q.when({}));

            service.userIdTaken('12345');
            $rootScope.$apply();

            expect(spfFirebase.loadedObj.calls.count()).toBe(1);
            expect(spfFirebase.loadedObj.calls.argsFor(0)).toEqual([jasmine.any(Array)]);
            expect(
              spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
            ).toBe(
              'classMentors/servicesUserIds/codeCombat/12345'
            );
          }));

          it('should return true if the user id is claimed', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');
            var result;

            spfFirebase.loadedObj.and.returnValue($q.when({$value: 'alice'}));

            service.userIdTaken('12345').then(function(isTaken) {
              result = isTaken;
            });
            $rootScope.$apply();

            expect(result).toBe(true);
          }));

          it('should return false if the user id is not claimed', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');
            var result;

            spfFirebase.loadedObj.and.returnValue($q.when({$value: null}));

            service.userIdTaken('12345').then(function(isTaken) {
              result = isTaken;
            });
            $rootScope.$apply();

            expect(result).toBe(false);
          }));

        });

        describe('updateProfile', function() {

          it('should fetch badges', inject(function($q, clmService) {
            var service = clmService('codeCombat');

            service.fetchBadges = jasmine.createSpy('fetchBadges');
            service.fetchBadges.and.returnValue($q.when([]));

            service.updateProfile(profile);
            expect(service.fetchBadges).toHaveBeenCalledWith(profile);
          }));

          it('should patch user profile with missing badges', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');

            service.fetchBadges = jasmine.createSpy('fetchBadges');
            service.fetchBadges.and.returnValue($q.when([{
              id: 'badgeId',
              name: 'badge name',
              iconUrl: 'http://example.com/icon.png',
              url: 'http://example.com'
            }]));

            service.updateProfile(profile);
            $rootScope.$apply();

            expect(spfFirebase.patch.calls.count()).toBe(1);
            expect(spfFirebase.patch).toHaveBeenCalledWith(
              jasmine.any(Array), jasmine.any(Object)
            );
            expect(
              spfFirebase.patch.calls.argsFor(0)[0].join('/')
            ).toBe(
              'classMentors/userProfiles/bob/services/codeCombat/badges'
            );
            expect(
              Object.keys(spfFirebase.patch.calls.argsFor(0)[1])
            ).toEqual(['badgeId']);
          }));

          it('should patch user profile last service update', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');

            service.fetchBadges = jasmine.createSpy('fetchBadges');
            service.fetchBadges.and.returnValue($q.when([{
              id: 'badgeId',
              name: 'badge name',
              iconUrl: 'http://example.com/icon.png',
              url: 'http://example.com'
            }]));

            service.updateProfile(profile);
            $rootScope.$apply();

            expect(spfFirebase.set.calls.count()).toBe(1);
            expect(spfFirebase.set).toHaveBeenCalledWith(
              jasmine.any(Array), jasmine.any(Object)
            );
            expect(
              spfFirebase.set.calls.argsFor(0)[0].join('/')
            ).toBe(
              'classMentors/userProfiles/bob/services/codeCombat/lastUpdate'
            );
            expect(
              spfFirebase.set.calls.argsFor(0)[1]
            ).toEqual({'.sv': 'timestamp'});
          }));

          it('should not patch badges already earned', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');
            var badges = [{
              id: 'badgeId',
              name: 'badge name',
              iconUrl: 'http://example.com/icon.png',
              url: 'http://example.com'
            }, {
              id: 'someOtherBadgeId',
              name: 'some other badge name',
              iconUrl: 'http://example.com/icon.png',
              url: 'http://example.com'
            }];

            profile.services.codeCombat.badges = {
              badgeId: badges[0]
            };
            service.fetchBadges = jasmine.createSpy('fetchBadges');
            service.fetchBadges.and.returnValue($q.when(badges));

            service.updateProfile(profile);
            $rootScope.$apply();

            expect(spfFirebase.patch.calls.count()).toBe(1);
            expect(spfFirebase.patch).toHaveBeenCalledWith(
              jasmine.any(Array), jasmine.any(Object)
            );
            expect(
              spfFirebase.patch.calls.argsFor(0)[0].join('/')
            ).toBe(
              'classMentors/userProfiles/bob/services/codeCombat/badges'
            );
            expect(
              Object.keys(spfFirebase.patch.calls.argsFor(0)[1])
            ).toEqual([badges[1].id]);
          }));

          it('should not patch if there\'s no new badge', inject(function($rootScope, $q, clmService) {
            var service = clmService('codeCombat');
            var badges = [{
              id: 'badgeId',
              name: 'badge name',
              iconUrl: 'http://example.com/icon.png',
              url: 'http://example.com'
            }];

            profile.services.codeCombat.badges = {
              badgeId: badges[0]
            };
            service.fetchBadges = jasmine.createSpy('fetchBadges');
            service.fetchBadges.and.returnValue($q.when(badges));

            service.updateProfile(profile);
            $rootScope.$apply();

            expect(spfFirebase.patch.calls.count()).toBe(0);
            expect(spfFirebase.set.calls.count()).toBe(0);
          }));

        });

        describe('userIdExist', function() {

          it('should should resolve to false if the user profile can\'t be found', inject(
            function($q, $rootScope, clmService) {
              var service = clmService('codeCombat');
              var exists;

              service.fetchProfile = jasmine.createSpy('fetchProfile');
              service.fetchProfile.and.returnValue($q.reject());

              service.userIdExist('12345').then(function(result) {
                exists = result;
              });

              $rootScope.$apply();

              expect(service.fetchProfile).toHaveBeenCalledWith('12345');
              expect(exists).toBe(false);
            }
          ));

          it('should should resolve to true if the user profile can be found', inject(
            function($q, $rootScope, clmService) {
              var service = clmService('codeCombat');
              var exists;

              service.fetchProfile = jasmine.createSpy('fetchProfile');
              service.fetchProfile.and.returnValue($q.when());

              service.userIdExist('12345').then(function(result) {
                exists = result;
              });

              $rootScope.$apply();

              expect(service.fetchProfile).toHaveBeenCalledWith('12345');
              expect(exists).toBe(true);
            }
          ));

        });

      });

      describe('clmDataStore', function() {
        var spfAuth, spfAuthData, spfFirebase;

        beforeEach(module('clm'));

        beforeEach(function() {
          spfAuth = jasmine.createSpyObj('spfAuth', ['login', 'logout', 'onAuth']);
          spfAuthData = jasmine.createSpyObj('spfAuthData', ['user']);
          spfFirebase = jasmine.createSpyObj('spfFirebase', [
            'array',
            'cleanObj',
            'loadedArray',
            'loadedObj',
            'obj',
            'objFactory',
            'patch',
            'push',
            'ref',
            'remove',
            'set'
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
          });
        });

        describe('profile', function() {

          it('should extend firebaseObject', function() {
              var extendedObj = {};
              spfFirebase.objFactory.and.returnValue(extendedObj);
              inject(function(clmDataStore) {
                expect(clmDataStore._profileFactory).toBe(extendedObj);
              });
            }
          );

          it('should query the /classMentors/userProfiles', inject(function($rootScope, clmDataStore) {
            var profileObj = jasmine.createSpyObj('profileObj', ['$loaded']);

            clmDataStore._profileFactory = jasmine.createSpy('clmDataStore._profileFactory');
            clmDataStore._profileFactory.and.returnValue(profileObj);
            clmDataStore.profile('bob');
            $rootScope.$apply();

            expect(clmDataStore._profileFactory.calls.count()).toBe(1);
            expect(clmDataStore._profileFactory.calls.argsFor(0)).toEqual(jasmine.any(Array));

            var path = clmDataStore._profileFactory.calls.argsFor(0)[0].join('/');
            expect(path).toBe('classMentors/userProfiles/bob');
          }));

        });

        describe('currentUserProfile', function() {

          it('should resolve to an empty profile if the user is not logged in', inject(
            function($q, $rootScope, clmDataStore) {
              var result;

              spfAuth.user = undefined;
              clmDataStore.currentUserProfile().then(function(profile) {
                result = profile;
              });
              $rootScope.$apply();
              expect(result).toBeUndefined();
            }
          ));

          it('should query the current user data', inject(
            function($q, clmDataStore) {
              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              clmDataStore.currentUserProfile();
              expect(spfAuthData.user).toHaveBeenCalled();
            }
          ));

          it('should query the current user profile', inject(
            function($q, $rootScope, clmDataStore) {
              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              clmDataStore.profile = jasmine.createSpy('clmDataStore.profile');
              clmDataStore.profile.and.returnValue({});

              clmDataStore.currentUserProfile();
              $rootScope.$apply();
              expect(clmDataStore.profile).toHaveBeenCalledWith('bob');
            }
          ));

          it('should return the user profile if profile is empty', inject(
            function($q, $rootScope, clmDataStore) {
              var actual;
              var expected = {};

              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              clmDataStore.profile = jasmine.createSpy('clmDataStore.profile');
              clmDataStore.profile.and.returnValue(expected);

              clmDataStore.currentUserProfile().then(function(resp) {
                actual = resp;
              });
              $rootScope.$apply();
              expect(actual).toBe(expected);
            }
          ));

          it('should return the user profile if profile is set', inject(
            function($q, $rootScope, clmDataStore) {
              var actual;
              var expected = {user: {}};

              spfAuth.user = {uid: 'google:1'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              clmDataStore.profile = jasmine.createSpy('clmDataStore.profile');
              clmDataStore.profile.and.returnValue(expected);

              clmDataStore.currentUserProfile().then(function(resp) {
                actual = resp;
              });
              $rootScope.$apply();
              expect(actual).toBe(expected);
            }
          ));

          it('should update profile if outdated', inject(
            function($q, $rootScope, clmDataStore) {
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
              clmDataStore.profile = jasmine.createSpy('clmDataStore.profile');
              clmDataStore.profile.and.returnValue(profile);
              spfFirebase.patch.and.returnValue($q.when());

              clmDataStore.currentUserProfile().then(function(resp) {
                result = resp;
              });
              $rootScope.$apply();
              expect(result).toBe(profile);
              expect(spfFirebase.patch.calls.count()).toBe(1);
              expect(spfFirebase.patch.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.patch.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/userProfiles/bob/user'
              );
              expect(spfFirebase.patch.calls.argsFor(0)[1]).toEqual({
                displayName: 'bob',
                gravatar: 'http://example.com/',
                country: {name: 'Singapore', code: 'SG'},
                yearOfBirth: 1990,
                school: {name: 'Other', type: 'Other'}
              });
            }
          ));

        });

        describe('badges', function() {

          it('should load all badges', inject(function($rootScope, $q, clmDataStore) {
            var expected = {
              codeCombat: {},
              codeSchool: {}
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

            expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['classMentors/badges', 'codeCombat']);
            expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['classMentors/badges', 'codeSchool']);
          }));

        });

        describe('singPath', function() {

          describe('profile', function() {

            it('should fetch the user profile at singpath', inject(function($rootScope, $q, clmDataStore) {
              var expected = {};
              var actual;

              spfFirebase.loadedObj.and.returnValue($q.when(expected));

              clmDataStore.singPath.profile('bob').then(function(profile) {
                actual = profile;
              });

              $rootScope.$apply();
              expect(actual).toBe(expected);
              expect(spfFirebase.loadedObj).toHaveBeenCalledWith(
                ['singpath/userProfiles', 'bob']
              );
            }));

          });

          describe('paths', function() {

            it('should return a map of available path at singpath', inject(function($rootScope, $q, clmDataStore) {
              var expected = {
                someId: {
                  id: 'someId',
                  title: 'some title',
                  url: '/singpath/#/paths/someId/levels'
                }
              };
              var actual;

              spfFirebase.loadedObj.and.returnValue(
                $q.when({
                  someId: {
                    title: 'some title',
                    description: 'discard'
                  }
                })
              );

              clmDataStore.singPath.paths().then(function(paths) {
                actual = paths;
              });

              $rootScope.$apply();
              expect(actual).toEqual(expected);
            }));

            it('should get path at /singpath/paths/', inject(function($rootScope, $q, clmDataStore) {
              spfFirebase.loadedObj.and.returnValue(
                $q.when({})
              );

              clmDataStore.singPath.paths();

              $rootScope.$apply();
              expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['singpath/paths']);
            }));

            it('should skip firebaseObject special properties', inject(function($rootScope, $q, clmDataStore) {
              var expected = {
                someId: {
                  id: 'someId',
                  title: 'some title',
                  url: '/singpath/#/paths/someId/levels'
                }
              };
              var actual;

              spfFirebase.loadedObj.and.returnValue(
                $q.when({
                  $foo: {},
                  someId: {
                    title: 'some title',
                    description: 'discard'
                  }
                })
              );

              clmDataStore.singPath.paths().then(function(paths) {
                actual = paths;
              });

              $rootScope.$apply();
              expect(actual).toEqual(expected);
            }));

          });

          describe('levels', function() {

            it('should return a map of available path at singpath', inject(function($rootScope, $q, clmDataStore) {
              var expected = {
                someOtherId: {
                  id: 'someOtherId',
                  title: 'some title',
                  url: '/singpath/#/paths/someId/levels/someOtherId/problems'
                }
              };
              var actual;

              spfFirebase.loadedObj.and.returnValue(
                $q.when({
                  someOtherId: {
                    title: 'some title',
                    description: 'discard'
                  }
                })
              );

              clmDataStore.singPath.levels('someId').then(function(paths) {
                actual = paths;
              });

              $rootScope.$apply();
              expect(actual).toEqual(expected);
            }));

            it('should get path at /singpath/levels/<path-id>/', inject(function($rootScope, $q, clmDataStore) {
              spfFirebase.loadedObj.and.returnValue(
                $q.when({})
              );

              clmDataStore.singPath.levels('foo');

              $rootScope.$apply();
              expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['singpath/levels', 'foo']);
            }));

            it('should skip firebaseObject properties', inject(function($rootScope, $q, clmDataStore) {
              var expected = {
                someOtherId: {
                  id: 'someOtherId',
                  title: 'some title',
                  url: '/singpath/#/paths/someId/levels/someOtherId/problems'
                }
              };
              var actual;

              spfFirebase.loadedObj.and.returnValue(
                $q.when({
                  $foo: {},
                  someOtherId: {
                    title: 'some title',
                    description: 'discard'
                  }
                })
              );

              clmDataStore.singPath.levels('someId').then(function(paths) {
                actual = paths;
              });

              $rootScope.$apply();
              expect(actual).toEqual(expected);
            }));

          });

          describe('problems', function() {

            it('should return a map of available path at singpath', inject(function($rootScope, $q, clmDataStore) {
              var expected = {
                lastId: {
                  id: 'lastId',
                  title: 'some title',
                  url: '/singpath/#/paths/someId/levels/someOtherId/problems/lastId/play'
                }
              };
              var actual;

              spfFirebase.loadedObj.and.returnValue(
                $q.when({
                  lastId: {
                    title: 'some title',
                    description: 'discard'
                  }
                })
              );

              clmDataStore.singPath.problems('someId', 'someOtherId').then(function(paths) {
                actual = paths;
              });

              $rootScope.$apply();
              expect(actual).toEqual(expected);
            }));

            it('should get path at /singpath/problems/<path-id>/<level-id>/>', inject(
              function($rootScope, $q, clmDataStore) {
                spfFirebase.loadedObj.and.returnValue(
                  $q.when({})
                );

                clmDataStore.singPath.problems('foo', 'bar');

                $rootScope.$apply();
                expect(spfFirebase.loadedObj).toHaveBeenCalledWith(['singpath/problems', 'foo', 'bar']);
              }
            ));

            it('should skip firebaseObject properties', inject(function($rootScope, $q, clmDataStore) {
              var expected = {
                lastId: {
                  id: 'lastId',
                  title: 'some title',
                  url: '/singpath/#/paths/someId/levels/someOtherId/problems/lastId/play'
                }
              };
              var actual;

              spfFirebase.loadedObj.and.returnValue(
                $q.when({
                  $foo: {},
                  lastId: {
                    title: 'some title',
                    description: 'discard'
                  }
                })
              );

              clmDataStore.singPath.problems('someId', 'someOtherId').then(function(paths) {
                actual = paths;
              });

              $rootScope.$apply();
              expect(actual).toEqual(expected);
            }));

          });

        });

        describe('events', function() {

          describe('updateProgress', function() {
            var $rootScope, $q, clmDataStore;

            beforeEach(inject(function(_$rootScope_, _$q_, _clmDataStore_) {
              $rootScope = _$rootScope_;
              $q = _$q_;
              clmDataStore = _clmDataStore_;

              clmDataStore.profile = jasmine.createSpy('clmDataStore.profile').and.returnValue($q.when({}));
              clmDataStore.singPath.profile = jasmine.createSpy(
                'clmDataStore.singPath.profile'
              ).and.returnValue($q.when({}));
              clmDataStore.services.codeCombat.fetchBadges = jasmine.createSpy(
                'clmDataStore.services.codeCombat.fetchBadges'
              ).and.returnValue($q.when([]));
              clmDataStore.services.codeSchool.fetchBadges = jasmine.createSpy(
                'clmDataStore.services.codeSchool.fetchBadges'
              ).and.returnValue($q.when([]));
            }));

            it('should reject if the public id is missing', function() {
              var err;
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'codeSchool'
                  }
                }
              };

              clmDataStore.events.updateProgress(event).catch(function(_err) {
                err = _err;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should fetch the user profiles', function() {
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'codeSchool'
                  }
                }
              };

              clmDataStore.events.updateProgress(event, 'bob');

              $rootScope.$apply();
              expect(clmDataStore.profile).toHaveBeenCalledWith('bob');
              expect(clmDataStore.singPath.profile).toHaveBeenCalledWith('bob');
            });

            it('should fetch the user badges', function() {
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'codeSchool'
                  }
                }
              };
              var profile = {
                $id: 'bob'
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, 'bob');

              $rootScope.$apply();
              expect(clmDataStore.services.codeCombat.fetchBadges).toHaveBeenCalledWith(profile);
              expect(clmDataStore.services.codeCombat.fetchBadges).toHaveBeenCalledWith(profile);
            });

            it('should set progress and ranking', function() {
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'codeSchool'
                  }
                }
              };
              var profile = {
                $id: 'bob'
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(2);

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventParticipants/someEventId/bob/tasks'
              );
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({});

              expect(spfFirebase.set.calls.argsFor(1).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(1)[0].join('/')
              ).toBe(
                'classMentors/eventParticipants/someEventId/bob/ranking'
              );
              expect(
                spfFirebase.set.calls.argsFor(1)[1]
              ).toEqual(
                {codeSchool: 0, codeCombat: 0, singPath: 0, total: 0}
              );
            });

            it('should update progress when user join required service', function() {
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'codeSchool'
                  },
                  someOtherId: {
                    serviceId: 'codeSchool',
                    badge: {
                      id: 'someBadgeId'
                    }
                  }
                }
              };
              var profile = {
                $id: 'bob',
                services: {
                  codeSchool: {
                    details: {
                      id: 'bob'
                    }
                  }
                }
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(2);

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({
                someTaskId: {
                  completed: true
                }
              });
            });

            it('should update progress when user earns a required badge', function() {
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'codeSchool'
                  },
                  someOtherId: {
                    serviceId: 'codeSchool',
                    badge: {
                      id: 'someBadgeId'
                    }
                  }
                }
              };
              var profile = {
                $id: 'bob',
                services: {
                  codeSchool: {
                    details: {
                      id: 'bob'
                    }
                  }
                }
              };
              var csBadges = [{
                id: 'someBadgeId'
              }];

              clmDataStore.profile.and.returnValue($q.when(profile));
              clmDataStore.services.codeSchool.fetchBadges.and.returnValue($q.when(csBadges));

              clmDataStore.events.updateProgress(event, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(2);

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({
                someTaskId: {
                  completed: true
                },
                someOtherId: {
                  completed: true
                }
              });

              expect(spfFirebase.set.calls.argsFor(1).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(1)[1]
              ).toEqual(
                {codeSchool: 1, codeCombat: 0, singPath: 0, total: 1}
              );
            });

            it('should update progress when user solves a required problem', function() {
              var event = {
                $id: 'someEventId',
                tasks: {
                  someTaskId: {
                    serviceId: 'singPath',
                    singPathProblem: {
                      path: {
                        id: 'pathId'
                      },
                      level: {
                        id: 'levelId'
                      },
                      problem: {
                        id: 'problemId'
                      }
                    }
                  }
                }
              };
              var profile = {
                user: {
                  displayName: 'bob'
                },
                solutions: {
                  pathId: {
                    levelId: {
                      problemId: {
                        solved: true
                      }
                    }
                  }
                }
              };

              clmDataStore.singPath.profile.and.returnValue(profile);
              clmDataStore.events.updateProgress(event, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(2);

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({
                someTaskId: {
                  completed: true
                }
              });

              expect(spfFirebase.set.calls.argsFor(1).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(1)[1]
              ).toEqual(
                {codeSchool: 0, codeCombat: 0, singPath: 1, total: 1}
              );
            });

          });

        });

        describe('services', function() {

          it('should have codeSchool and codeCombat services', inject(function(clmDataStore) {
            expect(clmDataStore.services.codeSchool).toBeTruthy();
            expect(clmDataStore.services.codeCombat).toBeTruthy();
          }));

          describe('codeSchool', function() {
            var csProfile;

            beforeEach(function() {
              csProfile = {
                user: {
                  'username': 'dinoboff',
                  'member_since': '2015-01-01T12:00:00Z',
                  'total_score': 5000,
                  'avatar': 'http://gravatar.com/avatar/12345.jpg?s=80&r=pg'
                },
                badges: [
                  {
                    'name': 'Level 1 Complete',
                    'badge': (
                      'https://d1ffx7ull4987f.cloudfront.net/images/achievements' +
                      '/large_badge/444/level-1-complete-a14a15c153bbe32611fca5be835923bf.png'
                    ),
                    'course_url': 'http://www.codeschool.com/courses/front-end-foundations'
                  },
                  {
                    'name': 'Level 1 on iOS: Operation Models',
                    'badge': (
                      'https://d1ffx7ull4987f.cloudfront.net/images/achievements' +
                      '/large_badge/240/level-1-on-ios-operation-models-8c44953b6d47160162b8fb5a541aeb79.png'
                    ),
                    'course_url': 'https://www.codeschool.com/courses/ios-operation-models'
                  }
                ]
              };
            });

            describe('fetchProfile', function() {

              it('should fetch code school profile', inject(function($httpBackend, clmDataStore) {
                var actual;

                $httpBackend.expectGET('/proxy/www.codeschool.com/users/bob.json').respond(csProfile);

                clmDataStore.services.codeSchool.fetchProfile('bob').then(function(result) {
                  actual = result;
                });

                $httpBackend.flush();
                expect(actual).toEqual(csProfile);
              }));

            });

            describe('fetchBadges', function() {

              it('should return a promise resolving to an empty array if there are not details', inject(
                function($rootScope, clmDataStore) {
                  var result;

                  clmDataStore.services.codeSchool.fetchBadges({}).then(function(resp) {
                    result = resp;
                  });

                  $rootScope.$apply();
                  expect(result).toEqual([]);
                }
              ));

              it('should return a promise resolving to an empty array if fetching profile fails', inject(
                function($rootScope, $q, clmDataStore) {
                  var badges;

                  clmDataStore.services.codeSchool.fetchProfile = jasmine.createSpy('fetchProfile');
                  clmDataStore.services.codeSchool.fetchProfile.and.returnValue($q.reject({}));

                  clmDataStore.services.codeSchool.fetchBadges({
                    services: {
                      codeSchool: {
                        details: {
                          id: 12345
                        }
                      }
                    }
                  }).then(function(results) {
                    badges = results;
                  });

                  $rootScope.$apply();

                  expect(badges).toEqual([]);
                }
              ));

              it('should normalise fetched badges', inject(function($q, $rootScope, clmDataStore) {
                var badges;

                clmDataStore.services.codeSchool.fetchProfile = jasmine.createSpy('fetchProfile');
                clmDataStore.services.codeSchool.fetchProfile.and.returnValue($q.when(csProfile));

                clmDataStore.services.codeSchool.fetchBadges({
                  services: {
                    codeSchool: {
                      details: {
                        id: 12345
                      }
                    }
                  }
                }).then(function(results) {
                  badges = results;
                });

                $rootScope.$apply();

                expect(badges).toEqual([{
                  id: 'front-end-foundations-level-1-complete',
                  name: 'Level 1 Complete',
                  iconUrl: (
                    'https://d1ffx7ull4987f.cloudfront.net/images/achievements' +
                    '/large_badge/444/level-1-complete-a14a15c153bbe32611fca5be835923bf.png'
                  ),
                  url: 'http://www.codeschool.com/courses/front-end-foundations'
                }, {
                  id: 'ios-operation-models-level-1-on-ios-operation-models',
                  name: 'Level 1 on iOS: Operation Models',
                  iconUrl: (
                    'https://d1ffx7ull4987f.cloudfront.net/images/achievements' +
                    '/large_badge/240/level-1-on-ios-operation-models-8c44953b6d47160162b8fb5a541aeb79.png'
                  ),
                  url: 'https://www.codeschool.com/courses/ios-operation-models'
                }]);
              }));

            });

          });

          describe('codeCombat', function() {
            var ccProfile;

            beforeEach(function() {
              ccProfile = [
                {
                  _id: '54db5c9bd899d65505e7cb99',
                  state: {
                    complete: true
                  },
                  levelID: 'dungeons-of-kithgard',
                  levelName: 'Dungeons of Kithgard'
                },
                {
                  _id: '54db5d4c6c3ee35205ac3326',
                  state: {
                    complete: true
                  },
                  levelID: 'gems-in-the-deep',
                  levelName: 'Gems in the Deep'
                }
              ];
            });

            describe('fetchBadges', function() {

              it('should return a promise resolving to an empty array if there are not details', inject(
                function($rootScope, clmDataStore) {
                  var result;

                  clmDataStore.services.codeCombat.fetchBadges({}).then(function(resp) {
                    result = resp;
                  });

                  $rootScope.$apply();
                  expect(result).toEqual([]);
                }
              ));

              it('should return a promise resolving to an empty array if fetching profile fails', inject(
                function($rootScope, $q, clmDataStore) {
                  var badges;

                  clmDataStore.services.codeCombat.fetchProfile = jasmine.createSpy('fetchProfile');
                  clmDataStore.services.codeCombat.fetchProfile.and.returnValue($q.reject({}));
                  clmDataStore.services.codeCombat.availableBadges = jasmine.createSpy('availableBadges');
                  clmDataStore.services.codeCombat.availableBadges.and.returnValue({});

                  clmDataStore.services.codeCombat.fetchBadges({
                    services: {
                      codeCombat: {
                        details: {
                          id: 12345
                        }
                      }
                    }
                  }).then(function(results) {
                    badges = results;
                  });

                  $rootScope.$apply();

                  expect(badges).toEqual([]);
                }
              ));

              it('should normalise levels to badges', inject(function($rootScope, $q, clmDataStore) {
                var badges;
                var availableBadges = {
                  'dungeons-of-kithgard': {
                    id: 'dungeons-of-kithgard'
                  },
                  'gems-in-the-deep': {
                    id: 'gems-in-the-deep'
                  }
                };

                clmDataStore.services.codeCombat.fetchProfile = jasmine.createSpy('fetchProfile');
                clmDataStore.services.codeCombat.fetchProfile.and.returnValue($q.when(ccProfile));

                clmDataStore.services.codeCombat.availableBadges = jasmine.createSpy('availableBadges');
                clmDataStore.services.codeCombat.availableBadges.and.returnValue(availableBadges);

                clmDataStore.services.codeCombat.fetchBadges({
                  services: {
                    codeCombat: {
                      details: {
                        id: 12345
                      }
                    }
                  }
                }).then(function(results) {
                  badges = results;
                });

                $rootScope.$apply();
                expect(badges).toEqual([
                  availableBadges['dungeons-of-kithgard'],
                  availableBadges['gems-in-the-deep']
                ]);

              }));

            });

            describe('fetchProfile', function() {

              it('should fetch code combat profile', inject(function($httpBackend, clmDataStore) {
                var actual;

                $httpBackend.expectGET(
                  '/proxy/codecombat.com/db/user/12345/level.sessions?project=state.complete,levelID,levelName'
                ).respond(ccProfile);

                clmDataStore.services.codeCombat.fetchProfile('12345').then(function(result) {
                  actual = result;
                });

                $httpBackend.flush();
                expect(actual).toEqual(ccProfile);
              }));

            });

            describe('auth', function() {

              it('should get codeCombat details of the current user', inject(function($httpBackend, clmDataStore) {
                var details;

                $httpBackend.expectJSONP(
                  '//codecombat.com/auth/whoami?callback=JSON_CALLBACK'
                ).respond({
                  _id: '12345',
                  anonymous: false,
                  earned: {
                    gems: 1000,
                    items: [
                      '5437002a7beba4a82024a97d'
                    ],
                    levels: [
                      '54174347844506ae0195a0b8',
                      '54173c90844506ae0195a0b4'
                    ],
                    heroes: []
                  },
                  points: 1000,
                  name: 'bob',
                  slug: 'bob',
                  dateCreated: '2015-01-01T12:00:00.000Z'
                });

                clmDataStore.services.codeCombat.auth().then(function(results) {
                  details = results;
                });

                $httpBackend.flush();

                expect(details).toEqual({
                  id: '12345',
                  name: 'bob'
                });
              }));

            });

          });

        });
      });

    });

  });

})();
