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

        return {
          auth: spfAuth,
          currentUser: userPromise.catch(angular.noop),
          profile: spfDataStore.currentUserProfile(),
          path: spfDataStore.paths.get(pathId),
          level: spfDataStore.levels.get(pathId, levelId),
          problems: spfDataStore.problems.list(pathId, levelId)
        };
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
    'spfDataStore',
    function editProblemsCtrlInitialDataFactory($q, baseProblemListResolver, spfDataStore) {
      return function editProblemsCtrlInitialData() {
        var errCannotEdit = new Error('You cannot edit this level');
        var data = baseProblemListResolver();

        data.profile = data.profile.then(function(profile) {
          if (profile && profile.$value === null) {
            return spfDataStore.initProfile();
          }

          return profile;
        });

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
    '$q',
    'initialData',
    'urlFor',
    'spfFirebase',
    'spfDataStore',
    'spfAuthData',
    'spfAlert',
    'spfNavBarService',
    function EditProblemsCtrl(
      $log, $q, initialData, urlFor, spfFirebase, spfDataStore, spfAuthData, spfAlert, spfNavBarService
    ) {
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

      this.profileNeedsUpdate = !this.currentUser.$completed();

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
        return next(self.currentUser).then(function() {
          return problems.$save(index);
        }).then(function(data) {
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

        return next(currentUser).then(function() {
          return problems.$add(newProblem);
        }).then(function(ref) {
          spfAlert.success('Problem created');
          self.newProblem = {};
          return ref;
        }).catch(function(err) {
          $log.error(err);
          spfAlert.error('Failed to create the problem');
        });
      };

      function next(currentUser) {
        if (!self.profile) {
          cleanProfile();
          return spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return spfDataStore.initProfile();
          }).then(function(profile) {
            self.profile = profile;
            self.profileNeedsUpdate = !self.currentUser.$completed();
            return profile;
          });
        } else if (self.profileNeedsUpdate) {
          cleanProfile();
          return self.currentUser.$save().then(function() {
            self.profileNeedsUpdate = !self.currentUser.$completed();
          });
        } else {
          return $q.when();
        }
      }

      function cleanProfile() {
        self.currentUser.country = spfFirebase.cleanObj(self.currentUser.country);
        self.currentUser.school = spfFirebase.cleanObj(self.currentUser.school);
      }
    }
  ]).

  /**
   * Use to resolve `initialData` of `PlayProblemCtrl`.
   *
   */
  factory('playProblemCtrlInitialData', [
    '$log',
    '$q',
    '$location',
    '$route',
    'urlFor',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function playProblemCtrlInitialDataFactory(
      $log, $q, $location, $route, urlFor, spfAuth, spfAuthData, spfDataStore
    ) {
      return function playProblemCtrlInitialData() {
        var pathId = $route.current.params.pathId;
        var levelId = $route.current.params.levelId;
        var problemId = $route.current.params.problemId;
        var errPublicIdMissing = new Error('No public ID');
        var errProblemNotFound = new Error('Problem not found.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.when({});
        }

        // 1. Check the user has a public ID and load the profile.
        return spfAuthData.user().then(function(authData) {
          if (!authData || !authData.publicId) {
            return $q.reject(errPublicIdMissing);
          }

          return $q.all({
            auth: spfAuth,
            currentUser: authData,
            profile: spfDataStore.profile(authData.publicId)
          });

        // 2. get problem and the user solution.
        }).then(function(data) {
          if (data.profile.$value === null) {
            data.profile = spfDataStore.initProfile();
          }

          data.path = spfDataStore.paths.get(pathId);
          data.level = spfDataStore.levels.get(pathId, levelId);
          data.problem = spfDataStore.problems.get(pathId, levelId, problemId);

          return $q.all(data);

        // 3. Check the problem exist and load the user solution.
        }).then(function(data) {
          // The view shouldn't load if the problem doesn't exist.
          if (!data.problem || data.problem.$value === null) {
            return $q.reject(errProblemNotFound);
          }

          data.solution = spfDataStore.solutions.get(
            data.problem, data.currentUser
          );

          return $q.all(data);

        // 4. solution state
        }).then(function(data) {
          // The solution might need to be started.
          if (!data.solution.$isStarted()) {
            return data.solution.$reset().then(function() {
              return data;
            });
          }

          // The solution state might not be correctly set in the profile
          return data.solution.$register(data.profile).then(function() {
            return data;
          });

        // 5. recover from public id missing.
        }).catch(function(err) {
          if (err !== errPublicIdMissing) {
            $log.error(err);
            return $q.reject(err);
          }

          return $q.all({
            auth: spfAuth,
            currentUser: spfAuthData.user()
          });
        });
      };
    }
  ]).

  /**
   * PlayProblemCtrl
   *
   */
  controller('PlayProblemCtrl', [
    '$scope',
    '$q',
    '$log',
    '$location',
    'initialData',
    '$route',
    'urlFor',
    'spfFirebase',
    'spfNavBarService',
    'spfAlert',
    'spfAuthData',
    'spfDataStore',
    function PlayProblemCtrl(
      $scope, $q, $log, $location, initialData, $route,
      urlFor, spfFirebase, spfNavBarService, spfAlert, spfAuthData, spfDataStore
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

      this.savingSolution = false;
      this.solutionSaved = false;
      original.solution = (
        this.solution &&
        this.solution.payload &&
        this.solution.payload.solution
      );
      this.profileNeedsUpdate = this.currentUser && !this.currentUser.$completed();

      this.register = function(currentUser) {
        cleanProfile();
        spfAuthData.publicId(currentUser).then(function() {
          spfAlert.success('Public id and display name saved');
          return spfDataStore.initProfile();
        }).then(function() {
          $route.reload();
        }).catch(function() {
          spfAlert.error('Failed to save public id');
        });
      };

      if (
        !this.auth ||
        !this.auth.user ||
        !this.auth.user.uid ||
        !this.profile
      ) {
        return;
      }

      init();

      this.solve = function(currentUser, problem, solution) {
        var next;

        self.savingSolution = true;

        if (!self.profile) {
          cleanProfile();
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return spfDataStore.initProfile();
          }).then(function(profile) {
            self.profile = profile;
            return profile;
          });
        } else if (self.profileNeedsUpdate) {
          cleanProfile();
          next = self.currentUser.$save();
        } else {
          next = $q.when();
        }

        next.then(function() {
          self.profileNeedsUpdate = !self.currentUser.$completed();
        }).then(function() {
          return self.solution.$submit(solution);
        }).then(function() {
          spfAlert.success('Solution saved');
        }).then(function() {
          self.solution.$monitorTask();
        }).catch(function(err) {
          spfAlert.error(err.message || err.toString());
        }).finally(function() {
          self.savingSolution = false;
          self.solutionSaved = true;
          original.solution = solution;
        });
      };

      this.reset = function(solution) {
        solution.solution = '';
      };

      this.solutionChanged = function(solution) {
        this.solutionSaved = this.solutionSaved && original.solution === solution;
      };

      function init() {
        var fns = [
          self.profile,
          self.path,
          self.level,
          self.problem,
          self.solution
        ].map(function(obj) {
          return obj && obj.$destroy && obj.$destroy.bind && obj.$destroy.bind(obj);
        }).filter(function(fn) {
          return angular.isFunction(fn);
        });

        $scope.$on('$destroy', function() {
          fns.map(function(fn) {
            try {
              fn();
            } catch (e) {
              $log.error(e);
            }
          });
        });

        spfNavBarService.update(
          self.problem.title,
          [{
            title: 'Paths',
            url: '#' + urlFor('paths')
          }, {
            title: self.path.title,
            url: '#' + urlFor('levels', {pathId: self.path.$id})
          }, {
            title: self.level.title,
            url: '#' + urlFor('problems', {pathId: self.path.$id, levelId: self.level.$id})
          }], []
        );

        return fns;
      }

      function cleanProfile() {
        self.currentUser.country = spfFirebase.cleanObj(self.currentUser.country);
        self.currentUser.school = spfFirebase.cleanObj(self.currentUser.school);
      }
    }
  ])

  ;

})();
