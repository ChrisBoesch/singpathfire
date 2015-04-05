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

  angular.module('clm', [
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
    home: '/events',
    events: '/events',
    newEvent: '/new-event',
    oneEvent: '/events/:eventId',
    profile: '/profile/:publicId',
    editProfile: '/profile/'
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
  factory('clmDataStore', [
    '$q',
    '$log',
    '$http',
    '$firebaseObject',
    'spfFirebase',
    'spfAuth',
    'spfAuthData',
    'spfCrypto',
    function clmDataStoreFactory($q, $log, $http, $firebaseObject, spfFirebase, spfAuth, spfAuthData, spfCrypto) {
      var clmDataStore;

      clmDataStore = {
        _profileFactory: $firebaseObject.$extend({}),

        profile: function(publicId) {
          return $q.when(publicId).then(function(id) {
            return new clmDataStore._profileFactory(
              spfFirebase.ref(['classMentors/userProfiles', id])
            ).$loaded();
          });
        },

        initProfile: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebase.set(
            ['classMentors/userProfiles', userSync.publicId, 'user'], {
              displayName: userSync.displayName,
              gravatar: userSync.gravatar
            }
          ).then(function() {
            return clmDataStore.profile(userSync.publicId);
          });
        },

        events: {
          list: function() {
            return spfFirebase.array(['classMentors/events'], {
              orderByChild: 'timestamp',
              limitToLast: 50
            });
          },

          create: function(event, password) {
            var hash, eventId;

            return spfFirebase.push(['classMentors/events'], event).then(function(resp) {
              eventId = resp.ref.key();
              hash = spfCrypto.password.newHash(password);
              var opts = {
                hash: hash.value,
                options: hash.options
              };
              return spfFirebase.set(['classMentors/eventPasswords/' + eventId], opts);
            }).then(function() {
              return eventId;
            });
          },

          join: function(eventId, pw) {
            var paths;

            return spfAuthData.user().then(function(authData) {
              paths = {
                hashOptions: ['classMentors/eventPasswords', eventId, 'options'],
                application: ['classMentors/eventApplications', eventId, spfAuth.user.uid],
                participation: ['classMentors/eventParticipants', eventId, authData.publicId]
              };
            }).then(function() {
              return spfFirebase.obj(paths.hashOptions).$loaded();
            }).then(function(options) {
              var hash = spfCrypto.password.fromSalt(pw, options.$value.salt, options.$value);
              return spfFirebase.set(paths.application, hash.value);
            }).then(function() {
              return spfFirebase.set(paths.participation, true);
            });
          },

          leave: function(eventId) {
            return spfAuthData.user().then(function(authData) {
              return spfFirebase.set([
                'classMentors/eventParticipants',
                eventId,
                authData.publicId
              ], false);
            });
          }
        },

        services: {
          errNoPublicId: new Error('The user has not set a user public id.'),

          saveDetails: function(serviceId, userSync, details) {
            if (!userSync || !userSync.publicId) {
              return $q.reject(clmDataStore.services.errNoPublicId);
            }

            return spfFirebase.set(
              ['classMentors/servicesUserIds', serviceId, details.id],
              userSync.publicId
            ).then(function() {
              return spfFirebase.set(
                ['classMentors/userProfiles', userSync.publicId, 'services', serviceId, 'details'], {
                  id: details.id,
                  name: details.name,
                  registeredBefore: {
                    '.sv': 'timestamp'
                  }
                }
              );
            }).then(function(profile) {
              var url = '/api/badges/track/' + userSync.publicId + '/' + serviceId.toLowerCase();
              return $http.post(url).then(function() {
                return profile;
              });
            }).catch(function(err) {
              $log.error(err);
              return $q.reject(new Error('Failed to save user details for ' + serviceId));
            });
          },

          userIdTaken: function(serviceId, userId) {
            return spfFirebase.obj(['classMentors/servicesUserIds', serviceId, userId]).$loaded().then(function(sync) {
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
                  return $q.reject(clmDataStore.services.codeCombat.errLoggedOff);
                }

                if (!resp.data.name) {
                  return $q.reject(clmDataStore.services.codeCombat.errNoName);
                }

                return {
                  id: resp.data._id,
                  name: resp.data.name,
                  points: resp.data.point,
                  levels: resp.data.earned.levels
                };
              }, function(e) {
                $log.error('Failed request to //codecombat.com/auth/whoami: ' + e.toString());
                return $q.reject(clmDataStore.services.codeCombat.errServerError);
              });
            },

            saveDetails: function(userSync, details) {
              return clmDataStore.services.saveDetails('codeCombat', userSync, details);
            },

            userIdTaken: function(userId) {
              return clmDataStore.services.userIdTaken('codeCombat', userId);
            }

          },

          codeSchool: {
            saveDetails: function(userSync, details) {
              return clmDataStore.services.saveDetails('codeSchool', userSync, details);
            },

            userIdTaken: function(userId) {
              return clmDataStore.services.userIdTaken('codeSchool', userId);
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

      return clmDataStore;
    }
  ])

  ;

})();
