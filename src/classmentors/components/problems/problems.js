(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.levelList, {
        templateUrl: 'classmentors/components/problems/problems-view-level-list.html',
        controller: 'ClmLevelListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmLevelListCtrlInitialData',
            function(clmLevelListCtrlInitialData) {
              return clmLevelListCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.newLevel, {
        templateUrl: 'classmentors/components/problems/problems-view-new-level.html',
        controller: 'ClmNewLevelCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmNewLevelCtrlInitialData',
            function(clmNewLevelCtrlInitialData) {
              return clmNewLevelCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.oneLevel, {
        templateUrl: 'classmentors/components/problems/problems-view-level.html',
        controller: 'ClmProblemListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmProblemListCtrlInitialData',
            function(clmProblemListCtrlInitialData) {
              return clmProblemListCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.problemContributions, {
        templateUrl: 'classmentors/components/problems/problems-view-level.html',
        controller: 'ClmProblemListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmProblemContributionCtrlInitialData',
            function(clmProblemContributionCtrlInitialData) {
              return clmProblemContributionCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.newProblem, {
        templateUrl: 'classmentors/components/problems/problems-view-new-problem.html',
        controller: 'ClmNewProblemCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmNewProblemCtrlInitialData',
            function(clmNewProblemCtrlInitialData) {
              return clmNewProblemCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.oneProblem, {
        templateUrl: 'classmentors/components/problems/problems-view-problem.html',
        controller: 'ClmViewProblemCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmViewProblemCtrlInitialData',
            function(clmViewProblemCtrlInitialData) {
              return clmViewProblemCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Use to resolve `initialData` of `ClmLevelListCtrl`.
   *
   */
  factory('clmLevelListCtrlInitialData', [
    '$q',
    'clmDataStore',
    function clmLevelListCtrlInitialDataFactory($q, clmDataStore) {
      return function clmLevelListCtrlInitialData() {
        return $q.all({
          levels: clmDataStore.problems.levels(),
          profile: clmDataStore.currentUserProfile()
        });
      };
    }
  ]).

  /**
   * ClmLevelListCtrl
   *
   */
  controller('ClmLevelListCtrl', [
    'initialData',
    '$location',
    'spfNavBarService',
    'urlFor',
    function ClmLevelListCtrl(initialData, $location, spfNavBarService, urlFor) {
      var opts = [];

      this.levels = initialData.levels;
      this.profile = initialData.profile;

      if (this.profile && this.profile.user && this.profile.user.isAdmin) {
        opts.push({
          title: 'New level',
          url: '#' + urlFor('newLevel'),
          icon: 'add-circle-outline'
        });
      }

      spfNavBarService.update('Problem Levels', undefined, opts);

      this.listProblems = function(level) {
        $location.path(urlFor('oneLevel', {levelId: level.$id}));
      };
    }
  ]).

  /**
   * Use to resolve `initialData` of `ClmNewLevelCtrl`.
   *
   * Provide the controller with the current user profile.
   *
   * The promise with fails if the user has no profile or is not an admin.
   *
   * @return {Function}
   *
   */
  factory('clmNewLevelCtrlInitialData', [
    '$q',
    'clmDataStore',
    function clmNewLevelCtrlInitialDataFactory($q, clmDataStore) {
      return function clmNewLevelCtrlInitialData() {
        return $q.all({
          profile: clmDataStore.currentUserProfile().then(function(profile) {
            if (!profile && !profile.user) {
              return $q.reject(new Error('You should be logged in to create a new level.'));
            }

            if (!profile.user.isAdmin) {
              return $q.reject(new Error('You should be an admin to create a new level.'));
            }

            return profile;
          })
        });
      };
    }
  ]).

  /**
   * ClmNewLevelCtrl
   *
   */
  controller('ClmNewLevelCtrl', [
    'initialData',
    '$location',
    'spfNavBarService',
    'urlFor',
    'spfAlert',
    'clmDataStore',
    function ClmNewLevelCtrl(initialData, $location, spfNavBarService, urlFor, spfAlert, clmDataStore) {

      spfNavBarService.update('New Level', {
        title: 'Problems',
        url: '#' + urlFor('levelList')
      });

      this.profile = initialData.profile;

      this.newLevel = {acceptContribution: false};
      this.priority = 2;
      this.creatingLevel = false;

      this.save = function(profile, level, priority) {
        level.owner = {
          publicId: profile.$id,
          displayName: profile.user.displayName,
          gravatar: profile.user.gravatar
        };

        this.creatingLevel = true;
        clmDataStore.problems.newLevel(level, priority).then(function() {
          spfAlert.success('Event created');
          $location.path(urlFor('levelList'));
        }).catch(function() {
          spfAlert.error('Failed to create level.');
        }).finally(function() {
          this.creatingLevel = false;
        });
      };
    }
  ]).

  /**
   * Use to resolve `initialData` of `ClmProblemListCtrl`.
   *
   */
  factory('clmProblemListCtrlInitialData', [
    '$q',
    '$route',
    'spfAuthData',
    'clmDataStore',
    function clmProblemListCtrlInitialDataFactory($q, $route, spfAuthData, clmDataStore) {
      return function clmProblemListCtrlInitialData() {
        var levelId = $route.current.params.levelId;

        return $q.all({
          currentUser: spfAuthData.user().catch(angular.noop),
          profile: clmDataStore.currentUserProfile(),
          level: clmDataStore.problems.getLevel(levelId),
          problems: clmDataStore.problems.getProblems(levelId)
        });
      };
    }
  ]).

  /**
   * Special resolver of `ClmProblemListCtrl`.
   *
   * It will pick the first public level instead of using the level ID in the
   * URL.
   *
   */
  factory('clmProblemContributionCtrlInitialData', [
    '$q',
    '$route',
    'spfAuthData',
    'clmDataStore',
    function clmProblemListCtrlInitialDataFactory($q, $route, spfAuthData, clmDataStore) {
      return function clmProblemListCtrlInitialData() {
        return $q.all({
          currentUser: spfAuthData.user().catch(angular.noop),
          profile: clmDataStore.currentUserProfile(),
          level: clmDataStore.problems.levels({
            orderByChild: 'acceptContribution',
            equalTo: true,
            limitToLast: 1
          }).then(function(levels) {
            if (levels.length === 0) {
              return $q.reject(new Error('No level to accept public contribution yet'));
            }

            return levels[0];
          })
        }).then(function(results) {
          results.problems = clmDataStore.problems.getProblems(results.level.$id);
          return $q.all(results);
        });
      };
    }
  ]).

  /**
   * ClmProblemListCtrl
   *
   * Used to list problems in a level
   *
   */
  controller('ClmProblemListCtrl', [
    'initialData',
    '$location',
    'spfNavBarService',
    'urlFor',
    function ClmProblemListCtrl(initialData, $location, spfNavBarService, urlFor) {
      var self = this;

      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.level = initialData.level;
      this.problems = initialData.problems;

      updateNavBar();

      this.showProblem = function(level, problem) {
        $location.path(urlFor('oneProblem', {levelId: level.$id, problemId: problem.$id}));
      };

      function updateNavBar() {
        var opts = [];
        var newProblemOption = {
          title: 'New Problem',
          url: '#' + urlFor('newProblem', {levelId: self.level.$id}),
          icon: 'add-circle-outline'
        };

        if (self.level && self.level.acceptContribution) {
          opts.push(newProblemOption);
        } else if (
          // The level owner can create problem.
          self.level &&
          self.level.owner &&
          self.currentUser &&
          self.currentUser.publicId &&
          self.level.owner.publicId === self.currentUser.publicId
        ) {
          opts.push(newProblemOption);
        } else if (
          // Admins can create problems.
          self.profile &&
          self.profile.user &&
          self.profile.user.isAdmin
        ) {
          opts.push(newProblemOption);
        }

        spfNavBarService.update(self.level.title, [{
          title: 'Problems',
          url: '#' + urlFor('levelList')
        }], opts);
      }
    }
  ]).

  /**
   * Use to resolve `initialData` of `ClmNewProblemCtrl`.
   *
   * The returned Function returns a promise resolving to an object holding
   * the current user data, the user profile (if registered) and the level data.
   *
   * The promise will fails if the user is not owner of the level (or an admin)
   * and the level doesn't allow public contribution.
   *
   * @return {Function}
   */
  factory('clmNewProblemCtrlInitialData', [
    '$q',
    '$route',
    'spfAuthData',
    'clmDataStore',
    function clmNewProblemCtrlInitialDataFactory($q, $route, spfAuthData, clmDataStore) {
      return function clmNewProblemCtrlInitialData() {
        var levelId = $route.current.params.levelId;

        return $q.all({
          currentUser: spfAuthData.user().catch(angular.noop),
          profile: clmDataStore.currentUserProfile(),
          level: clmDataStore.problems.getLevel(levelId)
        }).then(function(result) {
          if (!result || !result.currentUser) {
            return $q.reject(new Error('You should be logged in to create a problem'));
          }

          if (!result.level || result.level.$value === null) {
            return $q.reject(new Error('Level not found.'));
          }

          // If the user is logged in and the level accepts contribution
          // we can let the user create a problem even if he's not registered
          // or if he's not the owner or admin
          if (result.level && result.level.acceptContribution) {
            return result;
          }

          // The level owner can create problem.
          if (
            result.level &&
            result.level.owner &&
            result.profile &&
            result.profile.$id &&
            result.level.owner.publicId === result.profile.$id
          ) {
            return result;
          }

          // Admins can create problems.
          if (
            result.profile &&
            result.profile.user &&
            result.profile.user.isAdmin
          ) {
            return result;
          }

          // Anybody else will see an error.
          return new Error(
            'You cannot contribute a problem. ' +
            'You are neither the owner of the problem or an admin'
          );
        });
      };
    }
  ]).

  /**
   * ClmNewProblemCtrl - controller used to create a new problem.
   *
   */
  controller('ClmNewProblemCtrl', [
    'initialData',
    '$q',
    '$location',
    'spfFirebase',
    'urlFor',
    'spfNavBarService',
    'spfAlert',
    'spfAuthData',
    'clmDataStore',
    function ClmNewProblemCtrl(
      initialData, $q, $location, spfFirebase, urlFor, spfNavBarService, spfAlert, spfAuthData, clmDataStore
    ) {
      var self = this;

      // Level data
      this.level = initialData.level;

      // current user data.
      this.currentUser = initialData.currentUser;

      // current user class mentors profile.
      this.profile = initialData.profile;

      // check if the profile the completed.
      this.profileNeedsUpdate = !this.currentUser.$completed();

      // saving state
      this.creatingProblem = false;

      spfNavBarService.update('New Problem', [{
        title: 'Problems',
        url: '#' + urlFor('levelList')
      }, {
        title: this.level.title,
        url: '#' + urlFor('oneLevel', {levelId: this.level.$id})
      }]);

      // Handler to create a new problem (and update the current user data/profile).
      this.save = function(currentUser, level, problemType, problem) {
        this.creatingProblem = true;
        return next(currentUser).then(function() {
          problem.owner = {
            publicId: currentUser.publicId,
            displayName: currentUser.displayName,
            gravatar: currentUser.gravatar
          };

          if (problemType === 'linkPattern') {
            delete problem.textResponse;
            delete problem.pythonTutorLink;
            delete problem.expectedOutput;
            delete problem.preCode;
            delete problem.postCode;
          } else if (problemType === 'textResponse') {
            delete problem.linkPattern;
            delete problem.pythonTutorLink;
            delete problem.expectedOutput;
            delete problem.preCode;
            delete problem.postCode;
          } else {
            delete problem.textResponse;
            delete problem.linkPattern;
          }

          return clmDataStore.problems.newProblem(level, problem);
        }).then(function() {
          spfAlert.success('Problem created.');
          $location.path(urlFor('oneLevel', {levelId: level.$id}));
        }).catch(function() {
          spfAlert.error('Failed to create problem.');
        }).finally(function() {
          self.creatingProblem = false;
        });
      };

      // create/update user profile if needed.
      function next(currentUser) {
        if (!self.profile) {
          cleanProfile(currentUser);
          return spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return clmDataStore.initProfile();
          }).then(function(profile) {
            self.profile = profile;
            self.profileNeedsUpdate = !self.currentUser.$completed();
            return profile;
          });
        } else if (self.profileNeedsUpdate) {
          cleanProfile(currentUser);
          return self.currentUser.$save().then(function() {
            self.profileNeedsUpdate = !self.currentUser.$completed();
          });
        } else {
          return $q.when();
        }
      }

      function cleanProfile(currentUser) {
        currentUser.country = spfFirebase.cleanObj(currentUser.country);
        currentUser.school = spfFirebase.cleanObj(currentUser.school);
      }
    }
  ]).

  /**
   * Use to resolve `initialData` of `ClmViewProblemCtrl`.
   *
   */
  factory('clmViewProblemCtrlInitialData', [
    '$q',
    '$route',
    'spfAuthData',
    'clmDataStore',
    function clmViewProblemCtrlInitialDataFactory($q, $route, spfAuthData, clmDataStore) {
      return function clmViewProblemCtrlInitialData() {
        var levelId = $route.current.params.levelId;
        var problemId = $route.current.params.problemId;

        return $q.all({
          currentUser: spfAuthData.user().catch(angular.noop),
          profile: clmDataStore.currentUserProfile(),
          level: clmDataStore.problems.getLevel(levelId),
          problem: clmDataStore.problems.getProblem(levelId, problemId)
        }).then(function(results) {
          if (!results.level || results.level.$value === null) {
            return $q.reject(new Error('Level not found.'));
          }

          if (!results.problem || results.problem.$value === null) {
            return $q.reject(new Error('Problem not found.'));
          }

          return results;
        });
      };
    }
  ]).

  /**
   * ClmViewProblemCtrl
   *
   */
  controller('ClmViewProblemCtrl', [
    'initialData',
    '$location',
    '$log',
    'spfNavBarService',
    'urlFor',
    'spfAlert',
    function ClmViewProblemCtrl(initialData, $location, $log, spfNavBarService, urlFor, spfAlert) {
      var opts = [];
      var self = this;

      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.level = initialData.level;
      this.problem = initialData.problem;

      if (
        (
          this.currentUser &&
          this.problem.owner &&
          this.problem.owner.publicId === this.currentUser.publicId
        ) || (
          this.profile &&
          this.profile.user &&
          this.profile.user.isAdmin
        )
      ) {
        opts = [{
          title: 'Delete',
          onClick: deleteProblem,
          icon: 'delete'
        }];
      }

      spfNavBarService.update(this.problem.title, [{
        title: 'Problems',
        url: '#' + urlFor('levelList')
      }, {
        title: this.level.title,
        url: '#' + urlFor('oneLevel', {levelId: this.level.$id})
      }], opts);

      function deleteProblem() {
        return self.problem.$remove().then(function() {
          spfAlert.success('Problem deleted.');
          $location.path(urlFor('oneLevel', {levelId: self.level.$id}));
        }).catch(function(err) {
          spfAlert.error('Failed to delete problem.');
          $log.error(err);
        });
      }
    }
  ])

  ;

})();
