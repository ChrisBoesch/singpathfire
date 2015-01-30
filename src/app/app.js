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
    'mgcrea.ngStrap',
    'ngAnimate',
    'ngRoute'
  ]).

  /**
   * Label paths - to be used by each component to configure their route.
   *
   * See src/app/components for example.
   *
   */
  constant('routes', {
    classMentor: '/class-mentors'
  }).

  /**
   * Configure routes default route and cfpLoadingBar options.
   *
   */
  config([
    '$routeProvider',
    'cfpLoadingBarProvider',
    'routes',
    function($routeProvider, cfpLoadingBarProvider, routes) {
      $routeProvider.otherwise({
        redirectTo: routes.classMentor
      });

      cfpLoadingBarProvider.includeSpinner = false;
    }
  ]).


  /**
   * spfFirebaseRef return a Firebase reference to singpath database,
   * at a specific path; e.g:
   *
   *    // return ref to "https://singpath.firebaseio.com/auth/users/google:12345"
   *    spfFirebaseRef('auth/users', 'google:12345');
   *
   * The base url is configurable with `spfFirebaseProvider.setBaseUrl`:
   *
   *    angular.module('spf').config([
   *      'spfFirebaseRefProvider',
   *      function(spfFirebaseRefProvider){
   *          spfFirebaseRefProvider.setBaseUrl(newBaseUrl);
   *      }
   *    ])
   *
   */
  provider('spfFirebaseRef', function SpfFirebaseProvider() {
    var baseUrl = 'https://singpath.firebaseio.com/';

    this.setBaseUrl = function(url) {
      baseUrl = url;
    };

    this.$get = ['$window', '$log', function spfFirebaseRefFactory($window, $log) {
      return function spfFirebaseRef() {
        var ref = new $window.Firebase(baseUrl);

        $log.info('spf will connect to ' + baseUrl + ' singpath database.');
        for (var i = 0; i < arguments.length; i++) {
          ref = ref.child(arguments[i]);
        }

        return ref;
      };
    }];

  }).


  /**
   * Returns an object with `user` (Firebase auth user data) property,
   * and login/logout methods.
   */
  factory('spfAuth', [
    '$q',
    '$firebaseAuth',
    'spfFirebaseRef',
    function($q, $firebaseAuth, spfFirebaseRef) {
      var auth = $firebaseAuth(spfFirebaseRef());

      return {
        // The current user auth data (null is not authenticated).
        user: auth.$getAuth(),

        /**
         * Start Oauth authentication dance against google oauth2 service.
         *
         * It will attempt the process using a pop up and fails back on
         * redirect.
         *
         * Updates spfAuth.user and return a promise resolving to the
         * current user auth data.
         *
         */
        login: function() {
          var self = this;

          return auth.$authWithOAuthPopup('google').then(function(user) {
            self.user = user;
            return user;
          }, function(error) {
            // spfAlert.warning('You failed to authenticate with Google');
            if (error.code === 'TRANSPORT_UNAVAILABLE') {
              return auth.$authWithOAuthRedirect('google');
            }
            return $q.reject(error);
          });
        },

        /**
         * Unauthenticate user and reset spfAuth.user.
         *
         */
        logout: function() {
          auth.$unauth();
          this.user = undefined;
        }

      };
    }
  ]).

  /**
   * Service to show notification message in top right corner of
   * the window.
   *
   * Relies on Alert css properties sets in `src/app/app.css`.
   *
   * It takes as arguments the type of notification and the content
   * of the nofication.
   *
   * The type is used as title of the notification and is user to set
   * the class of the notication block: for type set `info`,
   * the block class will be set `alert` and `alert-info` (always lowercase).
   *
   * `spfAlert.success`, `spfAlert.info`, `spfAlert.warning`
   * and `spfAlert.danger` are shortcut for the spfAlert function.
   *
   * They take as agurment the notification content and set respectively the
   * type to "Success", "Info", "Warning" and "Danger".
   *
   */
  factory('spfAlert', [
    '$alert',
    function spfAlertFactory($alert) {
      var spfAlert = function(type, content) {
        type = type || 'Info';
        return $alert({
          content: content,
          duration: 5,
          placement: 'top-right',
          title: type,
          type: type.toLowerCase()
        });
      };

      spfAlert.success = spfAlert.bind({}, 'Success');
      spfAlert.info = spfAlert.bind({}, 'Info');
      spfAlert.warning = spfAlert.bind({}, 'Warning');
      spfAlert.danger = spfAlert.bind({}, 'Danger');

      return spfAlert;
    }
  ]).

  provider('crypto', [
    function cryptoProvider() {
      var saltSize = 128 / 8;
      var hashOpts = {
        keySize: 256 / 32,
        iterations: 2024
      };

      this.setSaltSize = function(size) {
        saltSize = size;
      };

      this.setHashKeySize = function(keySize) {
        hashOpts.keySize = keySize;
      };

      this.setIterations = function(iterations) {
        hashOpts.iterations = iterations;
      };

      this.$get = [
        '$window',
        function cryptoFactory($window) {
          var CryptoJS = $window.CryptoJS;
          var algo = CryptoJS.algo;
          var pbkdf2 = CryptoJS.PBKDF2;
          var hex = CryptoJS.enc.Hex;
          var prf = 'SHA256';

          return {
            password: {
              /**
               * Return a hash for the password and options allowing
               * to rebuild the same against the same password.
               *
               * The options will include the hashing algorithm name, the
               * salt an other parameters.
               *
               */
              newHash: function(password) {
                var salt = CryptoJS.lib.WordArray.random(saltSize);
                var hash = pbkdf2(password, salt, {
                  keySize: hashOpts.keySize,
                  iterations: hashOpts.iterations,
                  hasher: algo[prf]
                });

                return {
                  value: hex.stringify(hash),
                  salt: hex.stringify(salt),
                  iterations: hashOpts.iterations,
                  keySize: hashOpts.keySize,
                  hasher: 'PBKDF2',
                  prf: prf
                };
              },

              /**
               * Return a hash built from the password, the hash and the
               * hashing options.
               *
               * The salt should be hex encoded.
               *
               */
              fromSalt: function(password, hexSalt, options) {
                var salt = hex.parse(hexSalt);
                var h = options.prf || prf;
                var hash = pbkdf2(password, salt, {
                  keySize: options.keySize || hashOpts.keySize,
                  iterations: options.iterations || hashOpts.iterations,
                  hasher: algo[h]
                });
                return hex.stringify(hash);
              }
            }
          };
        }
      ];
    }
  ]).

  /**
   * Controler for the header novigation bar.
   *
   * Set an auth property bound to spfAuth. Its user property can used
   * to display the state of the authentication and the user display name
   * when the user is logged in.
   *
   * The ctrl set a login and logout property to autenticate/unauthenticate
   * the current user.
   *
   */
  controller('SpfNavBarCtrl', [
    '$q',
    'spfAlert',
    'spfAuth',
    function($q, spfAlert, spfAuth) {
      this.auth = spfAuth;

      this.login = function() {
        return spfAuth.login().catch(function(e) {
          spfAlert.warning('You failed to authenticate with Google');
          return $q.reject(e);
        });
      };

      this.logout = function() {
        return spfAuth.logout();
      };

    }
  ])

  ;

})();
