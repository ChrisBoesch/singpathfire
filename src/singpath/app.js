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
    newProblem: '/new-problem'
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
    'spfAuth',
    'spfFirebaseSync',
    function spfDataStoreFactory($q, spfAuth, spfFirebaseSync) {
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
            return spfFirebaseSync(['singpath/problems']).$push(problem).then(function(ref){
              return ref;
            });
          }
        }
      };

      return spfDataStore;
    }
  ])

  ;

})();
