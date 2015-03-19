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
    'spf.shared.material'
  ]).

  /**
   * Label paths - to be used by each component to configure their route.
   *
   * See src/app/components/events for example.
   *
   */
  constant('routes', {
    home: '/problems',
    profile: '/profile',
    problems: '/problems',
    newProblem: '/new-problem',
    playProblem: '/problems/:problemId/play',
    editProblem: '/problems/:problemId/edit'
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
    'spfAuth',
    'spfFirebase',
    function spfDataStoreFactory($window, $q, $http, $log, $firebaseUtils, $firebaseObject, spfAuth, spfFirebase) {
      var spfDataStore;

      spfDataStore = {
        _profileFactory: $firebaseObject.$extend({
          hasSolved: function(problem) {
            return (
              this.solutions &&
              this.solutions[problem.$id] &&
              this.solutions[problem.$id].solved
            );
          },

          hasStarted: function(problem) {
            return (
              this.solutions &&
              this.solutions[problem.$id] &&
              this.solutions[problem.$id].startedAt
            );
          },

          workingOn: function(problem) {
            return (
              this.solutions &&
              this.solutions[problem.$id] &&
              this.solutions[problem.$id].startedAt &&
              !this.solutions[problem.$id].solved
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

        problems: {
          errDeleteFailed: new Error('Failed to delete the problem and its solutions'),

          _Factory: $firebaseObject.$extend({
            $canBeEditedBy: function(user) {
              return this.owner.publicId === user.publicId;
            },

            $remove: function() {
              var problemId = this.$id;

              return $firebaseObject.prototype.$remove.apply(this).then(function(){
                return $http.delete('/api/problems/' + problemId);
              }).catch(function(err) {
                $log.error(err);
                return $q.reject('Failed to delete this problem.');
              });
            }
          }),

          list: function() {
            return spfFirebase.array(['singpath/problems'], {
              orderByChild: 'timestamp',
              limitToLast: 50
            }).$loaded();
          },

          create: function(problem) {
            return spfFirebase.push(['singpath/problems'], problem).then(function(resp) {
              return resp.ref;
            });
          },

          get: function(problemId) {
            return new spfDataStore.problems._Factory(
              spfFirebase.ref(['singpath/problems', problemId])
            ).$loaded();
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
          get: function(problemId, publicId) {
            if (!publicId) {
              return $q.reject(spfDataStore.solutions.errMissingPublicId);
            }

            if (!problemId) {
              return $q.reject(spfDataStore.solutions.errMissingProblemId);
            }

            return spfFirebase.obj(
              ['singpath/solutions', problemId, publicId]
            ).$loaded();
          },

          create: function(problem, publicId, solution) {
            if (!publicId) {
              return $q.reject(spfDataStore.solutions.errMissingPublicId);
            }

            if (!problem.$id) {
              return $q.reject(spfDataStore.solutions.errMissingProblemId);
            }

            return spfFirebase.set(
              ['singpath/solutions', problem.$id, publicId], {
                language: problem.language,
                solution: solution.solution,
                tests: problem.tests
              }
            ).then(function() {
              return $http.post('/api/solution/' + problem.$id + '/' + publicId).catch(function(err) {
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
              var self = this;

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
                  self.$id,
                  'solutions',
                  self.$ref().parent().key()
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

          get: function(problemId, publicId) {
            return new spfDataStore.resolutions._Factory(spfFirebase.ref(
              ['singpath/resolutions', problemId, publicId]
            )).$loaded();
          }

        }
      };

      return spfDataStore;
    }
  ])

  ;

})();
