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
    'spfDataStore',
    function problemListCtrlInitialDataFactory($q, spfDataStore) {
      return function problemListCtrlInitialData() {
        return $q.all({
          problems: spfDataStore.problems.list().$loaded()
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
          iconUrl: 'shared/components/icons/SVG/add-circle-outline.svg'
        }]
      );
      this.problems = initialData.problems;
      console.dir(this);
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
    'initialData',
    'routes',
    'SpfNavBarService',
    'spfAuthData',
    'spfAlert',
    'spfDataStore',
    function NewProblemCtrl($q, initialData, routes, SpfNavBarService, spfAuthData, spfAlert, spfDataStore) {
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
        }).then(function(problem) {
          spfAlert.success('Problem created.');
          return problem;
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

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          profile: profilePromise,
          problem: problemPromise,
          solution: $q.all({
            user: userPromise,
            problem: problemPromise
          }).then(function(result) {
            if (!result.user || !result.user.publicId) {
              return;
            }
            return spfDataStore.solutions.get(
              result.problem.$id, result.user.publicId
            ).$loaded();
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
    'initialData',
    'routes',
    'SpfNavBarService',
    'spfAlert',
    'spfAuthData',
    'spfDataStore',
    function PlayProblemCtrl($q, initialData, routes, SpfNavBarService, spfAlert, spfAuthData, spfDataStore) {
      var self = this;

      SpfNavBarService.update(
        initialData.problem.title, {
          title: 'Problems',
          url: '#' + routes.problems
        }
      );

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.problem = initialData.problem;
      this.solution = initialData.solution || {};

      this.savingSolution = false;
      this.solutionSaved = false;
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
          this.solutionSaved = true;
          spfAlert.success('Solution saved');
        }).catch(function(err) {
          spfAlert.error(err.message || err.toString());
        }).finally(function(){
          self.savingSolution = false;
        });
      };

      this.reset = function(solution) {
        self.solutionSaved = false;
        solution.solution = '';
        solution.output = undefined;
      };

      this.resetOutput = function(solution) {
        self.solutionSaved = false;
        solution.output = undefined;
      };
    }
  ])

  ;

})();
