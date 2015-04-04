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
    oneEvent: '/events/:eventId'
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
    '$firebaseObject',
    'spfFirebase',
    'spfAuth',
    'spfAuthData',
    'spfCrypto',
    function clmDataStoreFactory($q, $log, $firebaseObject, spfFirebase, spfAuth, spfAuthData, spfCrypto) {
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
          }
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
      };

      return clmDataStore;
    }
  ])

  ;

})();
