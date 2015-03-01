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
    '$q',
    '$http',
    '$log',
    'spfAuth',
    'spfFirebaseSync',
    function spfDataStoreFactory($q, $http, $log, spfAuth, spfFirebaseSync) {
      var spfDataStore;

      spfDataStore = {
        profile: function(publicId) {
          return $q.when(publicId).then(function(publicId) {
            return spfFirebaseSync(['singpath/userProfiles', publicId]).$asObject().$loaded();
          });
        },

        initProfile: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebaseSync(
            ['singpath/userProfiles', userSync.publicId, 'user']
          ).$set({
            displayName: userSync.displayName,
            gravatar: userSync.gravatar
          }).then(function() {
            return spfDataStore.profile(userSync.publicId);
          });
        },

        problems: {
          list: function() {
            return spfFirebaseSync(['singpath/problems'], {
              orderByChild: 'timestamp',
              limitToLast: 50
            }).$asArray();
          },

          create: function(problem) {
            return spfFirebaseSync(['singpath/problems']).$push(problem).then(function(ref) {
              return ref;
            });
          },

          get: function(problemId) {
            return spfFirebaseSync(['singpath/problems', problemId]).$asObject();
          }
        },

        solutions: {
          errMissingPublicId: new Error('No public id for the solution'),
          errMissingProblemId: new Error('The problem has no id. Is it saved?'),
          errStartVerifcation: new Error('Failed to initiate solution verification'),
          errSaveSolution: new Error('Failed to save solution.'),

          get: function(problemId, publicId) {
            if (!publicId) {
              return $q.reject(spfDataStore.solutions.errMissingPublicId);
            }

            if (!problemId) {
              return $q.reject(spfDataStore.solutions.errMissingProblemId);
            }

            return spfFirebaseSync(
              ['singpath/solutions', problemId, publicId]
            ).$asObject();
          },

          create: function(problem, publicId, solution) {
            if (!publicId) {
              return $q.reject(spfDataStore.solutions.errMissingPublicId);
            }

            if (!problem.$id) {
              return $q.reject(spfDataStore.solutions.errMissingProblemId);
            }

            return spfFirebaseSync(
              ['singpath/solutions', problem.$id]
            ).$set(publicId, {
              language: problem.language,
              solution: solution.solution,
              tests: problem.tests,
            }).then(function(){
              return $http.post('/api/solution/' + problem.$id + '/' + publicId).catch(function(err) {
                $log.error(err);
                return $q.reject(spfDataStore.solutions.errStartVerifcation);
              });
            }, function(err) {
              $log.error(err);
              return $q.reject(spfDataStore.solutions.errSaveSolution);
            });
          }
        }
      };

      return spfDataStore;
    }
  ])

  ;

})();
