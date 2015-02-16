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

  config([
    '$provide',
    function($provide) {
      $provide.decorator('$firebase', [
        '$delegate',
        '$timeout',
        'cfpLoadingBar',
        function($delegate, $timeout, cfpLoadingBar) {
          var latencyThreshold = 100;
          var requests = 0;
          var completedRequest = 0;
          var timeout = null;
          var started = false;

          function start() {
            if (started) {
              cfpLoadingBar.start();
              return;
            }

            if (timeout) {
              return;
            }

            timeout = setTimeout(function() {
              if (requests) {
                cfpLoadingBar.start();
                started = true;
                timeout = null;
              }
            }, latencyThreshold);
          }

          function incr() {
            requests += 1;
            start();
          }

          function complete() {
            completedRequest += 1;
            if (requests === completedRequest) {
              cfpLoadingBar.complete();
              requests = completedRequest = 0;
              started = false;
              if (timeout) {
                $timeout.cancel(timeout);
                timeout = null;
              }
            }
          }


          ['$asArray', '$asObject'].map(function(k) {
            var _super = $delegate.prototype[k];
            $delegate.prototype[k] = function() {
              var result = _super.apply(this, arguments);

              incr();
              result.$loaded().finally(complete);

              return result;
            };
          });

          ['$push', '$remove', '$set', '$update'].map(function(k) {
            var _super = $delegate.prototype[k];
            $delegate.prototype[k] = function() {
              var result = _super.apply(this, arguments);

              incr();
              result.finally(complete);

              return result;
            };
          });


          return $delegate;
        }
      ]);
    }
  ]).


  /**
   * Service to interact with singpath firebase db
   *
   */
  factory('clmDataStore', [
    '$q',
    '$log',
    'spfFirebaseSync',
    'spfAuth',
    'spfCrypto',
    function clmDataStoreFactory($q, $log, spfFirebaseSync, spfAuth, spfCrypto) {
      var api;

      api = {
        events: {
          list: function() {
            return spfFirebaseSync(['classMentors/events'], {
              orderByChild: 'timestamp',
              limitToLast: 50
            }).$asArray();
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
              return spfFirebaseSync(['classMentors/eventPasswords']).$set(eventId, opts);
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
              return spfFirebaseSync(paths.participation).$set(true);
            }

            return spfFirebaseSync(paths.hashOptions).$asObject().$loaded().then(function(options) {
              var hash = spfCrypto.password.fromSalt(pw, options.$value.salt, options.$value);
              return spfFirebaseSync(paths.application).$set(hash.value);
            }).then(function() {
              return spfFirebaseSync(paths.participation).$set(true);
            });
          }
        },

        leave: function(eventId) {
          if (!spfAuth.user || !spfAuth.user.uid) {
            return $q.reject(new Error('A user should be logged in to create an event.'));
          }

          return spfFirebaseSync([
            'classMentors/eventParticipants',
            eventId,
            spfAuth.user.uid
          ]).$set(false);
        }
      };

      return api;
    }
  ])

  ;

})();
