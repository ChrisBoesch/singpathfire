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

  angular.module('oep', [
    'angular-loading-bar',
    'firebase',
    'mgcrea.ngStrap',
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
    home: '/ranking',
    editProfile: '/profile',
    profile: '/profile/:publicId',
    ranking: '/ranking'
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
  factory('oepDataStore', [
    '$q',
    '$log',
    '$http',
    'spfFirebaseRef',
    'spfFirebaseSync',
    function oepDataStoreFactory($q, $log, $http, spfFirebaseRef, spfFirebaseSync) {
      var api;

      api = {
        profile: function(publicId) {
          return $q.when(publicId).then(function(publicId) {
            return spfFirebaseSync(['badgeTracker/userProfiles', publicId]).$asObject().$loaded();
          });
        },

        profileInit: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebaseSync(
            ['badgeTracker/userProfiles', userSync.publicId, 'user']
          ).$set({
            displayName: userSync.displayName,
            gravatar: userSync.gravatar
          }).then(function() {
            return api.profile(userSync.publicId);
          });
        },

        services: {
          codeCombat: {
            errServerError: new Error('Failed to get logged in user info from Code Combat.'),
            errLoggedOff: new Error('The user is not logged in to Code Combat.'),
            errNoName: new Error('The user hasn\'t set a name.'),

            currentUser: function() {
              return $http.jsonp('http://codecombat.com/auth/whoami?callback=JSON_CALLBACK').then(function(resp) {
                if (resp.data.anonymous) {
                  return $q.reject(api.services.codeCombat.errLoggedOff);
                }

                if (!resp.data.name) {
                  return $q.reject(api.services.codeCombat.errNoName);
                }

                return {
                  id: resp.data._id,
                  name: resp.data.name,
                  points: resp.data.point,
                  levels: resp.data.earned.levels
                };
              }, function(e) {
                $log.error('Failed request to http://codecombat.com/auth/whoami: ' + e.toString());
                return $q.reject(api.services.codeCombat.errServerError);
              });
            },

            saveDetails: function(userSync, details) {
              if (!userSync || !userSync.publicId) {
                return $q.reject(new Error('The user has not set a user public id.'));
              }

              return spfFirebaseSync(
                ['badgeTracker/servicesUserIds/codeCombat']
              ).$set(details.id, userSync.publicId).then(function() {
                return spfFirebaseSync(
                  ['badgeTracker/userProfiles', userSync.publicId, 'services/codeCombat']
                ).$set('details', {
                  id: details.id,
                  name: details.name,
                  registeredBefore: {
                    '.sv': 'timestamp'
                  }
                });
              });
            }
          }
        }

      };

      return api;
    }
  ])

  ;

})();
