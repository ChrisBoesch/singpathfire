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
    home: '/events',
    events: '/events'
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
    'spfFirebase',
    'spfAuth',
    'spfCrypto',
    function clmDataStoreFactory($q, $log, spfFirebase, spfAuth, spfCrypto) {
      var api;

      api = {
        events: {
          list: function() {
            return spfFirebase.array(['classMentors/events'], {
              orderByChild: 'timestamp',
              limitToLast: 50
            });
          },

          create: function(collection, data, password) {
            var hash, eventId;

            if (!spfAuth.user || !spfAuth.user.uid) {
              return $q.reject(new Error('A user should be logged in to create an event.'));
            }

            if (!password) {
              return $q.reject(new Error('An event should have a password.'));
            }

            return collection.$add(data).then(function(ref) {
              eventId = ref.key();
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
            if (!spfAuth.user || !spfAuth.user.uid) {
              return $q.reject(new Error('A user should be logged in to create an event.'));
            }

            var paths = {
              hashOptions: ['classMentors/eventPasswords', eventId, 'options'],
              application: ['classMentors/eventApplications', eventId, spfAuth.user.uid],
              participation: ['classMentors/eventParticipants', eventId, spfAuth.user.uid]
            };

            // The owner can join without password.
            if (pw === null) {
              return spfFirebase.set(paths.participation, true);
            }

            return spfFirebase.obj(paths.hashOptions).$loaded().then(function(options) {
              var hash = spfCrypto.password.fromSalt(pw, options.$value.salt, options.$value);
              return spfFirebase.set(paths.application, hash.value);
            }).then(function() {
              return spfFirebase.set(paths.participation, true);
            });
          }
        },

        leave: function(eventId) {
          if (!spfAuth.user || !spfAuth.user.uid) {
            return $q.reject(new Error('A user should be logged in to create an event.'));
          }

          return spfFirebase.set([
            'classMentors/eventParticipants',
            eventId,
            spfAuth.user.uid
          ], false);
        }
      };

      return api;
    }
  ])

  ;

})();
