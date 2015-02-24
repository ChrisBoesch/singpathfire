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
  ])



  ;

})();
