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
      var $controller, $rootScope, $q;

      beforeEach(module('clm'));

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));

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
