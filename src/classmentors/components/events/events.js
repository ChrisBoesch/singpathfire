(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.events, {
        templateUrl: 'classmentors/components/events/events-view-list.html',
        controller: 'ClmListEvent',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmListEventResolver',
            function(clmListEventResolver) {
              return clmListEventResolver();
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
        controller: 'EditEventCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'editEventCtrllInitialData',
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
   * Used to resolve `initialData` of `ClmListEvent`.
   *
   */
  factory('clmListEventResolver', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'clmDataStore',
    function clmListEventResolverFactory($q, spfAuth, spfAuthData, clmDataStore) {
      return function classMentorsEventRsolver() {
        return $q.all({
          events: clmDataStore.events.list(),
          auth: spfAuth,
          currentUser: spfAuthData.user().catch(function() {
            return;
          }),
          profile: clmDataStore.currentUserProfile(),
          createdEvents: clmDataStore.events.listCreatedEvents(),
          joinedEvents: clmDataStore.events.listJoinedEvents()
        });
      };
    }
  ]).

  /**
   * ClmListEvent
   *
   */
  controller('ClmListEvent', [
    'initialData',
    'spfNavBarService',
    'urlFor',
    function ClmListEvent(initialData, spfNavBarService, urlFor) {
      var opts = [];

      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.events = initialData.events;
      this.createdEvents = initialData.createdEvents;
      this.joinedEvents = initialData.joinedEvents;
      this.auth = initialData.auth;

      if (
        this.profile &&
        this.profile.user &&
        this.profile.user.isPremium
      ) {
        opts.push({
          title: 'New event',
          url: '#' + urlFor('newEvent'),
          icon: 'add-circle-outline'
        });
      }

      spfNavBarService.update('Events', undefined, opts);
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
        var errNotPremium = new Error('Only premium users can create events.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = clmDataStore.currentUserProfile().then(function(profile) {
          if (profile && profile.$value === null) {
            return clmDataStore.initProfile();
          }

          return profile;
        }).then(function(profile) {
          if (
            !profile ||
            !profile.user ||
            !profile.user.isPremium
          ) {
            return $q.reject(errNotPremium);
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
        var profilePromise = clmDataStore.currentUserProfile().catch(rescue);

        function rescue() {
          return;
        }

        var eventPromise = clmDataStore.events.get(eventId).then(function(event) {
          if (event.$value === null) {
            return $q.reject(errNoEvent);
          }
          return event;
        });

        var canviewPromise = $q.all({
          event: eventPromise,
          profile: profilePromise
        }).then(function(data) {
          return $q.when(data.profile && data.profile.canView(data.event));
        });

        var tasksPromise = canviewPromise.then(function(canView) {
          if (canView) {
            return clmDataStore.events.getTasks(eventId);
          }
        });

        var participantsPromise = canviewPromise.then(function(canView) {
          if (canView) {
            return clmDataStore.events.participants(eventId);
          }
        });

        var userSolutionsPromise = $q.all({
          profile: profilePromise,
          canview: canviewPromise
        }).then(function(result) {
          if (result.canview && result.profile && result.profile.$id) {
            return clmDataStore.events.getUserSolutions(eventId, result.profile.$id);
          }
        });

        var currentUserProgressPromise = $q.all({
          profile: profilePromise,
          canview: canviewPromise
        }).then(function(result) {
          if (result.canview && result.profile && result.profile.$id) {
            return clmDataStore.events.getUserProgress(eventId, result.profile.$id);
          }
        });

        return $q.all({
          currentUser: spfAuthData.user().catch(rescue),
          profile: profilePromise,
          event: eventPromise,
          tasks: tasksPromise,
          participants: participantsPromise,
          ranking: clmDataStore.events.getRanking(eventId),
          progress: canviewPromise.then(function(canView) {
            if (canView) {
              return clmDataStore.events.getProgress(eventId);
            }
          }),
          solutions: canviewPromise.then(function(canView) {
            if (canView) {
              return clmDataStore.events.getSolutions(eventId);
            }
          }),
          currentUserProgress: currentUserProgressPromise,
          currentUserSolutions: userSolutionsPromise,
          currentUserStats: $q.all([
            canviewPromise, eventPromise, tasksPromise, userSolutionsPromise, profilePromise
          ]).then(function(data) {
            if (!data || !data[0] || !data[3] || !data[4]) {
              return {};
            }
            return clmDataStore.events.updateCurrentUserProfile.apply(clmDataStore.events, data.slice(1));
          })
        });
      };
    }
  ]).

  /**
   * ViewEventCtrl
   *
   */
  controller('ViewEventCtrl', [
    '$scope',
    'initialData',
    '$q',
    '$log',
    '$document',
    '$mdDialog',
    '$route',
    'spfAlert',
    'urlFor',
    'routes',
    'spfFirebase',
    'spfAuthData',
    'spfNavBarService',
    'clmDataStore',
    'clmServicesUrl',
    function ViewEventCtrl(
      $scope, initialData, $q, $log, $document, $mdDialog, $route,
      spfAlert, urlFor, routes, spfFirebase, spfAuthData, spfNavBarService, clmDataStore, clmServicesUrl
    ) {
      var self = this;
      var linkers, monitorHandler;

      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.event = initialData.event;
      this.tasks = initialData.tasks;
      this.ranking = initialData.ranking;
      this.currentUserStats = initialData.currentUserStats;
      this.participants = initialData.participants;
      this.progress = initialData.progress;
      this.solutions = initialData.solutions;
      this.currentUserProgress = initialData.currentUserProgress;
      this.currentUserSolutions = initialData.currentUserSolutions;
      this.orderKey = 'total';
      this.previousOrderKey = 'user.displayName';
      this.reverseOrder = true;

      if (
        self.event &&
        self.event.owner &&
        self.event.owner.publicId &&
        self.currentUser &&
        self.event.owner.publicId === self.currentUser.publicId
      ) {
        monitorHandler = clmDataStore.events.monitorEvent(
          this.event, this.tasks, this.participants, this.solutions, this.progress
        );
      } else {
        monitorHandler = {
          update: angular.noop,
          unwatch: angular.noop
        };
      }

      $scope.$on('$destroy', function() {
        /* eslint no-unused-expressions: 0 */
        monitorHandler.unwatch();
        self.profile && self.profile.$destroy && self.profile.$destroy();
        self.tasks && self.tasks.$destroy();
        self.ranking && self.ranking.$destroy();
        self.participants && self.participants.$destroy();
        self.progress && self.progress.$destroy();
        self.solutions && self.solutions.$destroy();
        self.currentUserProgress && self.currentUserProgress.$destroy();
        self.currentUserSolutions && self.currentUserSolutions.$destroy();
      });

      this.orderBy = function(key) {
        if (this.orderKey === key) {
          this.reverseOrder = !this.reverseOrder;
        } else {
          this.previousOrderKey = this.orderKey;
          this.orderKey = key;
          this.reverseOrder = true;
        }
      };

      this.visibleTasks = function() {
        var count = Object.keys(self.tasks).filter(function(key) {
          return key && key[0] !== '$' && self.tasks[key] && !self.tasks[key].hidden;
        }).length;

        return count;
      };

      updateNavbar();

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
        if (
          self.participants &&
          self.participants.$indexFor(self.currentUser.publicId) > -1
        ) {
          options.push({
            title: 'Leave',
            onClick: function() {
              clmDataStore.events.leave(self.event.$id).then(function() {
                $route.reload();
              });
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
              monitorHandler.update();
            },
            icon: 'loop'
          });
        }

        return options;
      }

      function promptPassword() {
        if (
          self.event.schoolEvent && (
            !self.profile ||
            !self.profile.user ||
            !self.profile.user.school
          )
        ) {
          spfAlert.warning(
            'Only Students from Singapore can join this event. ' +
            'Maybe you profile needs to be updated.');
          return;
        }
        $mdDialog.show({
          parent: $document.body,
          templateUrl: 'classmentors/components/events/events-view-password.html',
          controller: DialogController,
          controllerAs: 'ctrl'
        });

        function DialogController() {
          this.pw = '';

          this.join = function(pw) {
            clmDataStore.events.join(self.event, pw).then(function() {
              spfAlert.success('You joined this event');
              $mdDialog.hide();
              $route.reload();
            }).catch(function(err) {
              spfAlert.error('Failed to add you: ' + err);
            });
          };

          this.closeDialog = function() {
            $mdDialog.hide();
          };
        }
      }

      function cleanProfile(currentUser) {
        currentUser.country = spfFirebase.cleanObj(currentUser.country);
        currentUser.school = spfFirebase.cleanObj(currentUser.school);
      }

      this.register = function(currentUser) {
        cleanProfile(currentUser);
        spfAuthData.publicId(currentUser).then(function() {
          spfAlert.success('Public id and display name saved');
          return clmDataStore.initProfile();
        }).then(function() {
          $route.reload();
        }).catch(function(err) {
          spfAlert.error('Failed to save public id');
          return err;
        });
      };

      this.promptForLink = function(eventId, taskId, task, participant, userSolution) {
        $mdDialog.show({
          parent: $document.body,
          templateUrl: 'classmentors/components/events/events-view-provide-link.html',
          controller: DialogController,
          controllerAs: 'ctrl'
        });

        function DialogController() {
          this.task = task;
          if (
            userSolution &&
            userSolution[taskId]
          ) {
            this.solution = userSolution[taskId];
          }

          this.save = function(link) {
            clmDataStore.events.submitSolution(eventId, taskId, participant.$id, link).then(function() {
              $mdDialog.hide();
              spfAlert.success('Link is saved.');
            }).catch(function(err) {
              $log.error(err);
              spfAlert.error('Failed to save the link.');
              return err;
            }).then(function() {
              return self.update(
                self.event, self.tasks, self.currentUserSolutions, self.profile, self.currentUserStats.progress
              );
            });
          };

          this.cancel = function() {
            $mdDialog.hide();
          };
        }
      };

      this.promptForTextResponse = function(eventId, taskId, task, participant, userSolution) {
        $mdDialog.show({
          parent: $document.body,
          templateUrl: 'classmentors/components/events/events-view-provide-response.html',
          controller: DialogController,
          controllerAs: 'ctrl'
        });

        function DialogController() {
          this.task = task;
          if (
            userSolution &&
            userSolution[taskId]
          ) {
            this.solution = userSolution[taskId];
          }

          this.save = function(response) {
            clmDataStore.events.submitSolution(eventId, taskId, participant.$id, response).then(function() {
              $mdDialog.hide();
              spfAlert.success('Response is saved.');
            }).catch(function(err) {
              $log.error(err);
              spfAlert.error('Failed to save your response.');
              return err;
            }).then(function() {
              return self.update(
                self.event, self.tasks, self.currentUserSolutions, self.profile, self.currentUserStats.progress
              );
            });
          };

          this.cancel = function() {
            $mdDialog.hide();
          };
        }
      };

      this.update = function(event, tasks, userSolutions, profile, userProgress) {
        return clmDataStore.events.updateCurrentUserProfile(
          event, tasks, userSolutions, profile, userProgress
        ).then(function(stats) {
          self.currentUserStats = stats;
          spfAlert.success('Profile updated');
        }).catch(function(err) {
          $log.error(err);
          spfAlert.error('Failed to update profile');
        });
      };

      this.completed = function(taskId, participants, progress) {
        var participantCount;

        if (!participants || !progress) {
          return 0;
        }

        participantCount = participants.length;

        if (participantCount < 1) {
          return 0;
        }

        return Object.keys(progress).filter(function(publicId) {
          return (
            progress[publicId] &&
            progress[publicId][taskId] &&
            progress[publicId][taskId].completed
          );
        }).length / participantCount * 100;
      };

      this.startLink = function(task, profile) {
        var serviceProfile;

        if (
          !task ||
          !task.serviceId ||
          !linkers[task.serviceId]
        ) {
          return '';
        }

        serviceProfile = profile && profile.services && profile.services[task.serviceId];
        return linkers[task.serviceId](task, serviceProfile);
      };

      var trackedServices = {
        codeSchool: true,
        codeCombat: true
      };

      this.mustRegister = function(task, profile) {
        return (
          task &&
          task.serviceId &&
          trackedServices[task.serviceId] && (
            !profile ||
            !profile.services ||
            !profile.services[task.serviceId] ||
            !profile.services[task.serviceId].details ||
            !profile.services[task.serviceId].details.id
          ) || false
        );
      };

      function defaultLinker(task, serviceProfile) {
        if (
          !serviceProfile ||
          !serviceProfile.details ||
          !serviceProfile.details.id ||
          !task ||
          !task.badge ||
          !task.badge.url
        ) {
          return '#' + routes.editProfile;
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

      this.removeParticipant = function(e, event, participant) {
        var confirm = $mdDialog.confirm()
          .parent(angular.element($document.body))
          .title('Would you like to remove ' + participant.user.displayName + '?')
          .content('The participant progress will be kept but he/she will not show as participant')
          .ariaLabel('Remove participant')
          .ok('Remove')
          .cancel('Cancel')
          .targetEvent(e);

        $mdDialog.show(confirm).then(function() {
          clmDataStore.events.removeParticpants(event.$id, participant.$id);
        });
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
  factory('editEventCtrllInitialData', [
    '$q',
    'baseEditCtrlInitialData',
    'clmDataStore',
    function($q, baseEditCtrlInitialData, clmDataStore) {
      return function editEventCtrllInitialData() {
        var data = baseEditCtrlInitialData();

        data.tasks = data.event.then(function(event) {
          return clmDataStore.events.getTasks(event.$id);
        });

        return $q.all(data);
      };
    }
  ]).

  /**
   * EditEventCtrl
   *
   */
  controller('EditEventCtrl', [
    'initialData',
    'spfNavBarService',
    'urlFor',
    'spfAlert',
    'clmDataStore',
    function EditEventCtrl(initialData, spfNavBarService, urlFor, spfAlert, clmDataStore) {
      var self = this;

      this.currentUser = initialData.currentUser;
      this.event = initialData.event;
      this.tasks = initialData.tasks;
      this.newPassword = '';
      this.savingEvent = false;

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

      this.save = function(currentUser, event, newPassword, editEventForm) {
        self.savingEvent = true;
        event.owner.publicId = currentUser.publicId;
        event.owner.displayName = currentUser.displayName;
        event.owner.gravatar = currentUser.gravatar;
        return clmDataStore.events.updateEvent(event, newPassword).then(function() {
          spfAlert.success('Event saved.');
          self.newPassword = '';
          editEventForm.$setPristine(true);
        }).catch(function() {
          spfAlert.error('Failed to save event.');
        }).finally(function() {
          self.savingEvent = false;
        });
      };

      this.openTask = function(eventId, taskId) {
        clmDataStore.events.openTask(eventId, taskId).then(function() {
          spfAlert.success('Task opened.');
        }).catch(function() {
          spfAlert.error('Failed to open task');
        });
      };

      this.closeTask = function(eventId, taskId) {
        clmDataStore.events.closeTask(eventId, taskId).then(function() {
          spfAlert.success('Task closed.');
        }).catch(function() {
          spfAlert.error('Failed to close task.');
        });
      };

      this.showTask = function(eventId, taskId) {
        clmDataStore.events.showTask(eventId, taskId).then(function() {
          spfAlert.success('Task visible.');
        }).catch(function() {
          spfAlert.error('Failed to make task visible.');
        });
      };

      this.hideTask = function(eventId, taskId) {
        clmDataStore.events.hideTask(eventId, taskId).then(function() {
          spfAlert.success('Task hidden.');
        }).catch(function() {
          spfAlert.error('Failed to make task hidden.');
        });
      };

      this.archiveTask = function(eventId, taskId) {
        clmDataStore.events.archiveTask(eventId, taskId).then(function() {
          spfAlert.success('Task archived.');
        }).catch(function() {
          spfAlert.error('Failed to archive task.');
        });
      };
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
      this.isOpen = true;
      this.singPath = initialData.singPath;
      this.savingTask = false;
      this.task = {archived: false};

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

      this.saveTask = function(event, _, task, taskType, isOpen) {
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
        clmDataStore.events.addTask(event.$id, copy, isOpen).then(function() {
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

        var taskPromise = eventPromise.then(function() {
          return clmDataStore.events.getTask(eventId, taskId).then(function(task) {
            if (!task || task.$value === null) {
              return $q.reject(errNoTask);
            }

            return task;
          });
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
      this.isOpen = !!this.task.openedAt;
      this.savingTask = false;

      if (this.task.serviceId) {
        this.taskType = 'service';
      } else if (this.task.linkPattern) {
        this.taskType = 'linkPattern';
      } else if (this.task.textResponse) {
        this.taskType = 'textResponse';
      }

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

      this.saveTask = function(event, taskId, task, taskType, isOpen) {
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

        self.savingTask = true;
        clmDataStore.events.updateTask(event.$id, taskId, copy).then(function() {
          if (
            (isOpen && task.openedAt) ||
            (!isOpen && task.closedAt)
          ) {
            return;
          } else if (isOpen) {
            return clmDataStore.events.openTask(event.$id, taskId);
          } else {
            return clmDataStore.events.closeTask(event.$id, taskId);
          }
        }).then(function() {
          spfAlert.success('Task saved');
        }).catch(function() {
          spfAlert.error('Failed to save the task.');
        }).finally(function() {
          self.savingTask = false;
        });
      };
    }
  ])

  ;

})();
