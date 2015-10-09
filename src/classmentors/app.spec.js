/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('clm', function() {

    /**
     * Test core singpath fire services
     */
    describe('services', function() {

      describe('pythonTutorLinkParser', function() {
        var parser;
        var link = (
          'http://www.pythontutor.com/visualize.html#' +
          'code=print(\'foo\'%29' +
          '&mode=display' +
          '&py=3' +
          '&curInstr=0'
        );

        beforeEach(module('clm'));

        beforeEach(inject(function(pythonTutorLinkParser) {
          parser = pythonTutorLinkParser;
        }));

        it('should throw an error if the link has no hash', function() {
          expect(function() {
            parser('http://www.pythontutor.com/visualize.html');
          }).toThrow();
        });

        it('should throw an error if the link has an empty hash', function() {
          expect(function() {
            parser('http://www.pythontutor.com/visualize.html#');
          }).toThrow();
        });

        describe('code', function() {

          it('should return the code from a pythonTutor link', function() {
            var p = parser(link);

            expect(p.code()).toBe('print(\'foo\')');
          });

          it('should edit the code from the parsed link', function() {
            var p = parser(link);

            p.code('print(\'bar\')');
            expect(p.code()).toBe('print(\'bar\')');
          });

        });

        describe('language', function() {

          it('should return the language from a pythonTutor link', function() {
            var p = parser(link);

            expect(p.language()).toBe('3');
          });

          it('should edit the language from the parsed link', function() {
            var p = parser(link);

            p.language('2');
            expect(p.language()).toBe('2');
          });

        });

        describe('href', function() {

          it('can return a link to pythonTutor.com', function() {
            var p = parser(link);

            expect(p.href(true)).toBe(
              'http://www.pythontutor.com/visualize.html#' +
              'code=print(\'foo\')' +
              '&curInstr=0' +
              '&mode=display' +
              '&py=3'
            );
          });

        });

      });

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
            'objFactory',
            'arrayFactory'
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

            service.saveDetails(profile.$id, {id: '12345', name: 'bob smith'});
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

            service.saveDetails(profile.$id, {id: '12345', name: 'bob smith'});
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

        describe('removeDetails', function() {

          it('should remove the the service data from the user profile', inject(function($q, clmService) {
            var service = clmService('codeCombat');

            spfFirebase.remove.and.returnValue($q.when());

            service.removeDetails('bob', '12345');
            expect(spfFirebase.remove.calls.count()).toEqual(1);
            expect(spfFirebase.remove.calls.argsFor(0)).toEqual([jasmine.any(Array)]);
            expect(
              spfFirebase.remove.calls.argsFor(0)[0].join('/')
            ).toBe(
              'classMentors/userProfiles/bob/services/codeCombat'
            );
          }));

          it('should remove the claim on the user service id', inject(function($q, $rootScope, clmService) {
            var service = clmService('codeCombat');

            spfFirebase.remove.and.returnValue($q.when());
            service.removeDetails('bob', '12345');
            $rootScope.$apply();

            expect(spfFirebase.remove.calls.count()).toEqual(2);
            expect(spfFirebase.remove.calls.argsFor(1)).toEqual([jasmine.any(Array)]);
            expect(
              spfFirebase.remove.calls.argsFor(1)[0].join('/')
            ).toBe(
              'classMentors/servicesUserIds/codeCombat/12345'
            );
          }));

          it('should reject if the public id is missing', inject(function($q, $rootScope, clmService) {
            var service = clmService('codeCombat');
            var err;

            spfFirebase.remove.and.returnValue($q.when());
            service.removeDetails(null, '12345').catch(function(e) {
              err = e;
            });

            $rootScope.$apply();
            expect(err).toBeDefined();
          }));

          it('should reject if the user id is missing', inject(function($q, $rootScope, clmService) {
            var service = clmService('codeCombat');
            var err;

            spfFirebase.remove.and.returnValue($q.when());
            service.removeDetails('bob', null).catch(function(e) {
              err = e;
            });

            $rootScope.$apply();
            expect(err).toBeDefined();
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
        var $location, spfAuth, spfAuthData, spfFirebase, spfCrypto;

        beforeEach(module('clm'));

        beforeEach(function() {
          $location = jasmine.createSpyObj('$location', ['path', 'protocol', 'port', 'host']);
          spfAuth = jasmine.createSpyObj('spfAuth', ['login', 'logout', 'onAuth']);
          spfAuthData = jasmine.createSpyObj('spfAuthData', ['user']);
          spfFirebase = jasmine.createSpyObj('spfFirebase', [
            'array',
            'cleanObj',
            'loadedArray',
            'loadedObj',
            'obj',
            'objFactory',
            'arrayFactory',
            'patch',
            'push',
            'ref',
            'remove',
            'set',
            'setWithPriority',
            'valueAt'
          ]);
          spfCrypto = {
            password: jasmine.createSpyObj('spfCrypto.password', ['newHash', 'fromSalt']),
            randomString: jasmine.createSpy('randomString')
          };

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
            $provide.value('$location', $location);
            $provide.value('spfAuth', spfAuth);
            $provide.value('spfAuthData', spfAuthData);
            $provide.value('spfFirebase', spfFirebase);
            $provide.value('spfCrypto', spfCrypto);
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
                  url: 'http://www.singpath.com/#/paths/someId/levels'
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
                  url: 'http://www.singpath.com/#/paths/someId/levels'
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
                  url: 'http://www.singpath.com/#/paths/someId/levels/someOtherId/problems'
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
                  url: 'http://www.singpath.com/#/paths/someId/levels/someOtherId/problems'
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
                  url: 'http://www.singpath.com/#/paths/someId/levels/someOtherId/problems/lastId/play'
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
                  url: 'http://www.singpath.com/#/paths/someId/levels/someOtherId/problems/lastId/play'
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

          describe('allProblems', function() {
            var clmDataStore, $q, $rootScope;

            beforeEach(inject(function(_clmDataStore_, _$q_, _$rootScope_) {
              clmDataStore = _clmDataStore_;
              $q = _$q_;
              $rootScope = _$rootScope_;
            }));

            it('should query the value at singpath/problems', function() {
              clmDataStore.singPath.allProblems();
              expect(spfFirebase.valueAt.calls.count()).toBe(1);
              expect(spfFirebase.valueAt).toHaveBeenCalledWith(['singpath/problems']);
            });

            it('should return a promise resolving to the problem value', function() {
              var expected = {some: 'value'};
              var actual;

              spfFirebase.valueAt.and.returnValue($q.when(expected));

              clmDataStore.singPath.allProblems().then(function(resp) {
                actual = resp;
              });

              $rootScope.$apply();
              expect(actual).toBe(expected);
            });

            it('should return a promise rejecting if the query fails', function() {
              var expected = new Error('Failed');
              var err;

              spfFirebase.valueAt.and.returnValue($q.reject(expected));

              clmDataStore.singPath.allProblems().catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBe(expected);
            });
          });

        });

        describe('events', function() {

          describe('list', function() {
            var $q, clmDataStore;

            beforeEach(inject(function(_$q_, _clmDataStore_) {
              $q = _$q_;
              clmDataStore = _clmDataStore_;
            }));

            it('should load array of featured events', function() {
              var expected = $q.when([]);

              spfFirebase.loadedArray.and.returnValue(expected);
              expect(clmDataStore.events.list()).toBe(expected);

              expect(spfFirebase.loadedArray.calls.count()).toBe(1);
              expect(spfFirebase.loadedArray.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.loadedArray.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/events'
              );
              expect(spfFirebase.loadedArray.calls.argsFor(0)[1]).toEqual({
                orderByChild: 'featured',
                equalTo: true,
                limitToLast: jasmine.any(Number)
              });
            });

          });

          describe('create', function() {
            var $q, $rootScope, clmDataStore;

            beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should create an event', function() {
              var expected = {};

              spfFirebase.push.and.returnValue($q.when({}));

              clmDataStore.events.create(expected, 'password');

              expect(spfFirebase.push.calls.count()).toBe(1);
              expect(spfFirebase.push.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.push.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/events'
              );
              expect(spfFirebase.push.calls.argsFor(0)[1]).toBe(expected);
            });

            it('should create the event password', function() {
              var eventRef = jasmine.createSpyObj('eventRef', ['key']);

              spfFirebase.push.and.returnValue($q.when(eventRef));
              spfFirebase.set.and.returnValue($q.reject()); // stop the chain at this point
              spfCrypto.password.newHash.and.returnValue({
                value: 'someHash',
                options: {
                  salt: 'someSalt'
                }
              });
              eventRef.key.and.returnValue('someEventId');

              clmDataStore.events.create({}, 'password');
              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBeGreaterThan(0);
              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventPasswords/someEventId'
              );
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({
                hash: 'someHash',
                options: {
                  salt: 'someSalt'
                }
              });
            });

            it('should save the created event in the user profile', function() {
              var eventRef = jasmine.createSpyObj('eventRef', ['key']);
              var owner = {
                publicId: 'bob'
              };
              var eventId = 'someEventId';

              spfFirebase.push.and.returnValue($q.when(eventRef));
              eventRef.key.and.returnValue(eventId);
              spfFirebase.set.and.returnValue($q.when({}));
              spfCrypto.password.newHash.and.returnValue({
                value: 'someHash',
                options: {
                  salt: 'someSalt'
                }
              });
              clmDataStore.events.get = jasmine.createSpy('clmDataStore.events.get');
              clmDataStore.events.get.and.returnValue({
                $id: eventId,
                owner: owner,
                title: 'foo',
                createdAt: '1234'
              });

              clmDataStore.events.create({owner: owner}, 'password');
              $rootScope.$apply();

              expect(clmDataStore.events.get).toHaveBeenCalledWith(eventId);
              expect(spfFirebase.set.calls.count()).toBe(2);
              expect(spfFirebase.set.calls.argsFor(1).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(1)[0].join('/')
              ).toBe(
                'classMentors/userProfiles/bob/createdEvents/someEventId'
              );
              expect(spfFirebase.set.calls.argsFor(1)[1]).toEqual({
                title: 'foo',
                createdAt: '1234',
                featured: false
              });
            });

            it('should return the event id', function() {
              var eventRef = jasmine.createSpyObj('eventRef', ['key']);
              var expected = 'someEventId';
              var owner = {
                publicId: 'bob'
              };
              var actual;

              spfFirebase.push.and.returnValue($q.when(eventRef));
              spfFirebase.set.and.returnValue($q.when({}));
              spfCrypto.password.newHash.and.returnValue({
                value: 'someHash',
                options: {
                  salt: 'someSalt'
                }
              });
              eventRef.key.and.returnValue(expected);
              clmDataStore.events.get = jasmine.createSpy('clmDataStore.events.get');
              clmDataStore.events.get.and.returnValue({
                $id: expected,
                owner: owner,
                title: 'foo',
                createdAt: '1234'
              });

              clmDataStore.events.create({owner: owner}, 'password').then(function(resp) {
                actual = resp;
              });
              $rootScope.$apply();

              expect(actual).toBe(expected);
            });

          });

          describe('updateEvent', function() {
            var $q, $rootScope, clmDataStore;

            beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should reject if event is not an angularfire object ', function() {
              var err;

              clmDataStore.events.updateEvent({}).catch(function(e) {
                err = e;
              });

              $rootScope.$apply();

              expect(err).toEqual(jasmine.any(Error));
            });

            it('should save the event object', function() {
              var event = jasmine.createSpyObj('anEvent', ['$save']);

              event.$id = 'someEventId';
              event.$save.and.returnValue($q.reject()); // stop chain here

              clmDataStore.events.updateEvent(event);

              expect(event.$save).toHaveBeenCalled();
            });

            it('should not set a new passord new password is falsy', function() {
              var event = jasmine.createSpyObj('anEvent', ['$save']);

              event.$id = 'someEventId';
              event.$save.and.returnValue($q.when());
              spfCrypto.password.newHash.and.returnValue({});

              clmDataStore.events.updateEvent(event, '');

              $rootScope.$apply();

              expect(spfCrypto.password.newHash).not.toHaveBeenCalled();
              expect(spfFirebase.set).not.toHaveBeenCalled();
            });

            it('should set a new passord if it receives a password', function() {
              var event = jasmine.createSpyObj('anEvent', ['$save']);
              var hash = {value: '1234', options: {}};

              event.$id = 'someEventId';
              event.$save.and.returnValue($q.when());
              spfCrypto.password.newHash.and.returnValue(hash);

              clmDataStore.events.updateEvent(event, 'foo');

              $rootScope.$apply();

              expect(spfCrypto.password.newHash).toHaveBeenCalledWith('foo');
              expect(spfFirebase.set).toHaveBeenCalledWith(jasmine.any(Array), jasmine.any(Object));
              expect(spfFirebase.set.calls.argsFor(0)[0].join('/')).toBe('classMentors/eventPasswords/someEventId');
              expect(spfFirebase.set.calls.argsFor(0)[1]).toEqual({hash: '1234', options: hash.options});
            });

          });

          describe('get', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve an event', function() {
              clmDataStore.events.get('someEventId');

              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/events/someEventId'
              );
            });
          });

          describe('getTasks', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve an event tasks', function() {
              clmDataStore.events.getTasks('someEventId');

              expect(spfFirebase.loadedArray.calls.count()).toBe(1);
              expect(spfFirebase.loadedArray.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.loadedArray.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventTasks/someEventId'
              );
              expect(
                spfFirebase.loadedArray.calls.argsFor(0)[1]
              ).toEqual({
                orderByPriority: true
              });
            });
          });

          describe('addTask', function() {
            var $q, $rootScope, clmDataStore;

            beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should push the task', function() {
              var expected = {};

              spfFirebase.push.and.returnValue($q.when({}));
              clmDataStore.events.addTask('someEventId', expected);

              expect(spfFirebase.push.calls.count()).toBe(1);
              expect(spfFirebase.push.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.push.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventTasks/someEventId'
              );
              expect(spfFirebase.push.calls.argsFor(0)[1]).toBe(expected);
            });

            it('should set the new task priority', function() {
              var taskRef = jasmine.createSpyObj('taskRef', ['setPriority']);

              spfFirebase.push.and.returnValue($q.when(taskRef));
              clmDataStore.events.addTask('someEventId', {
                priority: 2
              });

              $rootScope.$apply();

              expect(taskRef.setPriority).toHaveBeenCalledWith(2);
            });

            it('should use a default task priority of 0', function() {
              var taskRef = jasmine.createSpyObj('taskRef', ['setPriority']);

              spfFirebase.push.and.returnValue($q.when(taskRef));
              clmDataStore.events.addTask('someEventId', {});

              $rootScope.$apply();

              expect(taskRef.setPriority).toHaveBeenCalledWith(0);
            });
          });

          describe('showTask', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should set the hidden prop. to false', function() {
              clmDataStore.events.showTask('eventId', 'taskId');

              expect(spfFirebase.set).toHaveBeenCalledWith(jasmine.any(Array), false);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventTasks/eventId/taskId/hidden'
              );
            });
          });

          describe('hideTask', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should set the hidden prop. to false', function() {
              clmDataStore.events.hideTask('eventId', 'taskId');

              expect(spfFirebase.set).toHaveBeenCalledWith(jasmine.any(Array), true);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventTasks/eventId/taskId/hidden'
              );
            });
          });

          describe('archiveTask', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should set the archived prop. to true', function() {
              clmDataStore.events.archiveTask('eventId', 'taskId');

              expect(spfFirebase.set).toHaveBeenCalledWith(jasmine.any(Array), true);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventTasks/eventId/taskId/archived'
              );
            });
          });

          describe('getRanking', function() {
            var $rootScope, $q, clmDataStore;

            beforeEach(inject(function(_$rootScope_, _$q_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve participants ranking for an event', function() {
              spfFirebase.loadedObj.and.returnValue($q.when());

              clmDataStore.events.getRanking('someEventId');

              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventRankings/someEventId'
              );
            });

            it('should calculate ranking in school', function() {
              var someSchool = {type: 'someType', name: 'someName'};
              var ranking = {
                bob: {total: '2', user: {displayName: 'bob', school: someSchool}},
                alice: {total: '4', user: {displayName: 'alice', school: someSchool}},
                $watch: jasmine.createSpy('rankingObj.$watch')
              };

              spfFirebase.loadedObj.and.returnValue($q.when(ranking));
              clmDataStore.events.getRanking('someEventId');
              $rootScope.$apply();

              expect(ranking.bob.$rankInSchool).toBe(2);
              expect(ranking.alice.$rankInSchool).toBe(1);
            });

            it('should recalculate ranking in school if ranking is updated', function() {
              var watcher;
              var someSchool = {type: 'someType', name: 'someName'};
              var ranking = {
                bob: {total: '2', user: {displayName: 'bob', school: someSchool}},
                alice: {total: '4', user: {displayName: 'alice', school: someSchool}},
                $watch: jasmine.createSpy('rankingObj.$watch')
              };

              spfFirebase.loadedObj.and.returnValue($q.when(ranking));
              clmDataStore.events.getRanking('someEventId');
              $rootScope.$apply();

              expect(ranking.$watch).toHaveBeenCalledWith(jasmine.any(Function));

              watcher = ranking.$watch.calls.argsFor(0)[0];
              ranking.bob.total = 5;
              watcher();

              expect(ranking.bob.$rankInSchool).toBe(1);
              expect(ranking.alice.$rankInSchool).toBe(2);
            });
          });

          describe('getProgress', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve each user progress for an event', function() {
              clmDataStore.events.getProgress('someEventId');

              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventProgress/someEventId'
              );
            });
          });

          describe('getUserProgress', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve a user progress', function() {
              clmDataStore.events.getUserProgress('someEventId', 'bob');

              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventProgress/someEventId/bob'
              );
            });
          });

          describe('getSolutions', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve all solutions for an event', function() {
              clmDataStore.events.getSolutions('someEventId');

              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventSolutions/someEventId'
              );
            });
          });

          describe('getUserSolutions', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should retrieve a user solutions', function() {
              clmDataStore.events.getUserSolutions('someEventId', 'bob');

              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventSolutions/someEventId/bob'
              );
            });
          });

          describe('join', function() {
            var $q, $rootScope, clmDataStore;

            beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should reject if the event it undefined', function() {
              var err;

              clmDataStore.events.join(undefined, 'password').catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should reject if the event has no ID', function() {
              var err;

              clmDataStore.events.join({}, 'password').catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should get the current user data', function() {
              spfAuthData.user.and.returnValue($q.when({}));

              clmDataStore.events.join({$id: 'someEventId'}, 'password');

              expect(spfAuthData.user).toHaveBeenCalledWith();
            });

            it('should reject if the user is not registered', function() {
              var err;

              spfAuthData.user.and.returnValue($q.when({}));

              clmDataStore.events.join({$id: 'someEventId'}).catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should load the password options of the event', function() {
              spfAuth.user = {uid: 'google:1234'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              // reject to stop the chain fast
              spfFirebase.loadedObj.and.returnValue($q.reject({}));

              clmDataStore.events.join({$id: 'someEventId'}, 'password');

              $rootScope.$apply();
              expect(spfFirebase.loadedObj.calls.count()).toBe(1);
              expect(spfFirebase.loadedObj.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.loadedObj.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventPasswords/someEventId/options'
              );
            });

            it('should create hash using the loaded password options of the event', function() {
              var hashOpts = {
                salt: 'someSalt'
              };

              spfAuth.user = {uid: 'google:1234'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfFirebase.loadedObj.and.returnValue($q.when(hashOpts));
              spfFirebase.set.and.returnValue($q.when({}));

              clmDataStore.events.join({$id: 'someEventId'}, 'password');

              $rootScope.$apply();
              expect(spfCrypto.password.fromSalt).toHaveBeenCalledWith('password', 'someSalt', hashOpts);
            });

            it('should set an event application', function() {
              var hashOpts = {
                salt: 'someSalt'
              };

              spfAuth.user = {uid: 'google:1234'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfFirebase.loadedObj.and.returnValue($q.when(hashOpts));
              spfFirebase.set.and.returnValue($q.when({}));
              spfCrypto.password.fromSalt.and.returnValue('someHash');

              clmDataStore.events.join({$id: 'someEventId'}, 'password');

              $rootScope.$apply();
              expect(spfFirebase.set.calls.count()).toBeGreaterThan(0);
              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventApplications/someEventId/google:1234'
              );
              expect(spfFirebase.set.calls.argsFor(0)[1]).toBe('someHash');
            });

            it('should set the event participant', function() {
              var hashOpts = {
                salt: 'someSalt'
              };

              spfAuth.user = {uid: 'google:1234'};
              spfAuthData.user.and.returnValue($q.when({
                publicId: 'bob',
                displayName: 'Mr Bob',
                gravatar: 'http://example.com'
              }));
              spfFirebase.loadedObj.and.returnValue($q.when(hashOpts));
              spfFirebase.set.and.returnValue($q.when({}));
              spfCrypto.password.fromSalt.and.returnValue('someHash');

              clmDataStore.events.join({$id: 'someEventId'}, 'password');

              $rootScope.$apply();
              expect(spfFirebase.set.calls.count()).toBeGreaterThan(1);
              expect(spfFirebase.set.calls.argsFor(1).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(1)[0].join('/')
              ).toBe(
                'classMentors/eventParticipants/someEventId/bob/user'
              );
              expect(spfFirebase.set.calls.argsFor(1)[1]).toEqual({
                displayName: 'Mr Bob',
                gravatar: 'http://example.com',
                school: null
              });
            });

            it('should update user profile', function() {
              var hashOpts = {
                salt: 'someSalt'
              };

              spfAuth.user = {uid: 'google:1234'};
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfFirebase.loadedObj.and.returnValue($q.when(hashOpts));
              spfFirebase.set.and.returnValue($q.when({}));
              spfCrypto.password.fromSalt.and.returnValue('someHash');

              clmDataStore.events.join({
                $id: 'someEventId',
                title: 'Some Title',
                owner: {
                  publicId: 'somePublicId'
                },
                createdAt: 1234
              }, 'password');

              $rootScope.$apply();
              expect(spfFirebase.set.calls.count()).toBe(3);
              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(2)[0].join('/')
              ).toBe(
                'classMentors/userProfiles/bob/joinedEvents/someEventId'
              );
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                title: 'Some Title',
                owner: {
                  publicId: 'somePublicId'
                },
                createdAt: 1234,
                featured: false
              });
            });
          });

          describe('leave', function() {
            var $q, $rootScope, clmDataStore;

            beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should query the current user authData', function() {
              spfAuthData.user.and.returnValue($q.when());

              clmDataStore.events.leave('eventId');

              expect(spfAuthData.user).toHaveBeenCalled();
            });

            it('should remove the event from the current user list of joined event', function() {
              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfFirebase.remove.and.returnValue($q.reject()); // stop chain after 1st call to remove

              clmDataStore.events.leave('eventId');

              $rootScope.$apply();
              expect(spfFirebase.remove.calls.count()).toBeGreaterThan(0);
              expect(spfFirebase.remove.calls.argsFor(0).length).toBe(1);
              expect(
                spfFirebase.remove.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/userProfiles/bob/joinedEvents/eventId'
              );
            });

            it('should remove the user form the particpant and ranking list', function() {
              var paths = [];

              spfAuthData.user.and.returnValue($q.when({publicId: 'bob'}));
              spfFirebase.remove.and.returnValue($q.when());

              clmDataStore.events.leave('eventId');

              $rootScope.$apply();
              expect(spfFirebase.remove.calls.count()).toBe(3);
              expect(spfFirebase.remove.calls.argsFor(1).length).toBe(1);
              expect(spfFirebase.remove.calls.argsFor(2).length).toBe(1);

              paths.push(spfFirebase.remove.calls.argsFor(1)[0].join('/'));
              paths.push(spfFirebase.remove.calls.argsFor(2)[0].join('/'));
              paths.sort();

              expect(paths[0]).toBe('classMentors/eventParticipants/eventId/bob');
              expect(paths[1]).toBe('classMentors/eventRankings/eventId/bob');
            });

          });

          describe('updateTask', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should update task with a priority', function() {
              var expected = {priority: 2};

              clmDataStore.events.updateTask('someEventId', 'someTaskId', expected);

              expect(spfFirebase.setWithPriority.calls.count()).toBe(1);
              expect(spfFirebase.setWithPriority.calls.argsFor(0).length).toBe(3);
              expect(
                spfFirebase.setWithPriority.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventTasks/someEventId/someTaskId'
              );
              expect(spfFirebase.setWithPriority.calls.argsFor(0)[1]).toBe(expected);
              expect(spfFirebase.setWithPriority.calls.argsFor(0)[2]).toBe(2);
            });

            it('should use 0 as default priority', function() {
              clmDataStore.events.updateTask('someEventId', 'someTaskId', {});

              expect(spfFirebase.setWithPriority.calls.count()).toBe(1);
              expect(spfFirebase.setWithPriority.calls.argsFor(0).length).toBe(3);
              expect(spfFirebase.setWithPriority.calls.argsFor(0)[2]).toBe(0);
            });
          });

          describe('_participantsFactory', function() {

            it('should create an angularfire array factory', function() {
              var expected = {};

              spfFirebase.arrayFactory.and.returnValue(expected);

              inject(function(clmDataStore) {
                expect(clmDataStore.events._participantsFactory).toBe(expected);
              });
            });

            it('should augment the participants array with a list of school participating', function() {
              spfFirebase.arrayFactory.and.callFake(function() {
                return arguments;
              });

              inject(function(clmDataStore) {
                expect(clmDataStore.events._participantsFactory.length).toBe(1);
                expect(clmDataStore.events._participantsFactory[0]).toEqual({
                  $schools: jasmine.any(Function)
                });
              });
            });

            describe('$schools', function() {

              beforeEach(function() {
                spfFirebase.arrayFactory.and.callFake(function() {
                  return arguments;
                });
              });

              afterEach(function() {
                // remove side effect
                spfFirebase.arrayFactory.and.stub();
              });

              it('should return an empty list if no participants', inject(
                function(clmDataStore) {
                  var mixin = clmDataStore.events._participantsFactory[0];
                  var participants = {$list: []};
                  var schools = mixin.$schools.call(participants);

                  expect(schools).toEqual({});
                }
              ));

              it('should return an empty list if participants have no schools', inject(
                function(clmDataStore) {
                  var mixin = clmDataStore.events._participantsFactory[0];
                  var participants = {$list: [
                    {user: {}}
                  ]};
                  var schools = mixin.$schools.call(participants);

                  expect(schools).toEqual({});
                }
              ));

              it('should return the participating schools', inject(
                function(clmDataStore) {
                  var mixin = clmDataStore.events._participantsFactory[0];
                  var participants = {$list: [
                    {user: {name: 'bob', school: {name: 'some school'}}},
                    {user: {name: 'alice', school: {name: 'some school'}}},
                    {user: {name: 'joe', school: {name: 'some other school'}}},
                    {user: {name: 'mary'}}
                  ]};
                  var schools = mixin.$schools.call(participants);

                  expect(schools).toEqual({
                    'some school': {name: 'some school'},
                    'some other school': {name: 'some other school'}
                  });
                }
              ));

            });

          });

          describe('participants', function() {
            var clmDataStore;

            beforeEach(inject(function(_clmDataStore_) {
              clmDataStore = _clmDataStore_;
            }));

            it('should return an array of participants', function() {
              var augmentedArrayObj = jasmine.createSpyObj('augmentedArrayObj', ['$loaded']);
              var expected = {};

              clmDataStore.events._participantsFactory = jasmine.createSpy('participantsFactory');
              clmDataStore.events._participantsFactory.and.returnValue(augmentedArrayObj);
              augmentedArrayObj.$loaded.and.returnValue(expected);

              expect(clmDataStore.events.participants('someEventId')).toBe(expected);

              expect(clmDataStore.events._participantsFactory).toHaveBeenCalledWith(jasmine.any(Array));
              expect(clmDataStore.events._participantsFactory.calls.count()).toBe(1);
              expect(
                clmDataStore.events._participantsFactory.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventParticipants/someEventId'
              );
              expect(augmentedArrayObj.$loaded).toHaveBeenCalled();
            });
          });

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
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {
                  $id: 'someTaskId',
                  serviceId: 'codeSchool'
                }
              ];

              clmDataStore.events.updateProgress(event, tasks, solutions).catch(function(_err) {
                err = _err;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should fetch the user profiles', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {
                  $id: 'someTaskId',
                  serviceId: 'codeSchool'
                }
              ];
              var profile = {
                $id: 'bob',
                user: {displayName: 'bob'}
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();
              expect(clmDataStore.profile).toHaveBeenCalledWith('bob');
              expect(clmDataStore.singPath.profile).toHaveBeenCalledWith('bob');
            });

            it('should fetch the user badges', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {
                  $id: 'someTaskId',
                  serviceId: 'codeSchool'
                }
              ];
              var profile = {
                $id: 'bob',
                user: {displayName: 'bob'}
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();
              expect(clmDataStore.services.codeCombat.fetchBadges).toHaveBeenCalledWith(profile);
              expect(clmDataStore.services.codeCombat.fetchBadges).toHaveBeenCalledWith(profile);
            });

            it('should set ranking and user details if no progress', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {
                  $id: 'someTaskId',
                  serviceId: 'codeSchool'
                }
              ];
              var profile = {
                $id: 'bob',
                user: {displayName: 'bob', gravatar: 'someUrl'}
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(2);

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toBe(
                'classMentors/eventRankings/someEventId/bob'
              );
              expect(
                spfFirebase.set.calls.argsFor(0)[1]
              ).toEqual(
                {codeSchool: 0, codeCombat: 0, singPath: 0, total: 0, user: {displayName: 'bob', gravatar: 'someUrl'}}
              );

              expect(spfFirebase.set.calls.argsFor(1).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(1)[0].join('/')
              ).toBe(
                'classMentors/eventParticipants/someEventId/bob/user'
              );
              expect(
                spfFirebase.set.calls.argsFor(1)[1]
              ).toEqual(
                {displayName: 'bob', gravatar: 'someUrl', school: null}
              );
            });

            it('should update progress when task require user to join a service', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {
                  $id: 'someTaskId',
                  serviceId: 'codeSchool'
                }, {
                  $id: 'someOtherId',
                  serviceId: 'codeSchool',
                  badge: {
                    id: 'someBadgeId'
                  }
                }, {
                  $id: 'lastTaskId',
                  serviceId: 'codeCombat'
                }
              ];
              var profile = {
                $id: 'bob',
                user: {displayName: 'bob'},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(2)[0].join('/')
              ).toBe(
                'classMentors/eventProgress/someEventId/bob'
              );
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {
                  completed: true
                }
              });
            });

            it('should update progress when user earns a required badge', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}},
                {$id: 'lastId', serviceId: 'codeSchool', badge: {id: 'someOtherBadgeId'}}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              var csBadges = [{
                id: 'someBadgeId'
              }];

              clmDataStore.profile.and.returnValue($q.when(profile));
              clmDataStore.services.codeSchool.fetchBadges.and.returnValue($q.when(csBadges));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {
                  completed: true
                },
                someOtherId: {
                  completed: true
                }
              });

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[1]
              ).toEqual(
                {codeSchool: 1, codeCombat: 0, singPath: 0, total: 1, user: {}}
              );
            });

            it('should not update task progress when the task is closed', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}, closedAt: 12345},
                {$id: 'lastId', serviceId: 'codeSchool', badge: {id: 'someOtherBadgeId'}}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              var csBadges = [{id: 'someBadgeId'}];

              clmDataStore.profile.and.returnValue($q.when(profile));
              clmDataStore.services.codeSchool.fetchBadges.and.returnValue($q.when(csBadges));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {completed: true}
              });
            });

            it('should not update task progress when the task is archived', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}, archived: true},
                {$id: 'lastId', serviceId: 'codeSchool', badge: {id: 'someOtherBadgeId'}}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              var csBadges = [{id: 'someBadgeId'}];

              clmDataStore.profile.and.returnValue($q.when(profile));
              clmDataStore.services.codeSchool.fetchBadges.and.returnValue($q.when(csBadges));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {completed: true}
              });
            });

            it('should keep task progress when the task is closed', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}, closedAt: 12345},
                {$id: 'lastId', serviceId: 'codeSchool', badge: {id: 'someOtherBadgeId'}}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              var csBadges = [{id: 'someBadgeId'}];

              clmDataStore.profile.and.returnValue($q.when(profile));
              clmDataStore.services.codeSchool.fetchBadges.and.returnValue($q.when(csBadges));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob', {
                someOtherId: {completed: true}
              });

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {completed: true},
                someOtherId: {completed: true}
              });
            });

            it('should keep task progress when the task is archived', function() {
              var event = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}, archived: true},
                {$id: 'lastId', serviceId: 'codeSchool', badge: {id: 'someOtherBadgeId'}}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              // if the archived tasks was checked again the task would not be complete
              // but we don't want it checked again.
              var csBadges = [];

              clmDataStore.profile.and.returnValue($q.when(profile));
              clmDataStore.services.codeSchool.fetchBadges.and.returnValue($q.when(csBadges));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob', {
                someOtherId: {completed: true}
              });

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {completed: true},
                someOtherId: {completed: true}
              });
            });

            it('should update progress when user solves a required problem', function() {
              var event = {$id: 'someEventId'};
              var tasks = [{
                $id: 'someTaskId',
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
              }, {
                $id: 'someOtherTaskId',
                serviceId: 'singPath',
                singPathProblem: {
                  path: {
                    id: 'pathId'
                  },
                  level: {
                    id: 'levelId'
                  },
                  problem: {
                    id: 'otherProblemId'
                  }
                }
              }];
              var solutions = {$id: 'someEventId'};
              var profile = {
                user: {
                  displayName: 'bob'
                },
                solutions: {
                  pathId: {
                    levelId: {
                      problemId: {
                        started: 1234,
                        solved: true,
                        duration: 10000
                      },
                      otherProblemId: {
                        started: 1234
                      }
                    }
                  }
                }
              };

              clmDataStore.singPath.profile.and.returnValue(profile);
              clmDataStore.profile.and.returnValue($q.when({$id: 'bob', user: {}}));
              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBe(3);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {
                  completed: true
                }
              });

              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[1]
              ).toEqual(
                {codeSchool: 0, codeCombat: 0, singPath: 1, total: 1, user: {}}
              );
            });

            it('should update progress when user submitted a valid link', function() {
              var event = {$id: 'someEventId'};
              var tasks = [
                {$id: 'someTaskId', linkPattern: 'github.com'},
                {$id: 'someOtherId', linkPattern: 'bitbucket.org'}
              ];
              var profile = {
                $id: 'bob',
                user: {displayName: 'bob'}
              };

              var solutions = {
                $id: 'someEventId',
                bob: {
                  someTaskId: 'http://github.com/bob',
                  someOtherId: 'http://github.com/bob'
                }
              };

              clmDataStore.profile.and.returnValue($q.when(profile));

              clmDataStore.events.updateProgress(event, tasks, solutions, 'bob');

              $rootScope.$apply();

              expect(spfFirebase.set.calls.count()).toBeGreaterThan(2);

              expect(spfFirebase.set.calls.argsFor(2).length).toBe(2);
              expect(spfFirebase.set.calls.argsFor(2)[1]).toEqual({
                someTaskId: {
                  completed: true
                }
              });
            });

          });

          describe('updateCurrentUserProfile', function() {
            var $rootScope, $q, clmDataStore;

            beforeEach(inject(function(_$rootScope_, _$q_, _clmDataStore_) {
              $rootScope = _$rootScope_;
              $q = _$q_;
              clmDataStore = _clmDataStore_;

              clmDataStore.profile = jasmine.createSpy('clmDataStore.profile').and.returnValue($q.when({}));
              clmDataStore.singPath.profile = jasmine.createSpy(
                'clmDataStore.singPath.profile'
              ).and.returnValue($q.when({}));
              clmDataStore.services.codeCombat.updateProfile = jasmine.createSpy(
                'clmDataStore.services.codeCombat.updateProfile'
              ).and.returnValue($q.when({}));
              clmDataStore.services.codeSchool.updateProfile = jasmine.createSpy(
                'clmDataStore.services.codeSchool.updateProfile'
              ).and.returnValue($q.when({}));
            }));

            it('should reject if event is missing', function() {
              var event = {};
              var tasks = [];
              var solutions = {$id: 'someEventId'};
              var profile = {$id: 'bob'};
              var userProgress = {};
              var err;

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              ).catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should reject if solutions are missing', function() {
              var event = {$id: 'someEventId'};
              var tasks = [];
              var solutions = {};
              var profile = {$id: 'bob'};
              var userProgress = {};
              var err;

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              ).catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should reject if profile is missing', function() {
              var event = {$id: 'someEventId'};
              var tasks = [];
              var solutions = {$id: 'someEventId'};
              var profile = {};
              var userProgress = {};
              var err;

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              ).catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should update code school profile data', function() {
              var event = {$id: 'someEventId'};
              var tasks = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var profile = {$id: 'bob'};
              var userProgress = {};

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              );

              expect(clmDataStore.services.codeCombat.updateProfile).toHaveBeenCalledWith(profile);
            });

            it('should update code combat profile data', function() {
              var event = {$id: 'someEventId'};
              var tasks = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var profile = {$id: 'bob'};
              var userProgress = {};

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              );

              expect(clmDataStore.services.codeCombat.updateProfile).toHaveBeenCalledWith(profile);
            });

            it('should update singpath profile', function() {
              var event = {$id: 'someEventId'};
              var tasks = {$id: 'someEventId'};
              var solutions = {$id: 'someEventId'};
              var profile = {$id: 'bob'};
              var userProgress = {};

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              );

              expect(clmDataStore.singPath.profile).toHaveBeenCalledWith('bob');
            });

            it('should update solution when profile got updated', function() {
              var event = {$id: 'someEventId'};
              var solutions = {
                $id: 'someEventId',
                $save: jasmine.createSpy('solutions.$save').and.returnValue($q.when())
              };
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}},
                {$id: 'lastTaskId', serviceId: 'codeCombat'}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              var userProgress = {};

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              );

              $rootScope.$apply();

              expect(solutions.someTaskId).toBe(true);
              expect(solutions.someOtherId).toBeUndefined();
              expect(solutions.lastTaskId).toBeUndefined();
              expect(solutions.$save).toHaveBeenCalled();
            });

            it('should not update solutions when profiles get no update', function() {
              var event = {$id: 'someEventId'};
              var solutions = {
                $id: 'someEventId',
                someTaskId: true,
                $save: jasmine.createSpy('solutions.$save').and.returnValue($q.when())
              };
              var tasks = [
                {$id: 'someTaskId', serviceId: 'codeSchool'},
                {$id: 'someOtherId', serviceId: 'codeSchool', badge: {id: 'someBadgeId'}},
                {$id: 'lastTaskId', serviceId: 'codeCombat'}
              ];
              var profile = {
                $id: 'bob',
                user: {},
                services: {
                  codeSchool: {details: {id: 'bob'}}
                }
              };
              var userProgress = {
                someTaskId: {completed: true}
              };

              clmDataStore.events.updateCurrentUserProfile(
                event, tasks, solutions, profile, userProgress
              );

              $rootScope.$apply();

              expect(solutions.someTaskId).toBe(true);
              expect(solutions.someOtherId).toBeUndefined();
              expect(solutions.lastTaskId).toBeUndefined();
              expect(solutions.$save).not.toHaveBeenCalled();
            });

          });

          describe('submitSolution', function() {
            var $q, $rootScope, clmDataStore;

            beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_) {
              $q = _$q_;
              $rootScope = _$rootScope_;
              clmDataStore = _clmDataStore_;
            }));

            it('should reject if eventId is not provided', function() {
              var err;

              clmDataStore.events.submitSolution(null, 'someTaskId', 'bob', 'link').catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should reject if taskId is not provided', function() {
              var err;

              clmDataStore.events.submitSolution('someEventId', null, 'bob', 'link').catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should reject if participant public id is not provided', function() {
              var err;

              clmDataStore.events.submitSolution('someEventId', 'someTaskId', '', 'link').catch(function(e) {
                err = e;
              });

              $rootScope.$apply();
              expect(err).toBeDefined();
            });

            it('should save the task as completed', function() {
              spfFirebase.set.and.returnValue($q.when({}));
              clmDataStore.events.submitSolution('someEventId', 'someTaskId', 'bob', 'link');

              $rootScope.$apply();
              expect(spfFirebase.set.calls.count()).toBe(1);
              expect(spfFirebase.set.calls.argsFor(0).length).toBe(2);
              expect(
                spfFirebase.set.calls.argsFor(0)[0].join('/')
              ).toEqual(
                'classMentors/eventSolutions/someEventId/bob/someTaskId'
              );
              expect(spfFirebase.set.calls.argsFor(0)[1]).toBe(
                'link'
              );
            });

          });

          describe('monitorEvent', function() {
            var clmDataStore, $timeout;

            beforeEach(inject(function(_$timeout_, _clmDataStore_) {
              $timeout = _$timeout_;
              clmDataStore = _clmDataStore_;
              clmDataStore.events.updateProgress = jasmine.createSpy('updateProgress');
            }));

            it('should initialy update event progress', function() {
              var event = {};
              var tasks = [];
              var solutions = jasmine.createSpyObj('solutions', ['$watch']);
              var progress = {
                bob: {},
                alice: {}
              };
              var participants = [
                {$id: 'bob'},
                {$id: 'alice'}
              ];

              participants.$watch = jasmine.createSpy('participants.$watch');

              clmDataStore.events.monitorEvent(event, tasks, participants, solutions, progress);

              $timeout.flush();
              expect(clmDataStore.events.updateProgress.calls.count()).toBe(2);
              expect(clmDataStore.events.updateProgress).toHaveBeenCalledWith(
                event, tasks, solutions, 'bob', progress.bob
              );
              expect(clmDataStore.events.updateProgress).toHaveBeenCalledWith(
                event, tasks, solutions, 'alice', progress.alice
              );
            });

            it('should watch for solutions update', function() {
              var event = {};
              var tasks = [];
              var solutions = jasmine.createSpyObj('solutions', ['$watch']);
              var progress = {bob: {}};
              var cb;
              var participants = [{$id: 'bob'}];

              participants.$watch = jasmine.createSpy('participants.$watch');

              clmDataStore.events.monitorEvent(event, tasks, participants, solutions, progress);

              expect(solutions.$watch).toHaveBeenCalledWith(jasmine.any(Function));
              cb = solutions.$watch.calls.argsFor(0)[0];
              cb();

              $timeout.flush();
              expect(clmDataStore.events.updateProgress.calls.count()).toBe(1);
              expect(clmDataStore.events.updateProgress).toHaveBeenCalledWith(
                event, tasks, solutions, 'bob', progress.bob
              );
            });

            it('should watch for participant update', function() {
              var event = {};
              var tasks = [];
              var solutions = jasmine.createSpyObj('solutions', ['$watch']);
              var progress = {bob: {}};
              var cb;
              var participants = [{$id: 'bob'}];

              participants.$watch = jasmine.createSpy('participants.$watch');

              clmDataStore.events.monitorEvent(event, tasks, participants, solutions, progress);
              clmDataStore.events.updateProgress.calls.reset();

              expect(participants.$watch).toHaveBeenCalledWith(jasmine.any(Function));
              cb = participants.$watch.calls.argsFor(0)[0];
              cb();

              $timeout.flush();
              expect(clmDataStore.events.updateProgress.calls.count()).toBe(1);
              expect(clmDataStore.events.updateProgress).toHaveBeenCalledWith(
                event, tasks, solutions, 'bob', progress.bob
              );
            });

            it('should return an unwatch function', function() {
              var event = {};
              var tasks = [];
              var solutions = jasmine.createSpyObj('solutions', ['$watch']);
              var progress = {bob: {}};
              var handlers;
              var unwatchSolution = jasmine.createSpy('unwatchSolution');
              var unwatchParticpants = jasmine.createSpy('unwatchParticpants');
              var participants = [{$id: 'bob'}];

              participants.$watch = jasmine.createSpy('participants.$watch');

              solutions.$watch.and.returnValue(unwatchSolution);
              participants.$watch.and.returnValue(unwatchParticpants);

              handlers = clmDataStore.events.monitorEvent(event, tasks, participants, solutions, progress);
              expect(handlers.unwatch).toEqual(jasmine.any(Function));

              handlers.unwatch();
              expect(unwatchSolution).toHaveBeenCalled();
              expect(unwatchParticpants).toHaveBeenCalled();
            });

            it('should return an update function', function() {
              var event = {};
              var tasks = [];
              var solutions = jasmine.createSpyObj('solutions', ['$watch']);
              var progress = {bob: {}};
              var handlers;
              var unwatchSolution = jasmine.createSpy('unwatchSolution');
              var unwatchParticpants = jasmine.createSpy('unwatchParticpants');
              var participants = [{$id: 'bob'}];

              participants.$watch = jasmine.createSpy('participants.$watch');

              solutions.$watch.and.returnValue(unwatchSolution);
              participants.$watch.and.returnValue(unwatchParticpants);

              handlers = clmDataStore.events.monitorEvent(event, tasks, participants, solutions, progress);
              expect(handlers.update).toEqual(jasmine.any(Function));

              $timeout.flush();
              clmDataStore.events.updateProgress.calls.reset();

              handlers.update();
              $timeout.flush();
              expect(clmDataStore.events.updateProgress.calls.count()).toBe(1);
              expect(clmDataStore.events.updateProgress).toHaveBeenCalledWith(
                event, tasks, solutions, 'bob', progress.bob
              );
            });

            it('should debounce update calls', function() {
              var event = {};
              var tasks = [];
              var solutions = jasmine.createSpyObj('solutions', ['$watch']);
              var progress = {bob: {}};
              var participantCb;
              var solutionCb;
              var handlers;
              var participants = [{$id: 'bob'}];

              participants.$watch = jasmine.createSpy('participants.$watch');

              handlers = clmDataStore.events.monitorEvent(event, tasks, participants, solutions, progress);
              clmDataStore.events.updateProgress.calls.reset();

              participantCb = participants.$watch.calls.argsFor(0)[0];
              solutionCb = solutions.$watch.calls.argsFor(0)[0];

              participantCb();
              solutionCb();
              handlers.update();

              $timeout.flush();
              expect(clmDataStore.events.updateProgress.calls.count()).toBe(1);
              expect(clmDataStore.events.updateProgress).toHaveBeenCalledWith(
                event, tasks, solutions, 'bob', progress.bob
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

            describe('requestUserName', function() {
              var $q, $rootScope, clmDataStore, routes, $window;

              beforeEach(inject(function(_$q_, _$rootScope_, _clmDataStore_, _routes_, _$window_) {
                $window = _$window_;
                $q = _$q_;
                $rootScope = _$rootScope_;
                clmDataStore = _clmDataStore_;
                routes = _routes_;
              }));

              it('should request the current user auth data', function() {
                spfAuthData.user.and.returnValue($q.when());

                clmDataStore.services.codeCombat.requestUserName();

                expect(spfAuthData.user).toHaveBeenCalledWith();
              });

              xit('should create/replace a verification key for the current user', function() {
                var authData = jasmine.createSpyObj('authData', ['$save']);

                spfAuthData.user.and.returnValue($q.when(authData));
                authData.$save.and.returnValue($q.reject()); // stop the chain
                authData.secretKey = 'foo';
                spfCrypto.randomString.and.returnValue('random');
                $window.Date = jasmine.createSpyObj('Date', ['now']);

                clmDataStore.services.codeCombat.requestUserName();

                $rootScope.$apply();
                expect(authData.$save).toHaveBeenCalledWith();
                expect(authData.secretKey).toBeDefined();
                expect(authData.secretKey).toBe('random');
              });

              xit('should create a verification key valid for 15 minutes', function() {
                var authData = jasmine.createSpyObj('authData', ['$save']);

                spfAuthData.user.and.returnValue($q.when(authData));
                authData.$save.and.returnValue($q.reject()); // stop the chain
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.Date.now.and.returnValue(1);

                clmDataStore.services.codeCombat.requestUserName();

                $rootScope.$apply();
                expect(authData.secretKeyValidUntil).toBeDefined(15 * 60 * 1000 + 1);
              });

              xit('should redirect to code combat identifyer endpoint', function() {
                var authData = jasmine.createSpyObj('authData', ['$save']);

                spfAuthData.user.and.returnValue($q.when(authData));
                authData.$save.and.returnValue($q.when());
                spfCrypto.randomString.and.returnValue('random');
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.Date.now.and.returnValue(1);
                $window.location = jasmine.createSpyObj('location', ['replace']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                $window.encodeURIComponent.and.returnValue('CALLBACK');

                clmDataStore.services.codeCombat.requestUserName();

                $rootScope.$apply();
                expect(
                  $window.location.replace
                ).toHaveBeenCalledWith(
                  'https://codecombat.com/identify?id=random&callback=CALLBACK&source=Class%20Mentors'
                );
              });

              xit('should set the codecombat callback url', function() {
                var authData = jasmine.createSpyObj('authData', ['$save']);

                spfAuthData.user.and.returnValue($q.when(authData));
                authData.$save.and.returnValue($q.when());
                spfCrypto.randomString.and.returnValue('random');
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.Date.now.and.returnValue(1);
                $window.location = jasmine.createSpyObj('location', ['replace']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                $window.encodeURIComponent.and.returnValue('CALLBACK');
                $location.protocol.and.returnValue('https');
                $location.host.and.returnValue('classmentors.com');
                $location.port.and.returnValue(80);
                $window.location.pathname = '/somepath/';
                routes.setProfileCodeCombatId = '/someviewpath';

                clmDataStore.services.codeCombat.requestUserName();

                $rootScope.$apply();
                expect(
                  $window.encodeURIComponent
                ).toHaveBeenCalledWith(
                  'https://classmentors.com/somepath/#/someviewpath'
                );
              });

              xit('should set the codecombat callback url with the port', function() {
                var authData = jasmine.createSpyObj('authData', ['$save']);

                spfAuthData.user.and.returnValue($q.when(authData));
                authData.$save.and.returnValue($q.when());
                spfCrypto.randomString.and.returnValue('random');
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.Date.now.and.returnValue(1);
                $window.location = jasmine.createSpyObj('location', ['replace']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                $window.encodeURIComponent.and.returnValue('CALLBACK');
                $location.protocol.and.returnValue('https');
                $location.host.and.returnValue('classmentors.com');
                $location.port.and.returnValue(8080);
                $window.location.pathname = '/somepath/';
                routes.setProfileCodeCombatId = '/someviewpath';

                clmDataStore.services.codeCombat.requestUserName();

                $rootScope.$apply();
                expect(
                  $window.encodeURIComponent
                ).toHaveBeenCalledWith(
                  'https://classmentors.com:8080/somepath/#/someviewpath'
                );
              });

            });

            describe('setUser', function() {
              var $q, $rootScope, $httpBackend, clmDataStore, $window;

              beforeEach(inject(function(_$q_, _$rootScope_, _$httpBackend_, _clmDataStore_, _$window_) {
                $q = _$q_;
                $window = _$window_;
                $rootScope = _$rootScope_;
                $httpBackend = _$httpBackend_;
                clmDataStore = _clmDataStore_;
              }));

              it('should request the current user auth data', function() {
                spfAuthData.user.and.returnValue($q.when());

                clmDataStore.services.codeCombat.setUser();

                expect(spfAuthData.user).toHaveBeenCalledWith();
              });

              xit('should reject when the verification keys do not match', function() {
                var authData = {
                  secretKey: '1234',
                  publicId: 'bob'
                };
                var err;

                spfAuthData.user.and.returnValue($q.when(authData));
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                authData.secretKey = 'wrongKey';
                authData.secretKeyValidUntil = 2;
                $window.Date.now.and.returnValue(1);
                $httpBackend.whenGET(/proxy/).respond('abc');

                clmDataStore.services.codeCombat.setUser('bob', '1234').catch(function(e) {
                  err = e;
                });

                $rootScope.$apply();

                expect(err).toBeDefined();
              });

              xit('should reject the verification keys is too old', function() {
                var authData = {
                  secretKey: '1234',
                  publicId: 'bob'
                };
                var err;

                spfAuthData.user.and.returnValue($q.when(authData));
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                authData.secretKey = '1234';
                authData.secretKeyValidUntil = 2;
                $window.Date.now.and.returnValue(3);
                $httpBackend.whenGET(/proxy/).respond('abc');

                clmDataStore.services.codeCombat.setUser('bob', '1234').catch(function(e) {
                  err = e;
                });

                $rootScope.$apply();

                expect(err).toBeDefined();
              });

              xit('should encode the code combat userName', function() {
                var authData = {
                  secretKey: '1234',
                  publicId: 'bob'
                };

                spfAuthData.user.and.returnValue($q.when(authData));
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                clmDataStore.services.codeCombat.saveDetails = jasmine.createSpy(
                  'clmDataStore.services.codeCombat.saveDetails'
                );

                authData.secretKey = '1234';
                authData.secretKeyValidUntil = 2;
                $window.Date.now.and.returnValue(1);
                $window.encodeURIComponent.and.returnValue('bob%20almity');
                $httpBackend.expectGET('/proxy/codecombat.com/db/user/bob%20almity/nameToID').respond('abc');

                clmDataStore.services.codeCombat.setUser('bob almighty', '1234');

                $rootScope.$apply();
                $httpBackend.flush();

                expect($window.encodeURIComponent).toHaveBeenCalledWith('bob almighty');
              });

              xit('should get the codeCombat user id mapping to user name', function() {
                var authData = {
                  secretKey: '1234',
                  publicId: 'bob'
                };

                spfAuthData.user.and.returnValue($q.when(authData));
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                clmDataStore.services.codeCombat.saveDetails = jasmine.createSpy(
                  'clmDataStore.services.codeCombat.saveDetails'
                );

                authData.secretKey = '1234';
                authData.secretKeyValidUntil = 2;
                $window.Date.now.and.returnValue(1);
                $window.encodeURIComponent.and.returnValue('bob');
                $httpBackend.expectGET('/proxy/codecombat.com/db/user/bob/nameToID').respond('abc');

                clmDataStore.services.codeCombat.setUser('bob', '1234');

                $rootScope.$apply();
                $httpBackend.flush();
              });

              xit('should reject if the code combat user id is not found', function() {
                var authData = {
                  secretKey: '1234',
                  publicId: 'bob'
                };
                var err;

                spfAuthData.user.and.returnValue($q.when(authData));
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                clmDataStore.services.codeCombat.saveDetails = jasmine.createSpy(
                  'clmDataStore.services.codeCombat.saveDetails'
                );

                authData.secretKey = '1234';
                authData.secretKeyValidUntil = 2;
                $window.Date.now.and.returnValue(1);
                $window.encodeURIComponent.and.returnValue('bob');
                $httpBackend.whenGET(/proxy/).respond('');

                clmDataStore.services.codeCombat.setUser('bob', '1234').catch(function(e) {
                  err = e;
                });

                $rootScope.$apply();
                $httpBackend.flush();

                expect(err).toBeDefined();
              });

              xit('should save the code combat user details', function() {
                var authData = {
                  secretKey: '1234',
                  publicId: 'bob'
                };

                spfAuthData.user.and.returnValue($q.when(authData));
                $window.Date = jasmine.createSpyObj('Date', ['now']);
                $window.encodeURIComponent = jasmine.createSpy('encodeURIComponent');
                clmDataStore.services.codeCombat.saveDetails = jasmine.createSpy(
                  'clmDataStore.services.codeCombat.saveDetails'
                );

                authData.secretKey = '1234';
                authData.secretKeyValidUntil = 2;
                $window.encodeURIComponent.and.returnValue('bob');
                $window.Date.now.and.returnValue(1);
                $httpBackend.whenGET(/proxy/).respond('abc');

                clmDataStore.services.codeCombat.setUser('ccBob', '1234');

                $rootScope.$apply();
                $httpBackend.flush();

                expect(
                  clmDataStore.services.codeCombat.saveDetails
                ).toHaveBeenCalledWith(
                  'bob', {id: 'abc', name: 'ccBob'}
                );
              });
            });

          });

        });
      });

    });

  });

})();
