/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('clm profile components', function() {

    // describe('directives', function() {

    //   var compile, scope, elem;

    //   beforeEach(module('module.name'));

    //   beforeEach(inject(function(_$compile_, _$rootScope_) {
    //     compile = _$compile_;
    //     scope = _$rootScope_;
    //   }));

    //   describe('someDirective', function() {

    //     beforeEach(function() {
    //       elem = compile('')(scope);
    //     });

    //     it('Should fail', function() {
    //       expect(false).toBe(true);
    //     });

    //   });

    // });

    describe('controllers', function() {
      var $controller, $rootScope, $q, $location, spfAlert, clmDataStore;

      beforeEach(module('clm'));

      beforeEach(function() {
        $location = jasmine.createSpyObj('$location', ['path', 'search']);
        spfAlert = jasmine.createSpyObj('spfAlert', ['error', 'success']);
        clmDataStore = jasmine.createSpyObj('clmDataStore', ['currentUserProfile']);

        module(function($provide) {
          $provide.value('$location', $location);
          $provide.value('spfAlert', spfAlert);
          $provide.value('clmDataStore', clmDataStore);
        });
      });

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));

      describe('ClmProfileCtrl', function() {
        var deps;

        beforeEach(function() {
          var user = jasmine.createSpyObj('currentUser', ['$completed', '$save']);

          deps = {
            initialData: {
              auth: {},
              currentUser: user,
              currentUserProfile: user,
              profile: {}
            },
            $route: jasmine.createSpyObj('$route', ['reload']),
            spfFirebase: jasmine.createSpyObj('spfFirebase', ['cleanObj']),
            spfAuthData: jasmine.createSpyObj('spfAuthData', ['publicId']),
            spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
            clmDataStore: jasmine.createSpyObj('clmDataStore', ['initProfile', 'updateProfile', 'currentUserProfile']),
            spfAlert: jasmine.createSpyObj('spfAlert', ['success', 'error'])
          };
        });

        it('should set initialData properties', function() {
          var ctrl = $controller('ClmProfileCtrl', deps);

          expect(ctrl.auth).toBe(deps.initialData.auth);
          expect(ctrl.currentUser).toBe(deps.initialData.currentUser);
          expect(ctrl.currentUserProfile).toBe(deps.initialData.currentUserProfile);
          expect(ctrl.profile).toBe(deps.initialData.profile);
        });

        it('should not set any menu if the current user does not own the profile', function() {
          $controller('ClmProfileCtrl', deps);
          expect(
            deps.spfNavBarService.update
          ).toHaveBeenCalledWith(
            jasmine.any(String),
            undefined,
            jasmine.any(Array)
          );
          expect(deps.spfNavBarService.update.calls.argsFor(0)[2].length).toBe(0);
        });

        it('should not set an edit menu option if the current user does own the profile', function() {
          var opts;

          deps.initialData.currentUser.publicId = 'bob';
          deps.initialData.profile.$id = 'bob';

          $controller('ClmProfileCtrl', deps);
          expect(
            deps.spfNavBarService.update
          ).toHaveBeenCalledWith(
            jasmine.any(String),
            undefined,
            jasmine.any(Array)
          );

          opts = deps.spfNavBarService.update.calls.argsFor(0)[2];
          expect(opts.length).toBe(1);
          expect(opts[0].title).toBe('Edit');
          expect(opts[0].onClick).toBeDefined();
        });

        it('should set profileNeedsUpdate property to false if the profile is complete', function() {
          deps.initialData.currentUser.publicId = 'bob';
          deps.initialData.currentUser.$completed.and.returnValue(true);
          deps.initialData.profile.$id = 'bob';

          expect($controller('ClmProfileCtrl', deps).profileNeedsUpdate).toBeFalsy();
        });

        describe('edit', function() {

          beforeEach(function() {
            deps.initialData.currentUser.publicId = 'bob';
            deps.initialData.currentUser.$completed.and.returnValue(true);
            deps.initialData.profile.$id = 'bob';
          });

          it('should set profileNeedsUpdate property to true', function() {
            var ctrl = $controller('ClmProfileCtrl', deps);
            var edit = deps.spfNavBarService.update.calls.argsFor(0)[2][0].onClick;

            edit();
            expect(ctrl.profileNeedsUpdate).toBe(true);
          });
        });

        describe('setPublicId', function() {
          var ctrl;

          beforeEach(function() {
            ctrl = $controller('ClmProfileCtrl', deps);
          });

          it('should set the public id if the profile is not set', function() {
            deps.spfAuthData.publicId.and.returnValue($q.reject(new Error())); // stop the chain there

            ctrl.profile = undefined;
            ctrl.currentUser.publicId = 'bob';
            ctrl.setPublicId(ctrl.currentUser);
            expect(deps.spfAuthData.publicId).toHaveBeenCalledWith(ctrl.currentUser);
          });

          it('should clean the school and country properties', function() {
            var country = {};
            var school = {};
            var expected = {};

            deps.spfAuthData.publicId.and.returnValue($q.reject(new Error())); // stop the chain there
            deps.spfFirebase.cleanObj.and.returnValue(expected);
            ctrl.profile = undefined;
            ctrl.currentUser.publicId = 'bob';
            ctrl.currentUser.country = country;
            ctrl.currentUser.school = school;

            ctrl.setPublicId(ctrl.currentUser);

            expect(deps.spfFirebase.cleanObj).toHaveBeenCalledWith(country);
            expect(deps.spfFirebase.cleanObj).toHaveBeenCalledWith(school);
            expect(ctrl.currentUser.country).toBe(expected);
            expect(ctrl.currentUser.school).toBe(expected);
          });

          it('should init the profile if it did not exist', function() {
            deps.spfAuthData.publicId.and.returnValue($q.when());

            ctrl.profile = undefined;
            ctrl.currentUser.publicId = 'bob';
            ctrl.setPublicId(ctrl.currentUser);
            $rootScope.$apply();
            expect(deps.clmDataStore.initProfile).toHaveBeenCalled();
          });

          it('should reload page after profile creating', function() {
            deps.spfAuthData.publicId.and.returnValue($q.when());

            ctrl.profile = undefined;
            ctrl.currentUser.publicId = 'bob';
            ctrl.setPublicId(ctrl.currentUser);
            $rootScope.$apply();
            expect(deps.$route.reload).toHaveBeenCalled();
          });

          it('should update current user auth data if the profile exist', function() {
            ctrl.currentUser.publicId = 'bob';
            ctrl.currentUser.$save.and.returnValue($q.reject()); // stop chain here
            ctrl.setPublicId(ctrl.currentUser);
            expect(ctrl.currentUser.$save).toHaveBeenCalled();
          });

          it('should update the profile if it exist', function() {
            ctrl.currentUser.publicId = 'bob';
            ctrl.currentUser.$save.and.returnValue($q.when());
            ctrl.setPublicId(ctrl.currentUser);
            $rootScope.$apply();
            expect(deps.clmDataStore.updateProfile).toHaveBeenCalledWith(ctrl.currentUser);
          });

          it('should reload page after profile update', function() {
            ctrl.currentUser.publicId = 'bob';
            ctrl.currentUser.$save.and.returnValue($q.when());
            ctrl.setPublicId(ctrl.currentUser);
            $rootScope.$apply();
            expect(deps.$route.reload).toHaveBeenCalled();
          });
        });

        describe('lookUp.codeSchool.save', function() {
          var ctrl;

          beforeEach(function() {
            deps.clmDataStore.services = {
              codeSchool: jasmine.createSpyObj(
                'clmDataStore.services.codeSchool', ['saveDetails', 'updateProfile']
              )
            };

            ctrl = $controller('ClmProfileCtrl', deps);
          });

          it('should save the code school details', function() {
            deps.clmDataStore.services.codeSchool.saveDetails.and.returnValue($q.reject()); // stop chain here
            ctrl.profile.$id = 'bob';
            ctrl.lookUp.codeSchool.id = 'bob-smith';
            ctrl.lookUp.codeSchool.save();

            expect(
              deps.clmDataStore.services.codeSchool.saveDetails
            ).toHaveBeenCalledWith(
              'bob', jasmine.any(Object)
            );
            expect(
              deps.clmDataStore.services.codeSchool.saveDetails.calls.argsFor(0)[1]
            ).toEqual(
              {id: 'bob-smith', name: 'bob-smith'}
            );
          });

          it('should update profile it user badge after setting details', function() {
            var expected = {};

            deps.clmDataStore.services.codeSchool.saveDetails.and.returnValue($q.when());
            deps.clmDataStore.currentUserProfile.and.returnValue($q.when(expected));
            ctrl.profile.$id = 'bob';
            ctrl.lookUp.codeSchool.id = 'bob-smith';

            ctrl.lookUp.codeSchool.save();
            $rootScope.$apply();

            expect(deps.clmDataStore.currentUserProfile).toHaveBeenCalled();
            expect(deps.clmDataStore.services.codeSchool.updateProfile).toHaveBeenCalledWith(expected);
          });
        });

      });

      describe('setCodeCombatUserIdCtrlInitialData', function() {
        var initialData, search, routes;

        beforeEach(inject(function(setCodeCombatUserIdCtrlInitialData, _routes_) {
          initialData = setCodeCombatUserIdCtrlInitialData;
          routes = _routes_;

          search = {};
          $location.search.and.returnValue(search);

          clmDataStore.services = {
            codeCombat: jasmine.createSpyObj('services.codeCombat', ['setUser', 'updateProfile'])
          };
          clmDataStore.services.codeCombat.setUser.and.returnValue($q.when());
        }));

        it('should save the user details', function() {
          search.id = '1234';
          search.username = 'bob';
          initialData();
          expect(clmDataStore.services.codeCombat.setUser).toHaveBeenCalledWith('bob', '1234');
        });

        it('should update profile badges on success', function() {
          var expected = {};

          clmDataStore.currentUserProfile.and.returnValue(expected);
          clmDataStore.services.codeCombat.updateProfile.and.returnValue($q.reject()); // stop chain here

          search.id = '1234';
          search.username = 'bob';
          initialData();

          $rootScope.$apply();
          expect(clmDataStore.services.codeCombat.updateProfile).toHaveBeenCalledWith(expected);
        });

        it('should redirect to profile on success', function() {
          search.id = '1234';
          search.username = 'bob';
          initialData();

          $rootScope.$apply();
          expect($location.path).toHaveBeenCalledWith(routes.editProfile);
        });

        it('should not redirect on failure', function() {
          clmDataStore.services.codeCombat.setUser.and.returnValue($q.reject());
          initialData();

          $rootScope.$apply();
          expect($location.path).not.toHaveBeenCalled();
        });

      });

      describe('ClmSpfProfileCtrl', function() {
        var deps, initCtrl, problems, ctrl;

        beforeEach(function() {
          problems = {};
          deps = {
            $log: jasmine.createSpyObj('$log', ['error']),
            clmDataStore: {
              singPath: jasmine.createSpyObj('clmDataStore.singPath', ['allProblems', 'profile'])
            }
          };

          initCtrl = $controller('ClmSpfProfileCtrl', deps, true);
          initCtrl.instance.publicId = 'bob';

          deps.clmDataStore.singPath.allProblems.and.returnValue($q.when(problems));
        });

        // Testing setup, emulating bindToController
        it('should have public id set', function() {
          ctrl = initCtrl();
          expect(ctrl.publicId).toBe('bob');
        });

        it('should loading to true', function() {
          ctrl = initCtrl();
          expect(ctrl.loading).toBe(true);
        });

        it('should set loading to false once problems and profile is loaded', function() {
          deps.clmDataStore.singPath.profile.and.returnValue({});
          ctrl = initCtrl();

          $rootScope.$apply();
          expect(ctrl.loading).toBe(false);
        });

        it('should set singpathUrl', function() {
          ctrl = initCtrl();
          expect(ctrl.singpathUrl).toBe('http://www.singpath.com/');
        });

        it('should set stats.total', function() {
          deps.clmDataStore.singPath.profile.and.returnValue({});
          problems.pythonPathId = {
            someLevelId: {
              someProblemId: {language: 'python'},
              someOtherProblemId: {language: 'python'}
            },
            someOtherLevelId: {
              someProblemId: {language: 'python'}
            }
          };
          problems.angularjsPathId = {
            someLevelId: {
              someProblemId: {language: 'angularjs'}
            }
          };

          ctrl = initCtrl();

          $rootScope.$apply();
          expect(ctrl.stats).toBeDefined();
          expect(ctrl.stats.total).toEqual({
            python: 3,
            angularjs: 1
          });
        });

        it('should set stats.user', function() {
          deps.clmDataStore.singPath.profile.and.returnValue($q.when({
            solutions: {
              pythonPathId: {
                someLevelId: {
                  someProblemId: {solved: true},
                  someOtherProblemId: {started: 1234}
                },
                someOtherLevelId: {
                  someProblemId: {solved: true}
                }
              },

              angularjsPathId: {
                someLevelId: {
                  someProblemId: {solved: true}
                }
              }
            }
          }));
          problems.pythonPathId = {
            someLevelId: {
              someProblemId: {language: 'python'},
              someOtherProblemId: {language: 'python'}
            },
            someOtherLevelId: {
              someProblemId: {language: 'python'}
            }
          };
          problems.angularjsPathId = {
            someLevelId: {
              someProblemId: {language: 'angularjs'}
            }
          };

          ctrl = initCtrl();

          $rootScope.$apply();
          expect(ctrl.stats).toBeDefined();
          expect(ctrl.stats.user).toEqual({
            python: 2,
            angularjs: 1
          });
        });

      });

    });

  });

})();
