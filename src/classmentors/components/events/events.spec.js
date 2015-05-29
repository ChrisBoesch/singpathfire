/* eslint camelcase: false*/
/* global describe, beforeEach, module, inject,  jasmine, it, expect */

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
            event: {},
            participants: {},
            currentUserStats: {}
          },
          $document: {},
          $route: jasmine.createSpyObj('$route', ['reload']),
          $mdDialog: jasmine.createSpyObj('$mdDialog', ['show', 'hide']),
          spfAlert: jasmine.createSpyObj('spfAlert', ['info', 'success', 'error', 'warning']),
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          clmDataStore: {
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

        it('should return a link to a singpath problem', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {
            serviceId: 'singPath',
            singPathProblem: {
              path: {id: 'pathId'},
              level: {id: 'levelId'},
              problem: {id: 'problemId'}
            }
          };

          expect(ctrl.startLink(task)).toBe(
            'http://www.singpath.com//#/paths/pathId/levels/levelId/problems/problemId/play'
          );
        });

        it('should return a link to a code school course', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {
            serviceId: 'codeSchool',
            badge: {
              url: 'https://www.codeschool.com/courses/some-level-name'
            }
          };

          expect(ctrl.startLink(task)).toBe(
            'https://www.codeschool.com/courses/some-level-name'
          );
        });

        it('should return a link to a code combat level', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {
            serviceId: 'codeCombat',
            badge: {
              url: 'https://www.codescombat.com/level/some-level-name'
            }
          };

          expect(ctrl.startLink(task)).toBe(
            'https://www.codescombat.com/level/some-level-name'
          );
        });

      });

      describe('update', function() {

        it('should update the current user task completeness', inject(function($q) {
          var ctrl = $controller('ViewEventCtrl', deps);
          var event = {};
          var tasks = {};
          var profile = {};

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.when());

          ctrl.update(event, tasks, profile);

          expect(deps.clmDataStore.events.updateCurrentUserProfile).toHaveBeenCalledWith(
            event, tasks, profile
          );
        }));

        it('should show success message on success', inject(function($q, $rootScope) {
          var ctrl = $controller('ViewEventCtrl', deps);

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.when({}));

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(deps.spfAlert.success).toHaveBeenCalled();
        }));

        it('should should set currentUserProgress on success', inject(function($q, $rootScope) {
          var ctrl = $controller('ViewEventCtrl', deps);
          var expected = {};

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue(
            $q.when({progress: expected})
          );

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(ctrl.currentUserProgress).toBe(expected);
        }));

        it('should should set currentUserRanking on success', inject(function($q, $rootScope) {
          var ctrl = $controller('ViewEventCtrl', deps);
          var expected = {};

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue(
            $q.when({ranking: expected})
          );

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(ctrl.currentUserRanking).toBe(expected);
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

          ctrl.updateAll();

          expect(deps.clmDataStore.events.updateProgress.calls.count()).toBe(2);
          expect(
            deps.clmDataStore.events.updateProgress
          ).toHaveBeenCalledWith(
            deps.initialData.event, deps.initialData.tasks, 'somePublicId'
          );
          expect(
            deps.clmDataStore.events.updateProgress
          ).toHaveBeenCalledWith(
            deps.initialData.event, deps.initialData.tasks, 'someOtherPublicId'
          );
        });

      });

    });

  });

})();
