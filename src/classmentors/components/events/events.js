(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.events, {
        templateUrl: 'classmentors/components/events/events-view-list.html',
        controller: 'ClassMentorsEventList',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'classMentorsEventListRsolver',
            function(classMentorsEventListRsolver) {
              return classMentorsEventListRsolver();
            }
          ]
        }
      }).

      when(routes.newEvent, {
        templateUrl: 'classmentors/components/events/events-view-new.html',
        controller: 'NewEventCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'newEventCtrlInitialData',
            function(newEventCtrlInitialData) {
              return newEventCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.oneEvent, {
        templateUrl: 'classmentors/components/events/events-view-event.html',
        controller: 'ViewEventCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'viewEventCtrlInitialData',
            function(viewEventCtrlInitialData) {
              return viewEventCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.editEvent, {
        templateUrl: 'classmentors/components/events/events-view-event-edit.html',
        controller: 'EditCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'editCtrlInitialData',
            function(editCtrlInitialData) {
              return editCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.addEventTask, {
        templateUrl: 'classmentors/components/events/events-view-event-task-form.html',
        controller: 'AddEventTaskCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'addEventTaskCtrlInitialData',
            function(addEventTaskCtrlInitialData) {
              return addEventTaskCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.editEventTask, {
        templateUrl: 'classmentors/components/events/events-view-event-task-form.html',
        controller: 'EditEventTaskCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'editEventTaskCtrlInitialData',
            function(editEventTaskCtrlInitialData) {
              return editEventTaskCtrlInitialData();
            }
          ]
        }
      })

      ;
    }
  ]).

  /**
   * Used to resolve `initialData` of `SomeCtrl`.
   *
   */
  factory('classMentorsEventListRsolver', [
    '$q',
    'spfAuth',
    'clmDataStore',
    function classMentorsEventListRsolverFactory($q, spfAuth, clmDataStore) {
      return function classMentorsEventRsolver() {
        return $q.all({
          events: clmDataStore.events.list(),
          auth: spfAuth
        });
      };
    }
  ]).

  /**
   * SomeCtrl
   *
   */
  controller('ClassMentorsEventList', [
    'initialData',
    'spfNavBarService',
    'urlFor',
    function ClassMentorsEventList(initialData, spfNavBarService, urlFor) {
      this.events = initialData.events;
      this.auth = initialData.auth;

      spfNavBarService.update(
        'Events',
        undefined, [{
          title: 'New event',
          url: '#' + urlFor('newEvent'),
          icon: 'add-circle-outline'
        }]
      );
    }
  ]).

  /**
   * Used to resolve `initialData` of `NewEventCtrl`.
   *
   */
  factory('newEventCtrlInitialData', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'clmDataStore',
    function newEventCtrlInitialDataFactory($q, spfAuth, spfAuthData, clmDataStore) {
      return function newEventCtrlInitialData() {
        var profilePromise;
        var errLoggedOff = new Error('The user should be logged in to create an event.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = clmDataStore.currentUserProfile().then(function(profile) {
          if (profile && profile.$value === null) {
            return clmDataStore.initProfile();
          }

          return profile;
        });

        return $q.all({
          auth: spfAuth,
          currentUser: spfAuthData.user(),
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * NewEventCtrl
   *
   */
  controller('NewEventCtrl', [
    '$q',
    '$location',
    'initialData',
    'urlFor',
    'spfFirebase',
    'spfAuthData',
    'spfAlert',
    'spfNavBarService',
    'clmDataStore',
    function NewEventCtrl(
      $q, $location, initialData, urlFor, spfFirebase, spfAuthData, spfAlert, spfNavBarService, clmDataStore
    ) {
      var self = this;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;

      this.creatingEvent = false;
      this.profileNeedsUpdate = !this.currentUser.$completed();

      spfNavBarService.update(
        'New Events',
        {
          title: 'Events',
          url: '#' + urlFor('events')
        }, []
      );

      function cleanProfile() {
        self.currentUser.country = spfFirebase.cleanObj(self.currentUser.country);
        self.currentUser.school = spfFirebase.cleanObj(self.currentUser.school);
      }

      function updateProfile(profile) {
        spfAlert.success('Profile setup.');
        self.profile = profile;
        self.profileNeedsUpdate = !self.currentUser.$completed();
      }
      this.save = function(currentUser, newEvent, password) {
        var next;

        self.creatingEvent = true;

        if (!self.profile) {
          cleanProfile();
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return clmDataStore.initProfile();
          }).then(updateProfile);
        } else if (self.profileNeedsUpdate) {
          cleanProfile();
          next = self.currentUser.$save().then(function() {
            return clmDataStore.currentUserProfile();
          }).then(updateProfile);
        } else {
          next = $q.when();
        }

        next.then(function() {
          var data = Object.assign({
            owner: {
              publicId: currentUser.publicId,
              displayName: currentUser.displayName,
              gravatar: currentUser.gravatar
            },
            createdAt: {
              '.sv': 'timestamp'
            }
          }, newEvent);

          return clmDataStore.events.create(data, password);
        }).then(function() {
          spfAlert.success('New event created.');
          $location.path(urlFor('events'));
        }).catch(function(e) {
          spfAlert.error(e.toString());
        }).finally(function() {
          self.creatingEvent = false;
        });
      };

      this.reset = function(eventForm) {
        this.newEvent = {
          data: {},
          password: ''
        };

        if (eventForm && eventForm.$setPristine) {
          eventForm.$setPristine();
        }
      };

      this.reset();
    }
  ]).

  /**
   * Used to resolve `initialData` of `ViewEventCtrl`.
   *
   */
  factory('viewEventCtrlInitialData', [
    '$q',
    '$route',
    'spfAuth',
    'spfAuthData',
    'clmDataStore',
    function viewEventCtrlInitialDataFactory($q, $route, spfAuth, spfAuthData, clmDataStore) {
      return function viewEventCtrlInitialData() {
        var errNoEvent = new Error('Event not found');
        var eventId = $route.current.params.eventId;

        var eventPromise = clmDataStore.events.get(eventId).then(function(event) {
          if (event.$value === null) {
            return $q.reject(errNoEvent);
          }
          return event;
        });

        return $q.all({
          currentUser: spfAuthData.user(),
          event: eventPromise,
          participants: clmDataStore.events.participants(eventId)
        });
      };
    }
  ]).

  /**
   * ViewEventCtrl
   *
   */
  controller('ViewEventCtrl', [
    'initialData',
    '$q',
    '$log',
    '$document',
    '$mdDialog',
    'spfAlert',
    'urlFor',
    'spfNavBarService',
    'clmDataStore',
    'clmServicesUrl',
    function ViewEventCtrl(
      initialData, $q, $log, $document, $mdDialog, spfAlert, urlFor, spfNavBarService, clmDataStore, clmServicesUrl
    ) {
      var self = this;
      var linkers;

      this.currentUser = initialData.currentUser;
      this.event = initialData.event;
      this.participants = initialData.participants;

      updateNavbar();

      this.promptForLink = function(eventId, taskId, task, participant) {
        $mdDialog.show({
          parent: $document.body,
          templateUrl: 'classmentors/components/events/events-view-provide-link.html',
          controller: DialogController,
          controllerAs: 'ctrl'
        });

        function DialogController() {
          this.task = task;
          if (
            participant &&
            participant.tasks &&
            participant.tasks[taskId] &&
            participant.tasks[taskId].solution
          ) {
            this.solution = participant.tasks[taskId].solution;
          }

          this.save = function(link) {
            clmDataStore.events.submitLink(eventId, taskId, participant.$id, link).then(function() {
              $mdDialog.hide();
              spfAlert.success('Link is saved and the the task is completed');
            }).catch(function(err) {
              $log.error(err);
              spfAlert.error('Failed to save the link');
              return err;
            });
          };

          this.cancel = function() {
            $mdDialog.hide();
          };
        }
      };

      function updateNavbar() {
        spfNavBarService.update(
          self.event.title, {
            title: 'Events',
            url: '#' + urlFor('events')
          }, getOptions()
        );
      }

      function getOptions() {
        var options = [];

        if (!self.currentUser || !self.currentUser.publicId) {
          return options;
        }

        // add join/leave button
        if (self.participants.$indexFor(self.currentUser.publicId) > -1) {
          options.push({
            title: 'Leave',
            onClick: function() {
              clmDataStore.events.leave(self.event.$id);
              updateNavbar();
            },
            icon: 'highlight-remove'
          });
        } else {
          options.push({
            title: 'Join',
            onClick: promptPassword,
            icon: 'add-circle-outline'
          });
        }

        // Add edit and update button
        if (self.event.owner.publicId === self.currentUser.publicId) {
          options.push({
            title: 'Edit',
            url: '#' + urlFor('editEvent', {eventId: self.event.$id}),
            icon: 'create'
          });
          options.push({
            title: 'Update',
            onClick: function() {
              self.updateAll();
            },
            icon: 'loop'
          });
        }

        return options;
      }

      function promptPassword() {
        $mdDialog.show({
          parent: $document.body,
          templateUrl: 'classmentors/components/events/events-view-password.html',
          controller: DialogController,
          controllerAs: 'ctrl'
        });

        function DialogController() {
          this.pw = '';

          this.join = function(pw) {
            clmDataStore.events.join(self.event.$id, pw).then(function() {
              spfAlert.success('You joined this event');
              clmDataStore.events.updateProgress(self.event, self.currentUser.publicId);
              updateNavbar();
              $mdDialog.hide();
            }).catch(function(err) {
              spfAlert.error('Failed to add you: ' + err);
            });
            this.closeDialog();
          };

          this.closeDialog = function() {
            $mdDialog.hide();
          };
        }
      }

      this.update = function() {
        return clmDataStore.events.updateProgress(self.event, self.currentUser.publicId).then(function() {
          spfAlert.success('User progress updated');
        }).catch(function(err) {
          $log.error(err);
          spfAlert.error('Failed to update progress');
        });
      };

      this.updateAll = function() {
        return $q.all(Object.keys(this.participants).filter(function(key) {
          return key && key[0] !== '$';
        }).map(function(index) {
          return self.participants[index];
        }).reduce(function(all, participant) {
          all[participant.$id] = clmDataStore.events.updateProgress(self.event, participant.$id);
          return all;
        }, {}));
      };

      this.completed = function(taskId) {
        var participants, count;

        if (!this.participants) {
          return 100;
        }

        participants = Object.keys(this.participants).filter(function(id) {
          return id && id[0] !== '$';
        }).map(function(id) {
          return self.participants[id];
        });

        count = participants.length;
        if (count === 0) {
          return 100;
        }

        return participants.reduce(function(completed, participant) {
          if (
            participant &&
            participant.tasks &&
            participant.tasks[taskId] &&
            participant.tasks[taskId].completed
          ) {
            completed += 1;
          }

          return completed;
        }, 0) / count * 100;
      };

      this.startLink = function(task) {
        if (
          !task ||
          !task.serviceId ||
          !linkers[task.serviceId]
        ) {
          return '';
        }

        return linkers[task.serviceId](task);
      };

      function defaultLinker(task) {
        if (
          !task ||
          !task.badge ||
          !task.badge.url
        ) {
          return '#/profile';
        }

        return task.badge.url;
      }

      linkers = {
        codeSchool: defaultLinker,
        codeCombat: defaultLinker,

        singPath: function(task) {
          if (!task || task.serviceId !== 'singPath') {
            return '';
          }

          if (
            !task.singPathProblem ||
            !task.singPathProblem.path ||
            !task.singPathProblem.path.id ||
            !task.singPathProblem.level ||
            !task.singPathProblem.level.id ||
            !task.singPathProblem.problem ||
            !task.singPathProblem.problem.id
          ) {
            return clmServicesUrl.singPath;
          }

          return (
            clmServicesUrl.singPath + '/#' +
            '/paths/' + task.singPathProblem.path.id +
            '/levels/' + task.singPathProblem.level.id +
            '/problems/' + task.singPathProblem.problem.id + '/play'
          );
        }
      };
    }
  ]).

  /**
   * Minimal resolver for `EditCtrl` and `AddEventTaskCtrl`.
   *
   * Load the event data and the current user data.
   *
   * The promise will resolved to an error if the the current user
   * is not the owner of the event.
   *
   */
  factory('baseEditCtrlInitialData', [
    '$q',
    '$route',
    'spfAuthData',
    'clmDataStore',
    function baseEditCtrlInitialDataFactory($q, $route, spfAuthData, clmDataStore) {
      return function baseEditCtrlInitialData() {
        var errNoEvent = new Error('Event not found');
        var errNotAuthaurized = new Error('You cannot edit this event');
        var eventId = $route.current.params.eventId;

        var eventPromise = clmDataStore.events.get(eventId).then(function(event) {
          if (event.$value === null) {
            return $q.reject(errNoEvent);
          }
          return event;
        });

        var data = {
          currentUser: spfAuthData.user(),
          event: eventPromise
        };

        data.canEdit = $q.all({
          currentUser: spfAuthData.user(),
          event: eventPromise
        }).then(function(result) {
          if (
            !result.currentUser.publicId ||
            !result.event.owner ||
            !result.event.owner.publicId ||
            result.event.owner.publicId !== result.currentUser.publicId
          ) {
            return $q.reject(errNotAuthaurized);
          } else {
            return result;
          }
        });

        return data;
      };
    }
  ]).

  /**
   * Used to resolve `initialData` for `EditCtrl`
   *
   */
  factory('editCtrlInitialData', [
    '$q',
    'baseEditCtrlInitialData',
    function($q, baseEditCtrlInitialData) {
      return function editCtrlInitialData() {
        return $q.all(baseEditCtrlInitialData());
      };
    }
  ]).

  /**
   * EditCtrl
   *
   */
  controller('EditCtrl', [
    'initialData',
    'spfNavBarService',
    'urlFor',
    'spfAlert',
    'clmDataStore',
    function EditCtrl(initialData, spfNavBarService, urlFor) {

      this.event = initialData.event;

      spfNavBarService.update(
        'Edit', [{
          title: 'Events',
          url: '#' + urlFor('events')
        }, {
          title: this.event.title,
          url: '#' + urlFor('oneEvent', {eventId: this.event.$id})
        }], [{
          title: 'New Challenge',
          url: '#' + urlFor('addEventTask', {eventId: this.event.$id}),
          icon: 'create'
        }]
      );
    }
  ]).

  factory('addEventTaskCtrlInitialData', [
    '$q',
    'baseEditCtrlInitialData',
    'clmDataStore',
    function addEventTaskCtrlInitialData($q, baseEditCtrlInitialData, clmDataStore) {
      return function addEventTaskCtrlInitialData() {
        var data = baseEditCtrlInitialData();

        data.badges = clmDataStore.badges.all();
        data.singPath = $q.all({
          paths: clmDataStore.singPath.paths(),
          levels: [],
          problems: []
        });
        return $q.all(data);
      };
    }
  ]).

  /**
   * AddEventTaskCtrl
   *
   */
  controller('AddEventTaskCtrl', [
    'initialData',
    '$location',
    '$log',
    'spfFirebase',
    'spfAlert',
    'urlFor',
    'spfNavBarService',
    'clmDataStore',
    function AddEventTaskCtrl(
      initialData, $location, $log, spfFirebase, spfAlert, urlFor, spfNavBarService, clmDataStore
    ) {
      var self = this;

      this.event = initialData.event;
      this.badges = initialData.badges;
      this.task = {};
      this.singPath = initialData.singPath;
      this.savingTask = false;

      spfNavBarService.update(
        'New Challenge', [{
          title: 'Events',
          url: '#' + urlFor('events')
        }, {
          title: this.event.title,
          url: '#' + urlFor('oneEvent', {eventId: this.event.$id})
        }, {
          title: 'Challenges',
          url: '#' + urlFor('editEvent', {eventId: this.event.$id})
        }]
      );

      this.loadLevels = function(selected) {
        return clmDataStore.singPath.levels(selected.path.id).then(function(levels) {
          self.singPath.levels = levels;
        });
      };

      this.loadProblems = function(selected) {
        return clmDataStore.singPath.problems(selected.path.id, selected.level.id).then(function(problems) {
          self.singPath.problems = problems;
        });
      };

      this.saveTask = function(event, _, task, taskType) {
        var copy = spfFirebase.cleanObj(task);

        if (taskType === 'linkPattern') {
          delete copy.badge;
          delete copy.serviceId;
          delete copy.singPathProblem;
        } else if (copy.serviceId === 'singPath') {
          delete copy.badge;
          if (copy.singPathProblem) {
            copy.singPathProblem.path = spfFirebase.cleanObj(task.singPathProblem.path);
            copy.singPathProblem.level = spfFirebase.cleanObj(task.singPathProblem.level);
            copy.singPathProblem.problem = spfFirebase.cleanObj(task.singPathProblem.problem);
          }
        } else {
          delete copy.singPathProblem;
          copy.badge = spfFirebase.cleanObj(task.badge);
        }

        if (!copy.link) {
          // delete empty link. Can't be empty string
          delete copy.link;
        }

        self.creatingTask = true;
        clmDataStore.events.addTask(event.$id, copy).then(function() {
          spfAlert.success('Task created');
          $location.path(urlFor('editEvent', {eventId: self.event.$id}));
        }).catch(function(err) {
          $log.error(err);
          spfAlert.error('Failed to created new task');
        }).finally(function() {
          self.creatingTask = false;
        });
      };
    }
  ]).

  /**
   * Used to resolve `initialData` of `EditEventTaskCtrl`.
   *
   */
  factory('editEventTaskCtrlInitialData', [
    '$q',
    '$route',
    'spfAuthData',
    'clmDataStore',
    function editEventTaskCtrlInitialDataFactory($q, $route, spfAuthData, clmDataStore) {
      return function editEventTaskCtrlInitialData() {
        var errNoEvent = new Error('Event not found');
        var errNoTask = new Error('Event not found');
        var errNotAuthaurized = new Error('You cannot edit this event');
        var eventId = $route.current.params.eventId;
        var taskId = $route.current.params.taskId;

        var eventPromise = clmDataStore.events.get(eventId).then(function(event) {
          if (event.$value === null) {
            return $q.reject(errNoEvent);
          }

          return event;
        });

        var taskPromise = eventPromise.then(function(event) {
          if (!event.tasks || !event.tasks[taskId]) {
            return $q.reject(errNoTask);
          }
          return event.tasks[taskId];
        });

        return $q.all({
          currentUser: spfAuthData.user(),
          event: eventPromise,
          badges: clmDataStore.badges.all(),
          taskId: taskId,
          task: taskPromise
        }).then(function(data) {
          if (
            !data.currentUser.publicId ||
            !data.event.owner ||
            !data.event.owner.publicId ||
            data.event.owner.publicId !== data.currentUser.publicId
          ) {
            return $q.reject(errNotAuthaurized);
          } else {
            return data;
          }
        });
      };
    }
  ]).

  /**
   * EditEventTaskCtrl
   *
   */
  controller('EditEventTaskCtrl', [
    'initialData',
    'spfAlert',
    'urlFor',
    'spfFirebase',
    'spfNavBarService',
    'clmDataStore',
    function EditEventTaskCtrl(initialData, spfAlert, urlFor, spfFirebase, spfNavBarService, clmDataStore) {
      var self = this;

      this.event = initialData.event;
      this.badges = initialData.badges;
      this.taskId = initialData.taskId;
      this.task = initialData.task;
      this.savingTask = false;
      this.taskType = this.task.serviceId == null ? 'linkPattern' : 'service';

      // md-select badge list and the the ng-model are compared
      // by reference.
      if (
        this.task.badge &&
        this.task.badge.id &&
        this.badges[this.task.serviceId] &&
        this.badges[this.task.serviceId][this.task.badge.id]
      ) {
        this.task.badge = this.badges[this.task.serviceId][this.task.badge.id];
      }

      spfNavBarService.update(
        this.task.title, [{
          title: 'Events',
          url: '#' + urlFor('events')
        }, {
          title: this.event.title,
          url: '#' + urlFor('oneEvent', {eventId: this.event.$id})
        }, {
          title: 'Challenges',
          url: '#' + urlFor('editEvent', {eventId: this.event.$id})
        }]
      );

      this.saveTask = function(event, taskId, task) {
        var copy = spfFirebase.cleanObj(task);

        if (copy.serviceId === 'singPath') {
          delete copy.badge;
          if (copy.singPathProblem) {
            copy.singPathProblem.path = spfFirebase.cleanObj(task.singPathProblem.path);
            copy.singPathProblem.level = spfFirebase.cleanObj(task.singPathProblem.level);
            copy.singPathProblem.problem = spfFirebase.cleanObj(task.singPathProblem.problem);
          }
        } else {
          delete copy.singPathProblem;
          copy.badge = spfFirebase.cleanObj(task.badge);
        }

        self.savingTask = true;
        clmDataStore.events.updateTask(event.$id, taskId, copy).then(function() {
          spfAlert.success('Task saved');
        }).catch(function(err) {
          spfAlert.error(err);
        }).finally(function() {
          self.savingTask = false;
        });
      };
    }
  ])

  ;

})();
