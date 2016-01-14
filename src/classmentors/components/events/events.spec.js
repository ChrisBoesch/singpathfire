/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('clm class mentors events components', function() {
    var $controller, $rootScope, $q, spfAuth, spfAuthData, clmDataStore;

    beforeEach(module('clm'));

    beforeEach(function() {
      spfAuth = jasmine.createSpyObj('spfAuth', ['login']);
      spfAuthData = jasmine.createSpyObj('spfAuthData', ['user']);
      clmDataStore = jasmine.createSpyObj('clmDataStore', ['currentUserProfile', 'initProfile']);
      clmDataStore.events = jasmine.createSpyObj(
        'clmDataStore.events', ['list', 'listCreatedEvents', 'listJoinedEvents']
      );

      module(function($provide) {
        $provide.value('spfAuth', spfAuth);
        $provide.value('spfAuthData', spfAuthData);
        $provide.value('clmDataStore', clmDataStore);
      });
    });

    beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    }));

    describe('ClmListEvent', function() {
      var deps;

      beforeEach(function() {
        deps = {
          initialData: {
            events: {},
            auth: {},
            currentUser: null,
            profile: null,
            createdEvents: {},
            joinedEvents: {}
          },
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          urlFor: jasmine.createSpy('urlFor')
        };
      });

      it('should have no menu option if the user is not premium', function() {
        var opts;

        $controller('ClmListEvent', deps);

        expect(
          deps.spfNavBarService.update
        ).toHaveBeenCalledWith(
          jasmine.any(String), undefined, jasmine.any(Array)
        );

        opts = deps.spfNavBarService.update.calls.argsFor(0)[2];
        expect(opts.length).toBe(0);
      });

      it('should have new event option if the user is premium', function() {
        var opts;

        deps.initialData.currentUser = {publicId: 'bob'};
        deps.initialData.profile = {
          $id: 'bob',
          user: {isPremium: true}
        };

        $controller('ClmListEvent', deps);

        expect(
          deps.spfNavBarService.update
        ).toHaveBeenCalledWith(
          jasmine.any(String), undefined, jasmine.any(Array)
        );

        opts = deps.spfNavBarService.update.calls.argsFor(0)[2];
        expect(opts.length).toBe(1);
        expect(opts[0].title).toBe('New event');
        expect(deps.urlFor).toHaveBeenCalledWith('newEvent');
      });

      describe('clmListEventResolver', function() {
        var init;

        beforeEach(inject(function(clmListEventResolver) {
          init = clmListEventResolver;
        }));

        it('should return list of events', function() {
          var initialData;
          var events = {};
          var joinedEvents = {};
          var createdEvents = {};

          spfAuthData.user.and.returnValue($q.when());
          clmDataStore.events.list.and.returnValue($q.when(events));
          clmDataStore.events.listJoinedEvents.and.returnValue($q.when(joinedEvents));
          clmDataStore.events.listCreatedEvents.and.returnValue($q.when(createdEvents));

          init().then(function(results) {
            initialData = results;
          });
          $rootScope.$apply();

          expect(initialData.events).toBe(events);
          expect(initialData.createdEvents).toBe(createdEvents);
          expect(initialData.joinedEvents).toBe(joinedEvents);
        });

        it('should return the current user profile', function() {
          var initialData;
          var authData = {};
          var profile = {};

          spfAuthData.user.and.returnValue($q.when(authData));
          clmDataStore.currentUserProfile.and.returnValue($q.when(profile));

          init().then(function(results) {
            initialData = results;
          });
          $rootScope.$apply();

          expect(initialData.auth).toBe(spfAuth);
          expect(initialData.currentUser).toBe(authData);
          expect(initialData.profile).toBe(profile);
        });

        it('should resolve successfully if the current user call reject', function() {
          var err;

          spfAuthData.user.and.returnValue($q.reject());

          init().catch(function(e) {
            err = e;
          });

          $rootScope.$apply();
          expect(err).toBeUndefined();
        });
      });
    });

    describe('NewEventCtrl', function() {

      describe('newEventCtrlInitialData', function() {
        var init;

        beforeEach(inject(function(newEventCtrlInitialData) {
          init = newEventCtrlInitialData;
        }));

        it('should reject if the user is logged off', function() {
          var err;

          spfAuth.user = null;
          init().catch(function(e) {
            err = e;
          });

          $rootScope.$apply();
          expect(err).toBeDefined();
          expect(spfAuthData.user).not.toHaveBeenCalled();
          expect(clmDataStore.currentUserProfile).not.toHaveBeenCalled();
        });

        it('should reject if the user not premium', function() {
          var err;

          spfAuth.user = {uid: 'google:1234'};
          clmDataStore.currentUserProfile.and.returnValue($q.when({
            $id: 'bob',
            user: {isPremium: false}
          }));
          init().catch(function(e) {
            err = e;
          });

          $rootScope.$apply();
          expect(err).toBeDefined();
          expect(spfAuthData.user).toHaveBeenCalled();
          expect(clmDataStore.currentUserProfile).toHaveBeenCalled();
        });

        it('should set the user profile', function() {
          var initialData;
          var authData = {publicId: 'bob'};
          var profile = {$id: 'bob', user: {isPremium: true}};

          spfAuth.user = {uid: 'google:1234'};
          clmDataStore.currentUserProfile.and.returnValue($q.when(profile));
          spfAuthData.user.and.returnValue(authData);
          init().then(function(resp) {
            initialData = resp;
          });

          $rootScope.$apply();
          expect(initialData).toBeDefined();
          expect(initialData.auth).toBe(spfAuth);
          expect(initialData.currentUser).toBe(authData);
          expect(initialData.profile).toBe(profile);
        });

        it('should init user profile if the profile does not exists', function() {
          var initialData;
          var authData = {publicId: 'bob'};
          var profile = {$id: 'bob', user: {isPremium: true}};

          spfAuth.user = {uid: 'google:1234'};
          clmDataStore.currentUserProfile.and.returnValue($q.when({$value: null}));
          clmDataStore.initProfile.and.returnValue($q.when(profile));
          spfAuthData.user.and.returnValue(authData);
          init().then(function(resp) {
            initialData = resp;
          });

          $rootScope.$apply();
          expect(initialData).toBeDefined();
          expect(initialData.auth).toBe(spfAuth);
          expect(initialData.currentUser).toBe(authData);
          expect(initialData.profile).toBe(profile);
        });

        it('should reject if the initiated profile is not premium', function() {
          var err;
          var authData = {publicId: 'bob'};
          var profile = {$id: 'bob', user: {}};

          spfAuth.user = {uid: 'google:1234'};
          clmDataStore.currentUserProfile.and.returnValue($q.when({$value: null}));
          clmDataStore.initProfile.and.returnValue($q.when(profile));
          spfAuthData.user.and.returnValue(authData);
          init().catch(function(e) {
            err = e;
          });

          $rootScope.$apply();
          expect(err).toBeDefined();
        });

      });

    });

    describe('ViewEventCtrl', function() {
      var deps;

      beforeEach(function() {
        deps = {
          $scope: jasmine.createSpyObj('$scope', ['$on']),
          initialData: {
            currentUser: {},
            profile: {},
            event: {
              $id: 'someEventId',
              owner: {publicId: 'bob'}
            },
            ranking: {},
            canView: false,
            tasks: {},
            participants: {},
            progress: {},
            solution: {}
          },
          $document: {},
          $mdDialog: jasmine.createSpyObj('$mdDialog', ['show', 'hide']),
          $route: jasmine.createSpyObj('$route', ['reload']),
          spfAlert: jasmine.createSpyObj('spfAlert', ['info', 'success', 'error', 'warning']),
          spfFirebase: jasmine.createSpyObj('spfFirebase', ['cleanObj']),
          spfAuthData: jasmine.createSpyObj('spfAuthData', ['publicId']),
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          clmDataStore: {
            initProfile: jasmine.createSpy('initProfile'),
            events: jasmine.createSpyObj('events', [
              'leave', 'join', 'updateProgress', 'updateCurrentUserProfile', 'monitorEvent'
            ])
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
        deps.initialData.event.title = 'some title';

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update).toHaveBeenCalledWith(
          'some title', jasmine.any(Object), jasmine.any(Array)
        );
      });

      it('should set a menu parent path to event list', function() {
        deps.initialData.event.title = 'some title';

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update.calls.argsFor(0)[1]).toEqual(
          {title: 'Events', url: '#/events'}
        );
      });

      it('should not set any menu options if the user logged off', function() {
        deps.initialData.event.title = 'some title';

        $controller('ViewEventCtrl', deps);

        expect(deps.spfNavBarService.update.calls.argsFor(0)[2]).toEqual([]);
      });

      it('should set a join menu option if the user logged in', function() {
        deps.initialData = {
          event: {
            title: 'some title',
            owner: {publicId: 'alice'}
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
          [{title: 'Join', onClick: jasmine.any(Function), icon: 'add'}]
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
          [{title: 'Leave', onClick: jasmine.any(Function), icon: 'clear'}]
        );
      });

      it('should set an edit menu option if the user is the owner', function() {
        deps.initialData = {
          event: {
            $id: 'evenId',
            title: 'some title',
            owner: {publicId: 'bob'}
          },
          currentUser: {publicId: 'bob'},
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
            owner: {publicId: 'bob'}
          },
          currentUser: {publicId: 'bob'},
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

    });

    describe('EditEventCtrl', function() {
      var deps;

      beforeEach(function() {
        deps = {
          initialData: {
            currentUser: {},
            event: {owner: {}},
            tasks: {}
          },
          $document: {},
          spfAlert: jasmine.createSpyObj('spfAlert', ['info', 'success', 'error', 'warning']),
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          urlFor: jasmine.createSpy('urlFor'),
          clmDataStore: {
            events: jasmine.createSpyObj('events', [
              'updateEvent', 'openTask', 'closeTask', 'showTask', 'hideTask', 'archiveTask'
            ])
          }
        };
      });

      it('should set currentUser, event and tasks property', function() {
        var ctrl = $controller('EditEventCtrl', deps);

        expect(ctrl.currentUser).toBe(deps.initialData.currentUser);
        expect(ctrl.event).toBe(deps.initialData.event);
        expect(ctrl.tasks).toBe(deps.initialData.tasks);
      });

      describe('save', function() {
        var ctrl, form;

        beforeEach(function() {
          ctrl = $controller('EditEventCtrl', deps);
          form = jasmine.createSpyObj('FormModelInstance', ['$setPristine']);
        });

        it('should set the savingEvent property to true', function() {
          deps.clmDataStore.events.updateEvent.and.returnValue($q.reject());

          ctrl.save(ctrl.currentUser, ctrl.event, 'pass', form);

          expect(ctrl.savingEvent).toBe(true);
        });

        it('should set the savingEvent false once the async task reject', function() {
          deps.clmDataStore.events.updateEvent.and.returnValue($q.reject());

          ctrl.save(ctrl.currentUser, ctrl.event, 'pass', form);
          $rootScope.$apply();

          expect(ctrl.savingEvent).toBe(false);
        });

        it('should set the savingEvent false once the async task succeed', function() {
          deps.clmDataStore.events.updateEvent.and.returnValue($q.when());

          ctrl.save(ctrl.currentUser, ctrl.event, 'pass', form);
          $rootScope.$apply();

          expect(ctrl.savingEvent).toBe(false);
        });

        it('should update the event owner property', function() {
          deps.clmDataStore.events.updateEvent.and.returnValue($q.reject());
          ctrl.currentUser.publicId = 'bob';
          ctrl.currentUser.displayName = 'Bob';
          ctrl.currentUser.gravatar = 'someUrl';
          ctrl.save(ctrl.currentUser, ctrl.event, 'pass', form);

          expect(ctrl.event.owner.publicId).toBe('bob');
          expect(ctrl.event.owner.displayName).toBe('Bob');
          expect(ctrl.event.owner.gravatar).toBe('someUrl');
        });

        it('should update the event details', function() {
          deps.clmDataStore.events.updateEvent.and.returnValue($q.reject());

          ctrl.save(ctrl.currentUser, ctrl.event, 'pass', form);

          expect(deps.clmDataStore.events.updateEvent).toHaveBeenCalledWith(ctrl.event, 'pass');
        });

        it('should reset the event detail form', function() {
          deps.clmDataStore.events.updateEvent.and.returnValue($q.when());

          ctrl.save(ctrl.currentUser, ctrl.event, 'pass', form);
          $rootScope.$apply();

          expect(form.$setPristine).toHaveBeenCalledWith(true);
          expect(ctrl.newPassword).toBe('');
        });

      });

      describe('openTask', function() {
        var ctrl;

        beforeEach(function() {
          ctrl = $controller('EditEventCtrl', deps);
        });

        it('should open the task', function() {
          deps.clmDataStore.events.openTask.and.returnValue($q.when());
          ctrl.openTask('someEventId', 'someTaskId');
          expect(deps.clmDataStore.events.openTask).toHaveBeenCalledWith('someEventId', 'someTaskId');
        });

        it('should alert on success', function() {
          deps.clmDataStore.events.openTask.and.returnValue($q.when());
          ctrl.openTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.success).toHaveBeenCalledWith(jasmine.any(String));
        });

        it('should alert on failure', function() {
          deps.clmDataStore.events.openTask.and.returnValue($q.reject());
          ctrl.openTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.error).toHaveBeenCalledWith(jasmine.any(String));
        });
      });

      describe('closeTask', function() {
        var ctrl;

        beforeEach(function() {
          ctrl = $controller('EditEventCtrl', deps);
        });

        it('should open the task', function() {
          deps.clmDataStore.events.closeTask.and.returnValue($q.when());
          ctrl.closeTask('someEventId', 'someTaskId');
          expect(deps.clmDataStore.events.closeTask).toHaveBeenCalledWith('someEventId', 'someTaskId');
        });

        it('should alert on success', function() {
          deps.clmDataStore.events.closeTask.and.returnValue($q.when());
          ctrl.closeTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.success).toHaveBeenCalledWith(jasmine.any(String));
        });

        it('should alert on failure', function() {
          deps.clmDataStore.events.closeTask.and.returnValue($q.reject());
          ctrl.closeTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.error).toHaveBeenCalledWith(jasmine.any(String));
        });
      });

      describe('showTask', function() {
        var ctrl;

        beforeEach(function() {
          ctrl = $controller('EditEventCtrl', deps);
        });

        it('should open the task', function() {
          deps.clmDataStore.events.showTask.and.returnValue($q.when());
          ctrl.showTask('someEventId', 'someTaskId');
          expect(deps.clmDataStore.events.showTask).toHaveBeenCalledWith('someEventId', 'someTaskId');
        });

        it('should alert on success', function() {
          deps.clmDataStore.events.showTask.and.returnValue($q.when());
          ctrl.showTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.success).toHaveBeenCalledWith(jasmine.any(String));
        });

        it('should alert on failure', function() {
          deps.clmDataStore.events.showTask.and.returnValue($q.reject());
          ctrl.showTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.error).toHaveBeenCalledWith(jasmine.any(String));
        });
      });

      describe('hideTask', function() {
        var ctrl;

        beforeEach(function() {
          ctrl = $controller('EditEventCtrl', deps);
        });

        it('should open the task', function() {
          deps.clmDataStore.events.hideTask.and.returnValue($q.when());
          ctrl.hideTask('someEventId', 'someTaskId');
          expect(deps.clmDataStore.events.hideTask).toHaveBeenCalledWith('someEventId', 'someTaskId');
        });

        it('should alert on success', function() {
          deps.clmDataStore.events.hideTask.and.returnValue($q.when());
          ctrl.hideTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.success).toHaveBeenCalledWith(jasmine.any(String));
        });

        it('should alert on failure', function() {
          deps.clmDataStore.events.hideTask.and.returnValue($q.reject());
          ctrl.hideTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.error).toHaveBeenCalledWith(jasmine.any(String));
        });
      });

      describe('archiveTask', function() {
        var ctrl;

        beforeEach(function() {
          ctrl = $controller('EditEventCtrl', deps);
        });

        it('should open the task', function() {
          deps.clmDataStore.events.archiveTask.and.returnValue($q.when());
          ctrl.archiveTask('someEventId', 'someTaskId');
          expect(deps.clmDataStore.events.archiveTask).toHaveBeenCalledWith('someEventId', 'someTaskId');
        });

        it('should alert on success', function() {
          deps.clmDataStore.events.archiveTask.and.returnValue($q.when());
          ctrl.archiveTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.success).toHaveBeenCalledWith(jasmine.any(String));
        });

        it('should alert on failure', function() {
          deps.clmDataStore.events.archiveTask.and.returnValue($q.reject());
          ctrl.archiveTask('someEventId', 'someTaskId');

          $rootScope.$apply();
          expect(deps.spfAlert.error).toHaveBeenCalledWith(jasmine.any(String));
        });
      });

    });

    describe('ClmEventTableCtrl', function() {
      var deps, ctrlFn, userProgress, userSolutions, queuedSolutions;

      beforeEach(function() {
        deps = {
          $scope: jasmine.createSpyObj('$scope', ['$on']),
          $mdDialog: jasmine.createSpyObj('$mdDialog', ['show', 'hide']),
          $document: {},
          urlFor: jasmine.createSpy('urlFor'),
          spfAlert: jasmine.createSpyObj('spfAlert', ['info', 'success', 'error', 'warning']),
          spfNavBarService: jasmine.createSpyObj('spfNavBarService', ['update']),
          clmDataStore: {
            events: jasmine.createSpyObj('events', [
              'submitSolution', 'updateCurrentUserProfile', 'removeParticpants',
              'getUserProgress', 'getUserSolutions'
            ]),
            singPath: jasmine.createSpyObj('singPath', ['queuedSolutions'])
          }
        };

        userProgress = {$id: 'bob', $destroy: jasmine.createSpy('userProgressDestroy')};
        userSolutions = {$id: 'bob', $destroy: jasmine.createSpy('userSolutionsDestroy')};
        queuedSolutions = {
          $watch: jasmine.createSpy('queuedSolutionsWatch'),
          $destroy: jasmine.createSpy('queuedSolutionsDestroy')
        };
        deps.clmDataStore.events.getUserProgress.and.returnValue($q.when(userProgress));
        deps.clmDataStore.events.getUserSolutions.and.returnValue($q.when(userSolutions));
        deps.clmDataStore.singPath.queuedSolutions.and.returnValue($q.when(queuedSolutions));

        // Binding the directive attributes to the controller instance
        // (undocumented feature of $controller).
        ctrlFn = $controller('ClmEventTableCtrl', deps, true);
        ctrlFn.instance.event = {$id: 'someEventId'};
        ctrlFn.instance.profile = {$id: 'bob'};
        ctrlFn.instance.participants = [];
        ctrlFn.instance.tasks = [];
        ctrlFn.instance.progress = {$id: 'someEventId', $watch: jasmine.createSpy('progressWatch')};
        ctrlFn.instance.solutions = {$id: 'someEventId'};

        ctrlFn.instance.participants.$getRecord = function(id) {
          return this.find(function(p) {
            return p.$id === id;
          });
        };
        ctrlFn.instance.participants.$watch = jasmine.createSpy('participantsWatch');
        ctrlFn.instance.tasks.$watch = jasmine.createSpy('tasksWatch');
        ctrlFn.instance.tasks.$getRecord = jasmine.createSpy('tasksWatch');
      });

      it('should initiate participant and tasks views', function() {
        var ctrl = ctrlFn();

        expect(ctrl.participantsView).toEqual([]);
        expect(ctrl.visibleTasks).toEqual([]);
        expect(ctrl.taskCompletion).toEqual({});
        expect(ctrl.currentUserParticipant).toBeUndefined();
        expect(ctrl.orderOptions.key).toBeUndefined();
        expect(ctrl.orderOptions.reversed).toBe(false);
        expect(ctrl.pagerOptions.rowCount).toBe(0);
        expect(ctrl.pagerOptions.range.start).toBe(0);
        expect(ctrl.pagerOptions.range.end).toBe(0);
      });

      it('should update pager option when resources are loaded', function() {
        var ctrl;

        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn.instance.participants.push({$id: 'alice', user: {}});

        ctrl = ctrlFn();
        spyOn(ctrl.pagerOptions, 'setRowCount').and.callThrough();
        $rootScope.$apply();

        expect(ctrl.pagerOptions.rowCount).toBe(1);
        expect(ctrl.pagerOptions.setRowCount).toHaveBeenCalledWith(1);
      });

      it('should update the participant view when resources are loaded', function() {
        var ctrl;

        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn.instance.participants.push({$id: 'alice', user: {}});

        ctrl = ctrlFn();
        spyOn(ctrl.pagerOptions, 'setRowCount').and.callThrough();
        $rootScope.$apply();

        expect(ctrl.participantsView.length).toBe(1);
        expect(ctrl.participantsView[0].$id).toBe('alice');
      });

      it('should update the list of visible tasks', function() {
        var ctrl;

        ctrlFn.instance.tasks.push({$id: 'someTaskId'});
        ctrlFn.instance.tasks.push({$id: 'someClosedTaskId', closedAt: 123456});
        ctrlFn.instance.tasks.push({$id: 'someHiddenTaskId', hidden: true});
        ctrlFn.instance.tasks.push({$id: 'someArchivedTaskId', archived: true});

        ctrl = ctrlFn();
        $rootScope.$apply();

        expect(ctrl.visibleTasks.length).toBe(2);
        expect(ctrl.visibleTasks[0].$id).toBe('someTaskId');
        expect(ctrl.visibleTasks[1].$id).toBe('someClosedTaskId');
      });

      it('should set current user participation state', function() {
        var ctrl;

        ctrlFn.instance.participants.push({$id: 'bob', user: {}});

        ctrl = ctrlFn();
        $rootScope.$apply();

        expect(ctrl.currentUserParticipant).toBeDefined();
        expect(ctrl.currentUserParticipant.$id).toBe('bob');
      });

      it('should load the current user solution progress at SingPath', function() {
        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn();

        expect(deps.clmDataStore.singPath.queuedSolutions).toHaveBeenCalledWith('bob');
      });

      it('should set tasks\' completion rates', function() {
        var ctrl;

        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn.instance.participants.push({$id: 'alice', user: {}});
        ctrlFn.instance.tasks.push({$id: 'someTaskId'});
        ctrlFn.instance.tasks.push({$id: 'someOtherTaskId'});
        ctrlFn.instance.tasks.push({$id: 'someLastTaskId'});
        ctrlFn.instance.tasks.push({$id: 'someArchivedTaskId', archived: true});
        ctrlFn.instance.progress.bob = {
          someTaskId: {completed: true},
          someOtherTaskId: {completed: true}
        };
        ctrlFn.instance.progress.alice = {
          someTaskId: {completed: true}
        };

        ctrl = ctrlFn();
        $rootScope.$apply();

        expect(ctrl.taskCompletion.someTaskId).toBe(100);
        expect(ctrl.taskCompletion.someOtherTaskId).toBe(50);
        expect(ctrl.taskCompletion.someLastTaskId).toBe(0);
        expect(ctrl.taskCompletion.someArchivedTaskId).toBeUndefined();
      });

      it('should update task view when the tasks get updated', function() {
        var ctrl = ctrlFn();
        var onTaskUpdate;

        $rootScope.$apply();

        onTaskUpdate = ctrl.tasks.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ctrlFn.instance.tasks.push({$id: 'someTaskId'});
        ctrlFn.instance.tasks.push({$id: 'someClosedTaskId', closedAt: 123456});
        ctrlFn.instance.tasks.push({$id: 'someHiddenTaskId', hidden: true});
        ctrlFn.instance.tasks.push({$id: 'someArchivedTaskId', archived: true});

        onTaskUpdate.forEach(function(fn) {
          fn();
        });

        expect(ctrl.visibleTasks.length).toBe(2);
        expect(ctrl.visibleTasks[0].$id).toBe('someTaskId');
        expect(ctrl.visibleTasks[1].$id).toBe('someClosedTaskId');
      });

      it('should update task completion rate when the tasks get updated', function() {
        var ctrl, onTaskUpdate;

        ctrlFn.instance.tasks.push({$id: 'someTaskId'});
        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn.instance.progress.bob = {
          someTaskId: {completed: true}
        };

        ctrl = ctrlFn();
        $rootScope.$apply();

        onTaskUpdate = ctrl.tasks.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ctrl.tasks.push({$id: 'someOtherTaskId'});

        onTaskUpdate.forEach(function(fn) {
          fn();
        });

        expect(ctrl.taskCompletion.someOtherTaskId).toBe(0);
      });

      it('should update task completion rate when the progress get updated', function() {
        var ctrl, onProgressUpdate;

        ctrlFn.instance.tasks.push({$id: 'someTaskId'});
        ctrlFn.instance.participants.push({$id: 'bob', user: {}});

        ctrl = ctrlFn();
        $rootScope.$apply();

        onProgressUpdate = ctrl.progress.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ctrl.progress.bob = {
          someTaskId: {completed: true}
        };

        onProgressUpdate.forEach(function(fn) {
          fn();
        });

        expect(ctrl.taskCompletion.someTaskId).toBe(100);
      });

      it('should update task completion rate when the participant list get updated', function() {
        var ctrl, onParticpantsUpdate;

        ctrlFn.instance.tasks.push({$id: 'someTaskId'});
        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn.instance.progress.bob = {
          someTaskId: {completed: true}
        };

        ctrl = ctrlFn();
        $rootScope.$apply();

        onParticpantsUpdate = ctrl.participants.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ctrlFn.instance.participants.push({$id: 'alice', user: {}});

        onParticpantsUpdate.forEach(function(fn) {
          fn();
        });

        expect(ctrl.taskCompletion.someTaskId).toBe(50);
      });

      it('should update the participant view when participants get updated', function() {
        var ctrl, onParticpantsUpdate;

        ctrlFn.instance.participants.push({$id: 'bob', user: {}});
        ctrlFn.instance.participants.push({$id: 'alice', user: {}});

        ctrl = ctrlFn();
        $rootScope.$apply();

        onParticpantsUpdate = ctrl.participants.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ctrlFn.instance.participants.push({$id: 'john', user: {}});

        onParticpantsUpdate.forEach(function(fn) {
          fn();
        });

        expect(ctrl.participantsView.length).toBe(2);
        expect(ctrl.participantsView[1].$id).toBe('john');
        expect(ctrl.pagerOptions.rowCount).toBe(2);
        expect(ctrl.pagerOptions.range.start).toBe(0);
        expect(ctrl.pagerOptions.range.end).toBe(2);
      });

      it('should update the current user participant state when the participants get updated', function() {
        var ctrl, onParticpantsUpdate;

        ctrlFn.instance.participants.push({$id: 'alice', user: {}});

        ctrl = ctrlFn();
        $rootScope.$apply();

        onParticpantsUpdate = ctrl.participants.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ctrlFn.instance.participants.push({$id: 'bob', user: {}});

        onParticpantsUpdate.forEach(function(fn) {
          fn();
        });

        expect(ctrl.currentUserParticipant).toBeDefined();
        expect(ctrl.currentUserParticipant.$id).toBe('bob');
      });

      it('should update the user participants state when the user SingPath solution progress is updated', function() {
        var ctrl, onSolutionUpdate;

        ctrlFn.instance.participants.push({$id: 'alice', user: {}});

        ctrl = ctrlFn();
        $rootScope.$apply();

        queuedSolutions.$watch.calls.allArgs().forEach(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          callback();
          return callback;
        });

        expect(deps.clmDataStore.events.updateCurrentUserProfile).toHaveBeenCalledWith(
          ctrl.event,
          ctrl.tasks,
          ctrl.currentUserSolutions,
          ctrl.profile
        );
      });

      describe('orderBy', function() {

        it('should switch order when called with the same order key', function() {
          var ctrl;

          ctrlFn.instance.participants.push({$id: 'john', user: {displayName: 'john'}});
          ctrlFn.instance.participants.push({$id: 'alice', user: {displayName: 'alice'}});

          ctrl = ctrlFn();
          $rootScope.$apply();

          expect(ctrl.participantsView.length).toBe(2);
          expect(ctrl.orderOptions.reversed).toBe(false);
          expect(ctrl.participantsView[0].$id).toBe('alice');

          ctrl.orderBy(ctrl.orderOptions.key);
          expect(ctrl.orderOptions.reversed).toBe(true);
          expect(ctrl.participantsView[0].$id).toBe('john');

          ctrl.orderBy(ctrl.orderOptions.key);
          expect(ctrl.orderOptions.reversed).toBe(false);
          expect(ctrl.participantsView[0].$id).toBe('alice');
        });

        it('should change order key', function() {
          var ctrl;

          ctrlFn.instance.participants.push({$id: 'john', user: {displayName: 'john'}});
          ctrlFn.instance.participants.push({$id: 'alice', user: {displayName: 'alice'}});
          ctrlFn.instance.tasks.push({$id: 'someTaskId'});
          ctrlFn.instance.tasks.push({$id: 'someOtherTaskId'});
          ctrlFn.instance.progress.john = {
            someOtherTaskId: {completed: true}
          };
          ctrlFn.instance.progress.alice = {
            someTaskId: {completed: true}
          };

          ctrl = ctrlFn();
          $rootScope.$apply();

          ctrl.orderBy('someTaskId');
          expect(ctrl.orderOptions.reversed).toBe(false);
          expect(ctrl.participantsView[0].$id).toBe('john');

          ctrl.orderBy('someOtherTaskId');
          expect(ctrl.orderOptions.reversed).toBe(false);
          expect(ctrl.participantsView[0].$id).toBe('alice');

          ctrl.orderBy('someOtherTaskId');
          expect(ctrl.orderOptions.reversed).toBe(true);
          expect(ctrl.participantsView[0].$id).toBe('john');
        });

      });

    });

    describe('ClmEventRankTableCtrl', function() {
      var deps, ctrlFn, ranking;

      beforeEach(function() {
        deps = {
          $scope: jasmine.createSpyObj('$scope', ['$on']),
          clmDataStore: {
            events: jasmine.createSpyObj('events', ['getRanking'])
          }
        };

        ranking = [];
        ranking.$id = 'someEvent';
        ranking.$destroy = jasmine.createSpy('rankingDestroy');
        ranking.$watch = jasmine.createSpy('rankingWatch');

        deps.clmDataStore.events.getRanking.and.returnValue($q.when(ranking));

        // Binding the directive attributes to the controller instance
        // (undocumented feature of $controller).
        ctrlFn = $controller('ClmEventRankTableCtrl', deps, true);
        ctrlFn.instance.event = {$id: 'someEventId'};
        ctrlFn.instance.profile = {$id: 'bob'};
      });

      it('should initiate ranking view', function() {
        var ctrl = ctrlFn();

        expect(ctrl.rankingView).toEqual([]);
        expect(ctrl.currentUserRanking).toBeUndefined();
        expect(ctrl.orderOpts.length).toBe(2);
        expect(ctrl.orderOpts[0].key).toBe('total');
        expect(ctrl.orderOpts[0].reversed).toBe(true);
        expect(ctrl.orderOpts[1].key).toBe('name');
        expect(ctrl.orderOpts[1].reversed).toBe(false);
        expect(ctrl.pagerOpts.range.start).toBe(0);
        expect(ctrl.pagerOpts.range.end).toBe(0);
      });

      it('should update the pager row count when the ranking is loaded', function() {
        var ctrl = ctrlFn();

        spyOn(ctrl.pagerOpts, 'setRowCount').and.callThrough();

        ranking.push({$id: 'alice', user: {displayName: 'alice'}, total: 2});
        $rootScope.$apply();

        expect(ctrl.pagerOpts.rowCount).toBe(1);
        expect(ctrl.pagerOpts.setRowCount).toHaveBeenCalledWith(1);
      });

      it('should update ranking view when the ranking is loaded', function() {
        var ctrl = ctrlFn();
        var onRankingUpdate;

        spyOn(ctrl.pagerOpts, 'setRowCount').and.callThrough();

        $rootScope.$apply();
        expect(ctrl.rankingView.length).toBe(0);

        onRankingUpdate = ctrl.ranking.$watch.calls.allArgs().map(function(args) {
          var callback = args[0];

          expect(callback).toEqual(jasmine.any(Function));
          return callback;
        });

        ranking.push({$id: 'alice', user: {displayName: 'alice'}, total: 2});
        onRankingUpdate.map(function(fn) {
          fn();
        });

        expect(ctrl.rankingView.length).toBe(1);
      });

    });

    describe('clmRowPerPage', function() {
      var clmRowPerPage;

      beforeEach(inject(function(_clmRowPerPage_) {
        clmRowPerPage = _clmRowPerPage_;
      }));

      it('should set default value to 25', function() {
        expect(clmRowPerPage.value).toBe(50);
      });

      it('should hold the suggested list of value option', function() {
        expect(clmRowPerPage.options).toEqual(jasmine.any(Array));
      });

      describe('set', function() {

        it('should set the row per page value', function() {
          clmRowPerPage.set(10);
          expect(clmRowPerPage.value).toBe(10);
        });

        it('should parse the value to an integer', function() {
          clmRowPerPage.set('10');
          expect(clmRowPerPage.value).toBe(10);
        });

      });

      describe('onChange', function() {

        it('should register callback function for the value update event', function() {
          var cb = jasmine.createSpy('myCallback');
          var clean = clmRowPerPage.onChange(cb);

          try {
            clmRowPerPage.set(10);
            expect(cb).toHaveBeenCalledWith(10);
          } finally {
            clean();
          }
        });

        it('should return a function to deregister the callback function', function() {
          var cb = jasmine.createSpy('myCallback');
          var clean = clmRowPerPage.onChange(cb);

          clean();
          clmRowPerPage.set(10);
          expect(cb).not.toHaveBeenCalled();
        });

      });

    });

    describe('clmPagerOption', function() {
      var clmPagerOption, clmRowPerPage;

      beforeEach(inject(function(_clmPagerOption_, _clmRowPerPage_) {
        clmPagerOption = _clmPagerOption_;
        clmRowPerPage = _clmRowPerPage_;
      }));

      it('should initiate row count and range', function() {
        var opts = clmPagerOption();

        expect(opts.rowCount).toBe(0);
        expect(opts.range.start).toBe(0);
        expect(opts.range.end).toBe(0);
      });

      describe('setRowCount', function() {
        var opts;

        beforeEach(function() {
          opts = clmPagerOption();
        });

        afterEach(function() {
          opts.$destroy();
        });

        it('should update rowCount', function() {
          opts.setRowCount(1);
          expect(opts.rowCount).toBe(1);
        });

        it('should update range', function() {
          opts.setRowCount(1);
          expect(opts.range.end).toBe(1);
        });

      });

      describe('setRange', function() {
        var opts;

        beforeEach(function() {
          opts = clmPagerOption();
          clmRowPerPage.value = 5;
        });

        afterEach(function() {
          opts.$destroy();
        });

        it('should update range start', function() {
          opts.rowCount = 10;

          [0, 5, 10].forEach(function(i) {
            opts.setRange(i);
            expect(opts.range.start).toBe(i);
          });
        });

        it('should limit range start to positive number', function() {
          opts.rowCount = 5;
          [0, -1, -5].forEach(function(i) {
            opts.setRange(i);
            expect(opts.range.start).toBe(0);
          });
        });

        it('should limit range start to rowCount', function() {
          opts.rowCount = 5;
          [5, 6, 7].forEach(function(i) {
            opts.setRange(i);
            expect(opts.range.start).toBe(5);
          });
        });

        it('should limit range start to a start of a page', function() {
          opts.rowCount = 5;
          [0, 1, 2, 3, 4].forEach(function(i) {
            opts.setRange(i);
            expect(opts.range.start).toBe(0);
          });
        });

        it('should derive the range end', function() {
          opts.rowCount = 20;
          [0, 15].forEach(function(i) {
            opts.setRange(i);
            expect(opts.range.end).toBe(i + clmRowPerPage.value);
          });
        });

        it('should limit range end to rowCount', function() {
          opts.rowCount = 9;
          [5, 10].forEach(function(i) {
            opts.setRange(i);
            expect(opts.range.end).toBe(9);
          });
        });

      });

      describe('onChange', function() {
        var cb, opts, clean;

        beforeEach(function() {
          cb = jasmine.createSpy('myCallback');
          opts = clmPagerOption();
          clean = opts.onChange(cb);
        });

        afterEach(function() {
          clean();
          opts.$destroy();
        });

        it('should register a cb that will be called when rowCount is reset', function() {
          opts.setRowCount(1);
          expect(cb).toHaveBeenCalledWith(opts);
        });

        it('should register a cb that will be called when range is reset', function() {
          opts.setRange(5);
          expect(cb).toHaveBeenCalledWith(opts);
        });

        it('should register a cb that will be called when range is reset via a clmRowPerPage event', function() {
          clmRowPerPage.set(5);
          expect(cb).toHaveBeenCalledWith(opts);
        });

      });
    });

    describe('ClmPagerCtrl', function() {
      var deps, ctrlFn, clmRowPerPage;

      beforeEach(inject(function(clmPagerOption, _clmRowPerPage_) {
        clmRowPerPage = _clmRowPerPage_;
        clmRowPerPage.value = 5;
        deps = {clmRowPerPage: clmRowPerPage};

        // Binding the directive attributes to the controller instance
        // (undocumented feature of $controller).
        ctrlFn = $controller('ClmPagerCtrl', deps, true);
        ctrlFn.instance.options = clmPagerOption();

        spyOn(ctrlFn.instance.options, 'setRange').and.callThrough();
      }));

      it('should initiate rowPerPage', function() {
        var ctrl = ctrlFn();

        expect(ctrl.rowPerPage).toBe(clmRowPerPage);
      });

      describe('nextPage', function() {
        it('should set range start from the what was the range end', function() {
          var ctrl = ctrlFn();

          ctrl.options.rowCount = 10;
          ctrl.options.range = {start: 0, end: 5};

          ctrl.nextPage(ctrl.options);

          expect(ctrl.options.setRange).toHaveBeenCalledWith(5);
        });
      });

      describe('prevPage', function() {
        it('should set range start to value in the previous page', function() {
          var ctrl = ctrlFn();

          ctrl.options.rowCount = 10;
          ctrl.options.range = {start: 5, end: 10};

          ctrl.prevPage(ctrl.options);

          expect(ctrl.options.setRange).toHaveBeenCalledWith(4);
        });
      });

      describe('firstPage', function() {
        it('should set range start from the what was the range end', function() {
          var ctrl = ctrlFn();

          ctrl.options.rowCount = 10;
          ctrl.options.range = {start: 10, end: 10};

          ctrl.firstPage(ctrl.options);

          expect(ctrl.options.setRange).toHaveBeenCalledWith(0);
        });
      });

      describe('lastPage', function() {
        it('should set range start to a value in the last page', function() {
          var ctrl = ctrlFn();

          ctrl.options.rowCount = 10;
          ctrl.options.range = {start: 0, end: 5};

          ctrl.lastPage(ctrl.options);

          expect(ctrl.options.setRange).toHaveBeenCalledWith(10);
        });
      });
    });

  });

})();
