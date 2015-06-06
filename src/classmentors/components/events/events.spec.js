/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('clm class mentors home components', function() {
    var $controller;//, $rootScope, $q;

    beforeEach(module('clm'));

    beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
      $controller = _$controller_;
      // $rootScope = _$rootScope_;
      // $q = _$q_;
    }));

    describe('ViewEventCtrl', function() {
      var deps;

      beforeEach(function() {
        deps = {
          initialData: {
            currentUser: {},
            profile: {},
            event: {},
            tasks: {},
            participants: {},
            ranking: {},
            solution: {},
            progress: {},
            currentUserProgress: {},
            currentUserSolutions: {},
            currentUserStats: {}
          },
          $document: {},
          $route: jasmine.createSpyObj('$route', ['reload']),
          $mdDialog: jasmine.createSpyObj('$mdDialog', ['show', 'hide']),
          spfAlert: jasmine.createSpyObj('spfAlert', ['info', 'success', 'error', 'warning']),
          spfFirebase: jasmine.createSpyObj('spfFirebase', ['cleanObj']),
          spfAuthData: jasmine.createSpyObj('spfAuthData', ['publicId']),
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          clmDataStore: {
            initProfile: jasmine.createSpy('initProfile'),
            events: jasmine.createSpyObj('events', ['leave', 'join', 'updateProgress', 'updateCurrentUserProfile'])
          }
        };
      });

      it('should set currentUser, event, and participant properties', function() {
        var ctrl;

        ctrl = $controller('ViewEventCtrl', deps);

        expect(ctrl.currentUser).toBe(deps.initialData.currentUser);
        expect(ctrl.event).toBe(deps.initialData.event);
        expect(ctrl.participants).toBe(deps.initialData.participants);
      });

      it('should set a menu title to event title', function() {
        deps.initialData.event = {
          title: 'some title'
        };

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update).toHaveBeenCalledWith(
          'some title', jasmine.any(Object), jasmine.any(Array)
        );
      });

      it('should set a menu parent path to event list', function() {
        deps.initialData.event = {
          title: 'some title'
        };

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update.calls.argsFor(0)[1]).toEqual(
          {title: 'Events', url: '#/events'}
        );
      });

      it('should not set any menu options if the user logged off', function() {
        deps.initialData.event = {
          title: 'some title'
        };

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update.calls.argsFor(0)[2]).toEqual([]);
      });

      it('should set a join menu option if the user logged in', function() {
        deps.initialData = {
          event: {
            title: 'some title',
            owner: {}
          },
          currentUser: {
            publicId: 'bob'
          },
          participants: {
            $indexFor: jasmine.createSpy('participants.$indexFor')
          },
          currentUserStats: {}
        };

        deps.initialData.participants.$indexFor.and.returnValue(-1);

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update.calls.argsFor(0)[2]).toEqual(
          [{title: 'Join', onClick: jasmine.any(Function), icon: 'add-circle-outline'}]
        );
      });

      it('should set a leave menu option if the user logged in and a participant', function() {
        deps.initialData = {
          event: {
            title: 'some title',
            owner: {}
          },
          tasks: {},
          currentUser: {
            publicId: 'bob'
          },
          participants: {
            $indexFor: jasmine.createSpy('participants.$indexFor'),
            'bob': {}
          },
          currentUserStats: {}
        };

        deps.initialData.participants.$indexFor.and.returnValue(0);

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update.calls.argsFor(0)[2]).toEqual(
          [{title: 'Leave', onClick: jasmine.any(Function), icon: 'highlight-remove'}]
        );
      });

      it('should set an edit menu option if the user is the owner', function() {
        deps.initialData = {
          event: {
            $id: 'evenId',
            title: 'some title',
            owner: {
              publicId: 'bob'
            }
          },
          currentUser: {
            publicId: 'bob'
          },
          participants: {
            $indexFor: jasmine.createSpy('participants.$indexFor'),
            'bob': {}
          },
          currentUserStats: {}
        };

        deps.initialData.participants.$indexFor.and.returnValue(0);

        $controller('ViewEventCtrl', deps);

        expect(
          deps.spfNavBarService.update.calls.argsFor(0)[2]
        ).toEqual([
          jasmine.any(Object),
          {title: 'Edit', url: '#/events/evenId/edit', icon: 'create'},
          jasmine.any(Object)
        ]);
      });

      it('should set an update menu option if the user is the owner', function() {
        deps.initialData = {
          event: {
            $id: 'evenId',
            title: 'some title',
            owner: {
              publicId: 'bob'
            }
          },
          currentUser: {
            publicId: 'bob'
          },
          participants: {
            $indexFor: jasmine.createSpy('participants.$indexFor'),
            'bob': {}
          },
          currentUserStats: {}
        };

        deps.initialData.participants.$indexFor.and.returnValue(0);

        $controller('ViewEventCtrl', deps);

        expect(
          deps.spfNavBarService.update.calls.argsFor(0)[2]
        ).toEqual([
          jasmine.any(Object),
          jasmine.any(Object),
          {title: 'Update', onClick: jasmine.any(Function), icon: 'loop'}
        ]);
      });

      describe('register', function() {
        var $q, $rootScope;

        beforeEach(inject(function(_$q_, _$rootScope_) {
          $rootScope = _$rootScope_;
          $q = _$q_;
        }));

        it('should save the public id', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var currentUser = {};

          deps.spfAuthData.publicId.and.returnValue($q.when());

          ctrl.register(currentUser);

          expect(deps.spfAuthData.publicId).toHaveBeenCalledWith(currentUser);
        });

        it('should initiate profile', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var currentUser = {};

          deps.spfAuthData.publicId.and.returnValue($q.when());

          ctrl.register(currentUser);

          $rootScope.$apply();
          expect(deps.clmDataStore.initProfile).toHaveBeenCalledWith();
        });

        it('should reload the page on success', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var currentUser = {};

          deps.spfAuthData.publicId.and.returnValue($q.when());

          ctrl.register(currentUser);

          $rootScope.$apply();
          expect(deps.$route.reload).toHaveBeenCalled();
        });

        it('should notify error', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var currentUser = {};

          deps.spfAuthData.publicId.and.returnValue($q.reject());

          ctrl.register(currentUser);

          $rootScope.$apply();
          expect(deps.$route.reload).not.toHaveBeenCalled();
          expect(deps.spfAlert.error).toHaveBeenCalled();
        });

      });

      describe('completed', function() {

        it('should return 100 if there is no participants', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          expect(ctrl.completed('12345')).toBe(100);
        });

        it('should return percentage of participants having completed the task', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          ctrl.participants = {
            $id: 'eventId',
            someParticipantId: {
              tasks: {
                someTaskId: {
                  completed: true
                }
              }
            },
            someOtherParticipantId: {}
          };
          expect(ctrl.completed('someTaskId')).toBe(50);
        });

      });

      describe('startLink', function() {
        var routes;

        beforeEach(inject(function(_routes_) {
          routes = _routes_;
        }));

        it('should return an empty string if the task does not involve a service', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {linkPattern: 'foo'};
          var profile = {};

          expect(ctrl.startLink(task, profile)).toBe('');
        });

        it('should return an empty string if the task involved an unknown service', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {serviceId: 'foo'};
          var profile = {};

          expect(ctrl.startLink(task, profile)).toBe('');
        });

        it('should return a link to a singpath problem', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {
            serviceId: 'singPath',
            singPathProblem: {path: {id: 'pathId'}, level: {id: 'levelId'}, problem: {id: 'problemId'}}
          };
          var profile = {};

          expect(ctrl.startLink(task, profile)).toBe(
            'http://www.singpath.com//#/paths/pathId/levels/levelId/problems/problemId/play'
          );
        });

        it('should return an url to the profile view if the task involve registering', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {serviceId: 'codeSchool'};
          var profile = {};

          expect(ctrl.startLink(task, profile)).toBe('#' + routes.editProfile);
        });

        it('should return an url to the profile view if the task involve badge but the user is not registered',
          function() {
            var ctrl = $controller('ViewEventCtrl', deps);
            var task = {
              serviceId: 'codeSchool',
              badge: {url: 'https://www.codeschool.com/courses/some-level-name'}
            };
            var profile = {};

            expect(ctrl.startLink(task, profile)).toBe('#' + routes.editProfile);
          }
        );

        it('should return a link to a code school course', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {
            serviceId: 'codeSchool',
            badge: {url: 'https://www.codeschool.com/courses/some-level-name'}
          };
          var profile = {
            services: {codeSchool: {details: {id: 'bob'}}}
          };

          expect(ctrl.startLink(task, profile)).toBe(
            'https://www.codeschool.com/courses/some-level-name'
          );
        });

        it('should return a link to a code combat level', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {
            serviceId: 'codeCombat',
            badge: {url: 'https://www.codescombat.com/level/some-level-name'}
          };
          var profile = {
            services: {codeCombat: {details: {id: 'bob'}}}
          };

          expect(ctrl.startLink(task, profile)).toBe(
            'https://www.codescombat.com/level/some-level-name'
          );
        });

      });

      describe('mustRegister', function() {

        it('should return false if the task does not involve a service', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {linkPattern: 'foo'};
          var profile = {};

          expect(ctrl.mustRegister(task, profile)).toBe(false);
        });

        it('should return false if the task service involved is not tracked', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {serviceId: 'singPath'};
          var profile = {};

          expect(ctrl.mustRegister(task, profile)).toBe(false);
        });

        it('should return false if the user is already registered', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {serviceId: 'codeSchool'};
          var profile = {services: {
            codeSchool: {details: {id: 'bob'}}
          }};

          expect(ctrl.mustRegister(task, profile)).toBe(false);
        });

        it('should return true if the user is not already registered', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {serviceId: 'codeSchool'};
          var profile = {services: {
            codeCombat: {details: {id: 'bob'}}
          }};

          expect(ctrl.mustRegister(task, profile)).toBe(true);
        });

      });

      describe('update', function() {

        it('should update the current user task completeness', inject(function($q) {
          var ctrl = $controller('ViewEventCtrl', deps);
          var event = {};
          var tasks = {};
          var solutions = {};
          var profile = {};
          var userProgress = {};

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.when());

          ctrl.update(event, tasks, solutions, profile, userProgress);

          expect(deps.clmDataStore.events.updateCurrentUserProfile).toHaveBeenCalledWith(
            event, tasks, solutions, profile, userProgress
          );
        }));

        it('should show success message on success', inject(function($q, $rootScope) {
          var ctrl = $controller('ViewEventCtrl', deps);

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.when({}));

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(deps.spfAlert.success).toHaveBeenCalled();
        }));

        it('should should set currentUserStats on success', inject(function($q, $rootScope) {
          var ctrl = $controller('ViewEventCtrl', deps);
          var expected = {};

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue(
            $q.when(expected)
          );

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(ctrl.currentUserStats).toBe(expected);
        }));

        it('should show error message on failure', inject(function($q, $rootScope) {
          var ctrl = $controller('ViewEventCtrl', deps);

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.reject());

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(deps.spfAlert.error).toHaveBeenCalled();
        }));

      });

      describe('updateAll', function() {

        it('should update the all user task completeness', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          ctrl.participants = {
            0: {$id: 'somePublicId'},
            1: {$id: 'someOtherPublicId'}
          };

          ctrl.progress = {
            'somePublicId': {}
          };

          ctrl.updateAll();

          expect(deps.clmDataStore.events.updateProgress.calls.count()).toBe(2);
          expect(
            deps.clmDataStore.events.updateProgress
          ).toHaveBeenCalledWith(
            deps.initialData.event,
            deps.initialData.tasks,
            deps.initialData.solutions,
            'somePublicId',
            ctrl.progress.somePublicId
          );
          expect(
            deps.clmDataStore.events.updateProgress
          ).toHaveBeenCalledWith(
            deps.initialData.event, deps.initialData.tasks, deps.initialData.solutions, 'someOtherPublicId', undefined
          );
        });

      });

      describe('orderBy', function() {

        it('should setup orderKey and reverseOrder', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          expect(ctrl.orderKey).toBe('total');
          expect(ctrl.reverseOrder).toBe(true);
        });

        it('should reverse order when the same key is selected again', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          expect(ctrl.reverseOrder).toBe(true);
          ctrl.orderBy(ctrl.orderKey);
          expect(ctrl.reverseOrder).toBe(false);
          ctrl.orderBy(ctrl.orderKey);
          expect(ctrl.reverseOrder).toBe(true);
        });

        it('should set new key and reset reverseOrder', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          ctrl.reverseOrder = false;
          ctrl.orderBy('someOtherKey');

          expect(ctrl.orderKey).toBe('someOtherKey');
          expect(ctrl.reverseOrder).toBe(true);
        });

      });

      describe('visibleTasks', function() {
        it('should return 0 when there is no tasks ', function() {
          var ctrl;

          deps.initialData.tasks = {$id: 'someEventId'};

          ctrl = $controller('ViewEventCtrl', deps);
          expect(ctrl.visibleTasks()).toBe(0);
        });

        it('should return 0 when all tasks are hidden', function() {
          var ctrl;

          deps.initialData.tasks = {
            $id: 'someEventId',
            someTaskId: {description: 'some desc.', hidden: true}
          };

          ctrl = $controller('ViewEventCtrl', deps);
          expect(ctrl.visibleTasks()).toBe(0);
        });

        it('should return the number of tasks which are not hidden', function() {
          var ctrl;

          deps.initialData.tasks = {
            $id: 'someEventId',
            someTaskId: {description: 'some desc.'},
            someOtherTaskId: {description: 'some desc.', hidden: true}
          };

          ctrl = $controller('ViewEventCtrl', deps);
          expect(ctrl.visibleTasks()).toBe(1);
        });
      });

    });

  });

})();
