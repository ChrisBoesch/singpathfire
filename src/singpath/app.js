/**
 * Defines the SingPath Fire angular app and its main services and controllers.
 *
 * If was to become too big, only config and contants should be kept here;
 * controllers could be sent off to a main/main-controllers.js and services
 * to mani/main-services.js.
 *
 */
(function() {
  'use strict';

  angular.module('spf', [
    'angular-loading-bar',
    'firebase',
    'ngAnimate',
    'ngMessages',
    'ngRoute',
    'spf.shared'
  ]).

  /**
   * Label paths - to be used by each component to configure their route.
   *
   * See src/app/components/events for example.
   *
   */
  constant('routes', {
    home: '/paths',
    profile: '/profile',
    paths: '/paths',
    newPath: '/paths/new-path',
    levels: '/paths/:pathId/levels',
    newLevel: '/paths/:pathId/levels/new-level',
    problems: '/paths/:pathId/levels/:levelId/problems',
    editProblems: '/paths/:pathId/levels/:levelId/edit',
    playProblem: '/paths/:pathId/levels/:levelId/problems/:problemId/play'
  }).

  /**
   * Configure routes default route and cfpLoadingBar options.
   *
   */
  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.otherwise({
        redirectTo: routes.home
      });
    }
  ]).

  /**
   * Service to interact with singpath firebase db
   *
   */
  factory('spfDataStore', [
    '$window',
    '$q',
    '$http',
    '$log',
    '$firebaseUtils',
    '$firebaseObject',
    '$firebaseArray',
    'spfAuth',
    'spfFirebase',
    function spfDataStoreFactory(
      $window, $q, $http, $log, $firebaseUtils, $firebaseObject, $firebaseArray, spfAuth, spfFirebase
    ) {
      var spfDataStore;

      spfDataStore = {
        _profileFactory: $firebaseObject.$extend({
          $hasSolved: function(problem) {
            var solution = this.$solution(problem);
            return solution && solution.solved;
          },

          $hasStarted: function(problem) {
            var solution = this.$solution(problem);
            return solution && solution.startedAt;
          },

          $workingOn: function(problem) {
            var solution = this.$solution(problem);
            return solution && solution.startedAt && !solution.solved;
          },

          $solution: function(problem) {
            return (
              problem &&
              this.solutions &&
              this.solutions[problem.$pathId] &&
              this.solutions[problem.$pathId][problem.$levelId] &&
              this.solutions[problem.$pathId][problem.$levelId][problem.$id]
            );
          }

        }),

        profile: function(publicId) {
          return $q.when(publicId).then(function(id) {
            return new spfDataStore._profileFactory(
              spfFirebase.ref(['singpath/userProfiles', id])
            ).$loaded();
          });
        },

        initProfile: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebase.set(
            ['singpath/userProfiles', userSync.publicId, 'user'], {
              displayName: userSync.displayName,
              gravatar: userSync.gravatar
            }
          ).then(function() {
            return spfDataStore.profile(userSync.publicId);
          });
        },

        paths: {
          _Factory: $firebaseObject.$extend({
            $canBeEditedBy: function(user) {
              return user && this.owner.publicId === user.publicId;
            }
          }),

          list: function() {
            return spfFirebase.array('singpath/paths', {
              orderByKey: undefined,
              limitToLast: 50
            }).$loaded();
          },

          create: function(path) {
            return spfFirebase.push(['singpath/paths'], path).then(function(resp) {
              return resp.ref;
            });
          },

          get: function(pathId) {
            return new spfDataStore.paths._Factory(
              spfFirebase.ref(['singpath/paths', pathId])
            ).$loaded();
          }
        },

        levels: {
          _Factory: $firebaseObject.$extend({
            $canBeEditedBy: function(user) {
              return user && this.owner.publicId === user.publicId;
            },

            pathId: function() {
              return this.$ref().parent().key();
            }
          }),

          list: function(pathId) {
            return spfFirebase.array(['singpath/levels', pathId], {
              orderByKey: undefined,
              limitToLast: 50
            }).$loaded();
          },

          get: function(pathId, levelId) {
            return new spfDataStore.levels._Factory(
              spfFirebase.ref(['singpath/levels', pathId, levelId])
            ).$loaded();
          },

          create: function(pathId, level) {
            return spfFirebase.push(['singpath/levels', pathId], level).then(function(resp) {
              return resp.ref;
            });
          }
        },

        problems: {
          errDeleteFailed: new Error('Failed to delete the problem and its solutions'),

          _Factory: $firebaseObject.$extend({
            $canBeEditedBy: function(user) {
              return this.owner.publicId === user.publicId;
            },

            $remove: function() {
              var level = this.$ref().parent();
              var path = level.parent().key();
              var problemId = this.$id;

              return $firebaseObject.prototype.$remove.apply(this).then(function() {
                return $http.delete(
                  '/'.join([
                    '/api/paths', path.key(),
                    'levels', level.key(),
                    'problems', problemId
                  ])
                );
              }).catch(function(err) {
                $log.error(err);
                return $q.reject('Failed to delete this problem.');
              });
            }
          }),

          _itemFactory: $firebaseArray.$extend({
            $$added: function(snap) {
              var problem = $firebaseArray.prototype.$$added.apply(this, arguments);
              problem.$levelId = snap.ref().parent().key();
              problem.$pathId = snap.ref().parent().parent().key();
              return problem;
            }
          }),

          list: function(pathId, levelId) {
            return new spfDataStore.problems._itemFactory(
              spfFirebase.ref(['singpath/problems', pathId, levelId]
            )).$loaded();
          },

          create: function(pathId, levelId, problem) {
            return spfFirebase.push(['singpath/problems', pathId, levelId], problem).then(function(resp) {
              return resp.ref;
            });
          },

          get: function(pathId, levelId, problemId) {
            return new spfDataStore.problems._Factory(
              spfFirebase.ref(['singpath/problems', pathId, levelId, problemId])
            ).$loaded(function(problem) {
              problem.$levelId = problem.$ref().parent().key();
              problem.$pathId = problem.$ref().parent().parent().key();
              return problem;
            });
          }
        },

        /**
         * Api to create and get a solution to a problem.
         *
         * Note that solution are on accesible while working on it. Once, a
         * solution is resolved, it won't be readable.
         *
         */
        solutions: {
          errMissingPublicId: new Error('No public id for the solution'),
          errMissingProblemId: new Error('The problem has no id. Is it saved?'),
          errStartVerifcation: new Error('Failed to initiate solution verification'),
          errSaveSolution: new Error('Failed to save solution.'),

          /**
           * Return an unsolved solution; a solution that has failed
           * verification.
           */
          get: function(pathId, levelId, problemId, publicId) {
            if (!publicId) {
              return $q.reject(spfDataStore.solutions.errMissingPublicId);
            }

            if (!problemId) {
              return $q.reject(spfDataStore.solutions.errMissingProblemId);
            }

            return spfFirebase.obj(
              ['singpath/solutions', pathId, levelId, problemId, publicId]
            ).$loaded();
          },

          create: function(problem, publicId, solution) {
            var level = problem.$ref().parent();
            var path = level.parent();

            if (!publicId) {
              return $q.reject(spfDataStore.solutions.errMissingPublicId);
            }

            if (!problem.$id) {
              return $q.reject(spfDataStore.solutions.errMissingProblemId);
            }

            return spfFirebase.set(
              ['singpath/solutions', path.key(), level.key(), problem.$id, publicId], {
                language: problem.language,
                solution: solution.solution,
                tests: problem.tests
              }
            ).then(function() {
              return $http.post([
                '/api/paths', path.key(),
                'levels', level.key(),
                'problems', problem.$id,
                'solutions', publicId
              ].join('/')).catch(function(err) {
                $log.error(err);
                return $q.reject(spfDataStore.solutions.errStartVerifcation);
              });
            }, function(err) {
              $log.error(err);
              return $q.reject(spfDataStore.solutions.errSaveSolution);
            });
          }
        },

        resolutions: {
          errCannotStart: new Error(
            'The resolution is already started. ' +
            'You can restart a solution once you solved it.'
          ),
          errCannotReset: new Error(
            'The solution needs to be solved to be reset.'
          ),
          errNotResolved: new Error('The solution is not resolved yet.'),

          _Factory: $firebaseObject.$extend({
            $init: function() {
              var problem = this.$ref().parent();
              var level = problem.parent();
              var path = level.parent();
              var publicId = this.$id;

              if (this.$value !== null) {
                return $q.reject(spfDataStore.resolutions.errCannotStart);
              }

              this.startedAt = {
                '.sv': 'timestamp'
              };

              return this.$save().then(function(ref) {
                return $q(function(resolve, reject) {
                  ref.once('value', resolve, reject);
                });
              }).then(function(snapshot) {
                return spfFirebase.set([
                  'singpath/userProfiles',
                  publicId,
                  'solutions',
                  path.key(),
                  level.key(),
                  problem.key()
                ], {
                  startedAt: snapshot.val().startedAt
                });
              });
            },

            $reset: function() {
              if (!this.output && !this.output.solved) {
                return $q.reject(spfDataStore.resolutions.errCannotReset);
              }

              $firebaseUtils.updateRec(this, {
                startedAt: {
                  '.sv': 'timestamp'
                }
              });
              return this.$save();
            },

            $solved: function() {
              return this.output && this.output.solved;
            },

            $duration: function() {
              if (!this.solved) {
                throw spfDataStore.resolutions.errNotResolved;
              }
              return $window.moment.duration(this.endedAt - this.startedAt).humanize();
            }
          }),

          get: function(pathId, levelId, problemId, publicId) {
            return new spfDataStore.resolutions._Factory(spfFirebase.ref(
              ['singpath/resolutions', pathId, levelId, problemId, publicId]
            )).$loaded();
          }

        }
      };

      return spfDataStore;
    }
  ])

  ;

})();
