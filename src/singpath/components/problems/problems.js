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

      when(routes.editProblems, {
        templateUrl: 'singpath/components/problems/problems-view-list-edit.html',
        controller: 'EditProblemsCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'editProblemsCtrlInitialData',
            function(editProblemsCtrlInitialData) {
              return editProblemsCtrlInitialData();
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
      })

      ;

    }
  ]).

  /**
   * Used to initiate problem list and new problem view.
   *
   */
  factory('baseProblemListResolver', [
    '$route',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function baseProblemListResolverFactory($route, spfAuth, spfAuthData, spfDataStore) {
      return function baseProblemListResolver() {
        var pathId = $route.current.params.pathId;
        var levelId = $route.current.params.levelId;
        var userPromise = spfAuthData.user();
        var data = {
          auth: spfAuth,
          currentUser: userPromise,
          profile: undefined,
          path: spfDataStore.paths.get(pathId),
          level: spfDataStore.levels.get(pathId, levelId),
          problems: spfDataStore.problems.list(pathId, levelId)
        };

        if (!spfAuth.user || !spfAuth.user.uid) {
          return data;
        }

        data.profile = userPromise.then(function(userData) {
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

        return data;
      };
    }
  ]).

  /**
   * Use to resolve `initialData` of `ProblemListCtrl`.
   *
   */
  factory('problemListCtrlInitialData', [
    '$q',
    'baseProblemListResolver',
    function problemListCtrlInitialDataFactory($q, baseProblemListResolver) {
      return function problemListCtrlInitialData() {
        return $q.all(baseProblemListResolver());
      };
    }
  ]).

  /**
   * ProblemListCtrl
   *
   */
  controller('ProblemListCtrl', [
    'initialData',
    'urlFor',
    'spfNavBarService',
    function ProblemListCtrl(initialData, urlFor, spfNavBarService) {
      var pathId = initialData.path.$id;
      var levelId = initialData.level.$id;
      var navBarOptions = [];

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.path = initialData.path;
      this.level = initialData.level;
      this.problems = initialData.problems;

      if (this.level.$canBeEditedBy(this.currentUser)) {
        navBarOptions.push({
          title: 'Edit',
          url: '#' + urlFor('editProblems', {pathId: pathId, levelId: levelId}),
          icon: 'create'
        });
      }

      spfNavBarService.update(
        this.level.title,
        [{
          title: 'Paths',
          url: '#' + urlFor('paths')
        }, {
          title: this.path.title,
          url: '#' + urlFor('levels', {pathId: this.path.$id})
        }], navBarOptions
      );
    }
  ]).

  /**
   * Use to resolve `initialData` of `ProblemListCtrl`.
   *
   */
  factory('editProblemsCtrlInitialData', [
    '$q',
    'baseProblemListResolver',
    function editProblemsCtrlInitialDataFactory($q, baseProblemListResolver) {
      return function editProblemsCtrlInitialData() {
        var errCannotEdit = new Error('You cannot edit this level');
        var data = baseProblemListResolver();

        return $q.all({
          level: data.level,
          user: data.currentUser
        }).then(function(results) {
          if (
            !results.level ||
            !results.level.$canBeEditedBy ||
            !results.level.$canBeEditedBy(results.user)
          ) {
            return $q.reject(errCannotEdit);
          }

          return $q.all(data);
        });
      };
    }
  ]).

  /**
   * EditProblemsCtrl
   *
   */
  controller('EditProblemsCtrl', [
    '$log',
    'initialData',
    'urlFor',
    'spfAlert',
    'spfNavBarService',
    function EditProblemsCtrl($log, initialData, urlFor, spfAlert, spfNavBarService) {
      var self = this;
      var pathId = initialData.path.$id;
      var levelId = initialData.level.$id;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.path = initialData.path;
      this.level = initialData.level;
      this.problems = initialData.problems;
      this.newProblem = {};

      spfNavBarService.update(
        'Edit',
        [{
          title: 'Paths',
          url: '#' + urlFor('paths')
        }, {
          title: this.path.title,
          url: '#' + urlFor('levels', {pathId: pathId})
        }, {
          title: this.level.title,
          url: '#' + urlFor('problems', {pathId: pathId, levelId: levelId})
        }], []
      );

      this.saveProblem = function(problems, index) {
        return problems.$save(index).then(function(data) {
          spfAlert.success('Problem saved');
          return data;
        }).catch(function(err) {
          $log.error(err);
          spfAlert.success('Failed to save problem changes');
        });
      };

      this.createProblem = function(currentUser, problems, newProblem) {
        newProblem.language = self.level.language;
        newProblem.owner = self.level.owner;
        problems.$add(newProblem).then(function(ref) {
          spfAlert.success('Problem created');
          self.newProblem = {};
          return ref;
        }).catch(function(err) {
          $log.error(err);
          spfAlert.error('Failed to create the problem');
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
        var userPromise, problemPromise, resolutionPromise;
        var pathId = $route.current.params.pathId;
        var levelId = $route.current.params.levelId;
        var problemId = $route.current.params.problemId;
        var errLoggedOff = new Error('The user should be logged in to play.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        userPromise = spfAuthData.user();
        problemPromise = spfDataStore.problems.get(pathId, levelId, problemId);
        resolutionPromise = $q.all({
          user: userPromise,
          problem: problemPromise
        }).then(function(result) {
          if (!result.user || !result.user.publicId) {
            return;
          }

          return spfDataStore.resolutions.get(
            pathId, levelId, problemId, result.user.publicId
          );
        });

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          path: spfDataStore.paths.get(pathId),
          level: spfDataStore.levels.get(pathId, levelId),
          problem: problemPromise,
          resolution: resolutionPromise,
          profile: userPromise.then(function(userData) {
            if (!userData.publicId) {
              return;
            }

            return spfDataStore.profile(userData.publicId).then(function(profile) {
              if (profile && profile.$value === null) {
                return spfDataStore.initProfile(userData);
              }

              return profile;
            });
          }),
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
              pathId, levelId, problemId, result.user.publicId
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
    'urlFor',
    'spfNavBarService',
    'spfAlert',
    'spfAuthData',
    'spfDataStore',
    function PlayProblemCtrl(
      $q, $location, initialData, urlFor, spfNavBarService, spfAlert, spfAuthData, spfDataStore
    ) {
      var self = this;
      var original = {};

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.path = initialData.path;
      this.level = initialData.level;
      this.problem = initialData.problem;
      this.solution = initialData.solution || {};
      this.resolution = initialData.resolution;

      this.savingSolution = false;
      this.solutionSaved = false;
      original.solution = this.solution.solution;

      spfNavBarService.update(
        this.problem.title,
        [{
          title: 'Paths',
          url: '#' + urlFor('paths')
        }, {
          title: this.path.title,
          url: '#' + urlFor('levels', {pathId: this.path.$id})
        }, {
          title: this.level.title,
          url: '#' + urlFor('problems', {pathId: this.path.$id, levelId: this.level.$id})
        }], []
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
  ])

  ;

})();
