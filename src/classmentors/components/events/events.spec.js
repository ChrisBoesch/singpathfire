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
      var inject;

      beforeEach(function() {
        inject = {
          initialData: {
            currentUser: {},
            event: {},
            participants: {}
          },
          $document: {},
          $mdDialog: jasmine.createSpyObj('$mdDialog', ['show', 'hide']),
          spfAlert: jasmine.createSpyObj('spfAlert', ['info', 'success', 'error', 'warning']),
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          clmDataStore: {
            events: jasmine.createSpyObj('events', ['leave', 'join', 'updateProgress'])
          }
        };
      });

      it('should set currentUser, event, and participant properties', function() {
        var ctrl;

        ctrl = $controller('ViewEventCtrl', inject);

        expect(ctrl.currentUser).toBe(inject.initialData.currentUser);
        expect(ctrl.event).toBe(inject.initialData.event);
        expect(ctrl.participants).toBe(inject.initialData.participants);
      });

      it('should set a menu title to event title', function() {
        inject.initialData.event = {
          title: 'some title'
        };

        $controller('ViewEventCtrl', inject);

        expect(inject.spfNavBarService.update).toHaveBeenCalledWith(
          'some title', jasmine.any(Object), jasmine.any(Array)
        );
      });

      it('should set a menu parent path to event list', function() {
        inject.initialData.event = {
          title: 'some title'
        };

        $controller('ViewEventCtrl', inject);

        expect(inject.spfNavBarService.update.calls.argsFor(0)[1]).toEqual(
          {title: 'Events', url: '#/events'}
        );
      });

      it('should not set any menu options if the user logged off', function() {
        inject.initialData.event = {
          title: 'some title'
        };

        $controller('ViewEventCtrl', inject);

        expect(inject.spfNavBarService.update.calls.argsFor(0)[2]).toEqual([]);
      });

      it('should set a join menu option if the user logged in', function() {
        inject.initialData = {
          event: {
            title: 'some title',
            owner: {}
          },
          currentUser: {
            publicId: 'bob'
          },
          participants: {
            $indexFor: jasmine.createSpy('participants.$indexFor')
          }
        };

        inject.initialData.participants.$indexFor.and.returnValue(-1);

        $controller('ViewEventCtrl', inject);

        expect(inject.spfNavBarService.update.calls.argsFor(0)[2]).toEqual(
          [{title: 'Join', onClick: jasmine.any(Function), icon: 'add-circle-outline'}]
        );
      });

      it('should set a leave menu option if the user logged in and a participant', function() {
        inject.initialData = {
          event: {
            title: 'some title',
            owner: {}
          },
          currentUser: {
            publicId: 'bob'
          },
          participants: {
            $indexFor: jasmine.createSpy('participants.$indexFor'),
            'bob': {}
          }
        };

        inject.initialData.participants.$indexFor.and.returnValue(0);

        $controller('ViewEventCtrl', inject);

        expect(inject.spfNavBarService.update.calls.argsFor(0)[2]).toEqual(
          [{title: 'Leave', onClick: jasmine.any(Function), icon: 'highlight-remove'}]
        );
      });

      it('should set an edit menu option if the user is the owner', function() {
        inject.initialData = {
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
          }
        };

        inject.initialData.participants.$indexFor.and.returnValue(0);

        $controller('ViewEventCtrl', inject);

        expect(
          inject.spfNavBarService.update.calls.argsFor(0)[2]
        ).toEqual([
          jasmine.any(Object),
          {title: 'Edit', url: '#/events/evenId/edit', icon: 'create'},
          jasmine.any(Object)
        ]);
      });

      it('should set an update menu option if the user is the owner', function() {
        inject.initialData = {
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
          }
        };

        inject.initialData.participants.$indexFor.and.returnValue(0);

        $controller('ViewEventCtrl', inject);

        expect(
          inject.spfNavBarService.update.calls.argsFor(0)[2]
        ).toEqual([
          jasmine.any(Object),
          jasmine.any(Object),
          {title: 'Update', onClick: jasmine.any(Function), icon: 'loop'}
        ]);
      });

      describe('completed', function() {

        it('should return 100 if there is no participants', function() {
          var ctrl = $controller('ViewEventCtrl', inject);

          expect(ctrl.completed('12345')).toBe(100);
        });

        it('should return percentage of participants having completed the task', function() {
          var ctrl = $controller('ViewEventCtrl', inject);

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
          var ctrl = $controller('ViewEventCtrl', inject);
          var task = {
            serviceId: 'singPath',
            singPathProblem: {
              path: {id: 'pathId'},
              level: {id: 'levelId'},
              problem: {id: 'problemId'}
            }
          };

          expect(ctrl.startLink(task)).toBe(
            '/singpath/#/paths/pathId/levels/levelId/problems/problemId/play'
          );
        });

        it('should return a link to a code school course', function() {
          var ctrl = $controller('ViewEventCtrl', inject);
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
          var ctrl = $controller('ViewEventCtrl', inject);
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

        it('should update the current user task completeness', function() {
          var ctrl = $controller('ViewEventCtrl', inject);

          ctrl.update();

          expect(inject.clmDataStore.events.updateProgress).toHaveBeenCalledWith(inject.initialData.event);
        });

      });

      describe('updateAll', function() {

        it('should update the current user task completeness', function() {
          var ctrl = $controller('ViewEventCtrl', inject);

          ctrl.participants = {
            0: {$id: 'somePublicId'},
            1: {$id: 'someOtherPublicId'}
          };

          ctrl.updateAll();

          expect(inject.clmDataStore.events.updateProgress.calls.count()).toBe(2);
          expect(
            inject.clmDataStore.events.updateProgress
          ).toHaveBeenCalledWith(
            inject.initialData.event, 'somePublicId'
          );
          expect(
            inject.clmDataStore.events.updateProgress
          ).toHaveBeenCalledWith(
            inject.initialData.event, 'someOtherPublicId'
          );
        });

      });

    });

  });

})();
