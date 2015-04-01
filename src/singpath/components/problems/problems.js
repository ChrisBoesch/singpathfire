(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.problems, {
        templateUrl: 'singpath/components/problems/problems-view-list.html',
        controller: 'ProblemListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'problemListCtrlInitialData',
            function(problemListCtrlInitialData) {
              return problemListCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.newProblem, {
        templateUrl: 'singpath/components/problems/problems-view-new.html',
        controller: 'NewProblemCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'newProblemCtrlInitialData',
            function(newProblemCtrlInitialData) {
              return newProblemCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.playProblem, {
        templateUrl: 'singpath/components/problems/problems-view-play.html',
        controller: 'PlayProblemCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'playProblemCtrlInitialData',
            function(playProblemCtrlInitialData) {
              return playProblemCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.editProblem, {
        templateUrl: 'singpath/components/problems/problems-view-edit.html',
        controller: 'EditProbemCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'editProbemCtrlInitialData',
            function(editProbemCtrlInitialData) {
              return editProbemCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).

  config([
    '$mdIconProvider',
    function($mdIconProvider) {
      // Configure URLs for icons specified by [set:]id.
      $mdIconProvider
        .icon(
          'language:python',
          'singpath/components/problems/problems-icons-python.svg',
          120
        )
        .icon(
          'language:angularjs',
          'singpath/components/problems/problems-icons-angularjs.svg',
          120
        );
    }
  ]).


  /**
   * Use to resolve `initialData` of `ProblemListCtrl`.
   *
   */
  factory('problemListCtrlInitialData', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function problemListCtrlInitialDataFactory($q, spfAuth, spfAuthData, spfDataStore) {
      return function problemListCtrlInitialData() {
        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.all({
            problems: spfDataStore.problems.list(),
            profile: undefined
          });
        }

        return $q.all({
          problems: spfDataStore.problems.list(),
          profile: spfAuthData.user().then(function(userData) {
            if (!userData.publicId) {
              return;
            }

            return spfDataStore.profile(userData.publicId).then(function(profile) {
              if (profile && profile.$value === null) {
                return spfDataStore.initProfile(userData);
              }

              return profile;
            });
          })
        });
      };
    }
  ]).

  /**
   * ProblemListCtrl
   *
   */
  controller('ProblemListCtrl', [
    'initialData',
    'routes',
    'SpfNavBarService',
    function ProblemListCtrl(initialData, routes, SpfNavBarService) {
      SpfNavBarService.update(
        'Problems',
        undefined, [{
          title: 'New problem',
          url: '#' + routes.newProblem,
          icon: 'add-circle-outline'
        }]
      );

      this.problems = initialData.problems;
      this.profile = initialData.profile;
    }
  ]).

  /**
   * Get user profile for ProblemCreat
   */
  factory('newProblemCtrlInitialData', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function newProblemCtrlInitialDataFactory($q, spfAuth, spfAuthData, spfDataStore) {
      return function newProblemCtrlInitialData() {
        var userPromise = spfAuthData.user();
        var profilePromise;
        var errLoggedOff = new Error('The user should be logged in to create a problem.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return;
          }

          return spfDataStore.profile(userData.publicId).then(function(profile) {
            if (profile && profile.$value === null) {
              return spfDataStore.initProfile(userData);
            }

            return profile;
          });
        });

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * ProblemListCtrl
   *
   */
  controller('NewProblemCtrl', [
    '$q',
    '$location',
    'initialData',
    'routes',
    'SpfNavBarService',
    'spfAuthData',
    'spfAlert',
    'spfDataStore',
    function NewProblemCtrl($q, $location, initialData, routes, SpfNavBarService, spfAuthData, spfAlert, spfDataStore) {
      var self = this;

      SpfNavBarService.update(
        'New problem', {
          title: 'Problems',
          url: '#' + routes.problems
        }
      );

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.problem = {};
      this.savingProblem = false;

      this.createProblem = function(currentUser, problem) {
        var next;

        self.savingProblem = true;

        if (!self.profile) {
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return spfDataStore.initProfile(currentUser);
          }).then(function(profile) {
            self.profile = profile;
            return profile;
          });
        } else {
          next = $q.when();
        }

        return next.then(function() {
          problem.owner = {
            publicId: currentUser.publicId,
            displayName: currentUser.displayName,
            gravatar: currentUser.gravatar
          };

          return spfDataStore.problems.create(problem);
        }).then(function(updatedProblem) {
          spfAlert.success('Problem created.');
          $location.path(routes.problems);
          return updatedProblem;
        }, function(err) {
          spfAlert.error(err.message || err.toString());
          return err;
        }).finally(function() {
          this.savingProblem = false;
        });
      };
    }
  ]).

  /**
   * Use to resolve `initialData` of `PlayProblemCtrl`.
   *
   */
  factory('playProblemCtrlInitialData', [
    '$q',
    '$route',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function playProblemCtrlInitialDataFactory($q, $route, spfAuth, spfAuthData, spfDataStore) {
      return function playProblemCtrlInitialData() {
        var userPromise = spfAuthData.user();
        var profilePromise;
        var problemPromise;
        var resolutionPromise;
        var errLoggedOff = new Error('The user should be logged in to play.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return;
          }

          return spfDataStore.profile(userData.publicId).then(function(profile) {
            if (profile && profile.$value === null) {
              return spfDataStore.initProfile(userData);
            }

            return profile;
          });
        });

        problemPromise = spfDataStore.problems.get($route.current.params.problemId);

        resolutionPromise = $q.all({
          user: userPromise,
          problem: problemPromise
        }).then(function(result) {
          if (!result.user || !result.user.publicId) {
            return;
          }

          return spfDataStore.resolutions.get(
            result.problem.$id, result.user.publicId
          );
        });

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          profile: profilePromise,
          problem: problemPromise,
          resolution: resolutionPromise,
          solution: $q.all({
            user: userPromise,
            problem: problemPromise,
            resolution: resolutionPromise
          }).then(function(result) {
            if (!result.user || !result.user.publicId) {
              return;
            }

            if (!result.resolution.startedAt) {
              return result.resolution.$init().then(angular.noop);
            }

            if (result.resolution.$solved()) {
              return;
            }

            return spfDataStore.solutions.get(
              result.problem.$id, result.user.publicId
            );
          })
        });
      };
    }
  ]).

  /**
   * PlayProblemCtrl
   *
   */
  controller('PlayProblemCtrl', [
    '$q',
    '$location',
    'initialData',
    'routes',
    'SpfNavBarService',
    'spfAlert',
    'spfAuthData',
    'spfDataStore',
    function PlayProblemCtrl($q, $location, initialData, routes, SpfNavBarService, spfAlert, spfAuthData, spfDataStore) {
      var self = this;
      var original = {};
      var menuItems = [];

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.problem = initialData.problem;
      this.solution = initialData.solution || {};
      this.resolution = initialData.resolution;

      this.savingSolution = false;
      this.solutionSaved = false;
      original.solution = this.solution.solution;

      if (this.problem.$canBeEditedBy(this.currentUser)) {
        menuItems = [{
          title: 'Edit',
          url: '#' + routes.problems + '/' + this.problem.$id + '/edit',
          icon: 'add-circle-outline'
        }];
      }

      SpfNavBarService.update(
        initialData.problem.title, {
          title: 'Problems',
          url: '#' + routes.problems
        }, menuItems
      );

      this.solve = function(currentUser, problem, solution) {
        var next;

        self.savingSolution = true;

        if (!self.profile) {
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return spfDataStore.initProfile(currentUser);
          }).then(function(profile) {
            self.profile = profile;
            return profile;
          });
        } else {
          next = $q.when();
        }

        next.then(function() {
          return spfDataStore.solutions.create(problem, currentUser.publicId, solution);
        }).then(function() {
          spfAlert.success('Solution saved');
        }).catch(function(err) {
          spfAlert.error(err.message || err.toString());
        }).finally(function() {
          self.savingSolution = false;
          self.solutionSaved = true;
          original.solution = solution.solution;
        });
      };

      this.reset = function(solution) {
        solution.solution = '';
      };

      this.solutionChanged = function(solution) {
        this.solutionSaved = this.solutionSaved && original.solution === solution.solution;
      };
    }
  ]).

  /**
   * Use to resolve `initialData` of `EditProbemCtrl`.
   *
   */
  factory('editProbemCtrlInitialData', [
    '$q',
    '$route',
    'spfAuth',
    'spfDataStore',
    function editProbemCtrlInitialDataFactory($q, $route, spfAuth, spfDataStore) {
      return function editProbemCtrlInitialData() {
        var errLoggedOff = new Error('You should be logged in to edit a problem.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        return $q.all({
          auth: spfAuth,
          problem: spfDataStore.problems.get($route.current.params.problemId)
        });
      };
    }
  ]).

  /**
   * EditProbemCtrl
   *
   */
  controller('EditProbemCtrl', [
    '$log',
    '$location',
    'initialData',
    'spfAlert',
    'SpfNavBarService',
    'routes',
    function EditProbemCtrl($log, $location, initialData, spfAlert, SpfNavBarService, routes) {
      var self = this;
      var originalProblem = Object.assign({}, this.problem);

      SpfNavBarService.update(
        'Edit', [{
          title: 'Problems',
          url: '#' + routes.problems
        }, {
          title: initialData.problem.title,
          url: '#' + routes.problems + '/' + initialData.problem.$id + '/play'
        }], [{
          title: 'Delete',
          onClick: function() {
            self.problem.$remove().then(function() {
              return $location.path(routes.problems);
            });
          },
          icon: 'add-circle-outline'
        }]
      );

      this.problem = initialData.problem;

      this.saveProblem = function(problem) {
        return problem.$save().then(function(updatedProblem) {
          originalProblem = Object.assign({}, updatedProblem);
          spfAlert.success('Problem saved');
        }).catch(function(err) {
          $log.error(err);
          spfAlert.success('Failed to save problem changes');
        });
      };

      this.reset = function(problem) {
        Object.assign(problem, originalProblem);
      };
    }
  ])

  ;

})();
