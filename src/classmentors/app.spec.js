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
                ['singPath/userProfiles', 'bob']
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
            var profileObj;

            beforeEach(function() {
              var profileFactory;

              profileFactory = jasmine.createSpy('profileFactory');
              profileObj = jasmine.createSpyObj('profileObj', ['$loaded']);
              profileFactory.and.returnValue(profileObj);
              spfFirebase.objFactory.and.returnValue(profileFactory);
            });

            it('should not update progress when user has not joined the required service',
              inject(function($rootScope, $q, clmDataStore) {
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
                var expectedCompletedTask = {};
                var expectedReturn = {};
                var actualReturn;

                profileObj.$loaded.and.returnValue($q.when(profile));
                spfFirebase.set.and.returnValue(expectedReturn);
                spfAuthData.user.and.returnValue($q.when({
                  publicId: 'bob'
                }));

                clmDataStore.events.updateProgress(event).then(function(completedTasks) {
                  actualReturn = completedTasks;
                });

                $rootScope.$apply();
                expect(actualReturn).toEqual(expectedReturn);
                expect(spfFirebase.set).toHaveBeenCalledWith([
                  'classMentors/eventParticipants', 'someEventId', 'bob', 'tasks'
                ], expectedCompletedTask);
              }
            ));

            it('should update progress when user join required service',
              inject(function($rootScope, $q, clmDataStore) {
                var event = {
                  $id: 'someEventId',
                  tasks: {
                    someTaskId: {
                      serviceId: 'codeSchool'
                    }
                  }
                };
                var profile = {
                  $id: 'bob',
                  services: {
                    codeSchool: {
                      details: {
                        id: 'bobUserName'
                      }
                    }
                  }
                };
                var expectedCompletedTask = {
                  someTaskId: {
                    completed: true
                  }
                };
                var expectedReturn = {};
                var actualReturn;

                profileObj.$loaded.and.returnValue($q.when(profile));
                spfFirebase.set.and.returnValue(expectedReturn);
                spfAuthData.user.and.returnValue($q.when({
                  publicId: 'bob'
                }));

                clmDataStore.events.updateProgress(event).then(function(completedTasks) {
                  actualReturn = completedTasks;
                });

                $rootScope.$apply();
                expect(actualReturn).toEqual(expectedReturn);
                expect(spfFirebase.set).toHaveBeenCalledWith([
                  'classMentors/eventParticipants', 'someEventId', 'bob', 'tasks'
                ], expectedCompletedTask);
              }
            ));

            it('should update progress when user earns a required badge',
              inject(function($rootScope, $q, clmDataStore) {
                var event = {
                  $id: 'someEventId',
                  tasks: {
                    someTaskId: {
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
                        id: 'bobUserName'
                      },
                      badges: {
                        someBadgeId: {}
                      }
                    }
                  }
                };
                var expectedCompletedTask = {
                  someTaskId: {
                    completed: true
                  }
                };
                var expectedReturn = {};
                var actualReturn;

                profileObj.$loaded.and.returnValue($q.when(profile));
                spfFirebase.set.and.returnValue(expectedReturn);
                spfAuthData.user.and.returnValue($q.when({
                  publicId: 'bob'
                }));

                clmDataStore.events.updateProgress(event).then(function(completedTasks) {
                  actualReturn = completedTasks;
                });

                $rootScope.$apply();
                expect(actualReturn).toEqual(expectedReturn);
                expect(spfFirebase.set).toHaveBeenCalledWith([
                  'classMentors/eventParticipants', 'someEventId', 'bob', 'tasks'
                ], expectedCompletedTask);
              }
            ));

            it('should not update progress when user has not earned the required badge',
              inject(function($rootScope, $q, clmDataStore) {
                var event = {
                  $id: 'someEventId',
                  tasks: {
                    someTaskId: {
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
                        id: 'bobUserName'
                      }
                    }
                  }
                };
                var expectedCompletedTask = {};
                var expectedReturn = {};
                var actualReturn;

                profileObj.$loaded.and.returnValue($q.when(profile));
                spfFirebase.set.and.returnValue(expectedReturn);
                spfAuthData.user.and.returnValue($q.when({
                  publicId: 'bob'
                }));

                clmDataStore.events.updateProgress(event).then(function(completedTasks) {
                  actualReturn = completedTasks;
                });

                $rootScope.$apply();
                expect(actualReturn).toEqual(expectedReturn);
                expect(spfFirebase.set).toHaveBeenCalledWith([
                  'classMentors/eventParticipants', 'someEventId', 'bob', 'tasks'
                ], expectedCompletedTask);
              }
            ));

            it('should update progress when user solves a required problem',
              inject(function($rootScope, $q, clmDataStore) {
                var event = {
                  $id: 'someEventId',
                  tasks: {
                    someTaskId: {
                      serviceId: 'singPath',
                      singPathProblem: {
                        path: {
                          id: 'somePathId'
                        },
                        level: {
                          id: 'someLevelId'
                        },
                        problem: {
                          id: 'someProblemId'
                        }
                      }
                    }
                  }
                };
                var profile = {
                  $id: 'bob',
                  solutions: {
                    somePathId: {
                      someLevelId: {
                        someProblemId: {}
                      }
                    }
                  }
                };
                var expectedCompletedTask = {
                  someTaskId: {
                    completed: true
                  }
                };
                var expectedReturn = {};
                var actualReturn;

                profileObj.$loaded.and.returnValue($q.when({$id: profile.$id}));
                spfFirebase.loadedObj.and.returnValue($q.when(profile));
                spfFirebase.set.and.returnValue(expectedReturn);
                spfAuthData.user.and.returnValue($q.when({
                  publicId: 'bob'
                }));

                clmDataStore.events.updateProgress(event).then(function(completedTasks) {
                  actualReturn = completedTasks;
                });

                $rootScope.$apply();
                expect(actualReturn).toEqual(expectedReturn);
                expect(spfFirebase.set).toHaveBeenCalledWith([
                  'classMentors/eventParticipants', 'someEventId', 'bob', 'tasks'
                ], expectedCompletedTask);
              }
            ));

            it('should not update progress when user has not solved the required problem',
              inject(function($rootScope, $q, clmDataStore) {
                var event = {
                  $id: 'someEventId',
                  tasks: {
                    someTaskId: {
                      serviceId: 'singPath',
                      singPathProblem: {
                        path: {
                          id: 'somePathId'
                        },
                        level: {
                          id: 'someLevelId'
                        },
                        problem: {
                          id: 'someProblemId'
                        }
                      }
                    }
                  }
                };
                var profile = {
                  $id: 'bob',
                  solutions: {
                    somePathId: {
                      someLevelId: {
                      }
                    }
                  }
                };
                var expectedCompletedTask = {};
                var expectedReturn = {};
                var actualReturn;

                profileObj.$loaded.and.returnValue($q.when({$id: profile.$id}));
                spfFirebase.loadedObj.and.returnValue($q.when(profile));
                spfFirebase.set.and.returnValue(expectedReturn);
                spfAuthData.user.and.returnValue($q.when({
                  publicId: 'bob'
                }));

                clmDataStore.events.updateProgress(event).then(function(completedTasks) {
                  actualReturn = completedTasks;
                });

                $rootScope.$apply();
                expect(actualReturn).toEqual(expectedReturn);
                expect(spfFirebase.set).toHaveBeenCalledWith([
                  'classMentors/eventParticipants', 'someEventId', 'bob', 'tasks'
                ], expectedCompletedTask);
              }
            ));

          });

        });
      });

    });

  });

})();
