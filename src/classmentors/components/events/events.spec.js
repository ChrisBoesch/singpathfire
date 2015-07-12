/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('clm class mentors home components', function() {
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

      describe('completed', function() {

        it('should return 100 if there is no participants', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          expect(ctrl.completed('12345')).toBe(0);
        });

        it('should return percentage of participants having completed the task', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          ctrl.participants = {
            $id: 'eventId',
            someParticipantId: {},
            someOtherParticipantId: {}
          };
          ctrl.progress = {
            someParticipantId: {
              someTaskId: {completed: true}
            },
            someOtherParticipantId: {
              someOtherTaskId: {completed: true}
            }
          };
          expect(ctrl.completed('someTaskId', ctrl.participants, ctrl.progress)).toBe(50);
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

        it('should return true if the user is not registered to any services', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var task = {serviceId: 'codeSchool'};
          var profile = {$id: 'bob'};

          expect(ctrl.mustRegister(task, profile)).toBe(true);
        });

      });

      describe('update', function() {

        it('should update the current user task completeness', function() {
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
        });

        it('should show success message on success', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.when({}));

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(deps.spfAlert.success).toHaveBeenCalled();
        });

        it('should should set currentUserStats on success', function() {
          var ctrl = $controller('ViewEventCtrl', deps);
          var expected = {};

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue(
            $q.when(expected)
          );

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(ctrl.currentUserStats).toBe(expected);
        });

        it('should show error message on failure', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          deps.clmDataStore.events.updateCurrentUserProfile.and.returnValue($q.reject());

          ctrl.update({}, {}, {});
          $rootScope.$apply();

          expect(deps.spfAlert.error).toHaveBeenCalled();
        });

      });

      describe('orderBy', function() {

        it('should setup orderKey, previousOrderKey and reverseOrder', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          expect(ctrl.orderKey).toBe('total');
          expect(ctrl.previousOrderKey).toBe('user.displayName');
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

        it('should set new key and previousOrderKey, and reset reverseOrder', function() {
          var ctrl = $controller('ViewEventCtrl', deps);

          ctrl.reverseOrder = false;
          ctrl.orderKey = 'originalKey';
          ctrl.orderBy('newKey');

          expect(ctrl.orderKey).toBe('newKey');
          expect(ctrl.previousOrderKey).toBe('originalKey');
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

  });

})();
