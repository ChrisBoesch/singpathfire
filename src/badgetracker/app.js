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
    'spfFirebase',
    function oepDataStoreFactory($q, $log, $http, spfFirebase) {
      var oepDataStore;

      oepDataStore = {
        profile: function(publicId) {
          return $q.when(publicId).then(function(id) {
            return spfFirebase.obj(['badgeTracker/userProfiles', id]).$loaded();
          });
        },

        profileInit: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebase.set(['badgeTracker/userProfiles', userSync.publicId, 'user'], {
            displayName: userSync.displayName,
            gravatar: userSync.gravatar
          }).then(
            function() {
              return oepDataStore.profile(userSync.publicId);
            },
            function(err) {
              $log.error(err);
              return $q.reject(new Error('Failed to set badge tracker profile'));
            }
          );
        },

        services: {
          errNoPublicId: new Error('The user has not set a user public id.'),

          saveDetails: function(serviceId, userSync, details) {
            if (!userSync || !userSync.publicId) {
              return $q.reject(oepDataStore.services.errNoPublicId);
            }

            return spfFirebase.set(
              ['badgeTracker/servicesUserIds/' + serviceId + '/' + details.id],
              userSync.publicId
            ).then(function() {
              return spfFirebase.set(
                ['badgeTracker/userProfiles', userSync.publicId, 'services/' + serviceId], {
                  id: details.id,
                  name: details.name,
                  registeredBefore: {
                    '.sv': 'timestamp'
                  }
                }
              );
            }).then(function(profile) {
              return $http.post('/api/badges/track/' + userSync.publicId + '/' + serviceId.toLowerCase()).then(
                function() {
                  return profile;
                });
            }).catch(function(err) {
              $log.error(err);
              return $q.reject(new Error('Failed to user details for ' + serviceId));
            });
          },

          userIdTaken: function(serviceId, userId) {
            return spfFirebase.obj(['badgeTracker/servicesUserIds', serviceId, userId]).$loaded().then(function(sync) {
              return sync.$value !== null;
            });
          },

          codeCombat: {
            errServerError: new Error('Failed to get logged in user info from Code Combat.'),
            errLoggedOff: new Error('The user is not logged in to Code Combat.'),
            errNoName: new Error('The user hasn\'t set a name.'),

            currentUser: function() {
              return $http.jsonp('//codecombat.com/auth/whoami?callback=JSON_CALLBACK').then(function(resp) {
                if (resp.data.anonymous) {
                  return $q.reject(oepDataStore.services.codeCombat.errLoggedOff);
                }

                if (!resp.data.name) {
                  return $q.reject(oepDataStore.services.codeCombat.errNoName);
                }

                return {
                  id: resp.data._id,
                  name: resp.data.name,
                  points: resp.data.point,
                  levels: resp.data.earned.levels
                };
              }, function(e) {
                $log.error('Failed request to //codecombat.com/auth/whoami: ' + e.toString());
                return $q.reject(oepDataStore.services.codeCombat.errServerError);
              });
            },

            saveDetails: function(userSync, details) {
              return oepDataStore.services.saveDetails('codeCombat', userSync, details);
            },

            userIdTaken: function(userId) {
              return oepDataStore.services.userIdTaken('codeCombat', userId);
            }

          },

          codeSchool: {
            saveDetails: function(userSync, details) {
              return oepDataStore.services.saveDetails('codeSchool', userSync, details);
            },

            userIdTaken: function(userId) {
              return oepDataStore.services.userIdTaken('codeSchool', userId);
            },

            userIdExist: function(userId) {
              if (!userId) {
                return $q.when(false);
              }

              return $http.get('/api/services/codeschool/users/' + userId).then(function() {
                return true;
              }).catch(function() {
                return false;
              });
            }
          }
        }

      };

      return oepDataStore;
    }
  ])

  ;

})();
