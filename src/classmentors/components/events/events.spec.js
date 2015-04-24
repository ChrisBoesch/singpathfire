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
          urlFor: jasmine.createSpy('urlFor'),
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

          expect(inject.clmDataStore.events.updateProgress.calls.count()).toBe(1);
          expect(
            inject.clmDataStore.events.updateProgress.calls.argsFor(0)[0]
          ).toBe(
            inject.initialData.event
          );
          expect(
            inject.clmDataStore.events.updateProgress.calls.argsFor(0)[1]
          ).toBe(
            inject.initialData.currentUser
          );
        });

      });

    });

  });

})();
