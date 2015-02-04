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
    'ngMessages',
    'ngRoute'
  ]).

  /**
   * Label paths - to be used by each component to configure their route.
   *
   * See src/app/components for example.
   *
   */
  constant('routes', {
    classMentor: {
      home: '/class-mentors',
      events: '/class-mentors'
    }
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
        redirectTo: routes.classMentor.home
      });

      cfpLoadingBarProvider.includeSpinner = false;
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
   * spfFirebaseRef return a Firebase reference to singpath database,
   * at a specific path, with a specific query; e.g:
   *
   *    // ref to "https://singpath.firebaseio.com/"
   *    spfFirebaseRef);
   *
   *    // ref to "https://singpath.firebaseio.com/auth/users/google:12345"
   *    spfFirebaseRef(['auth/users', 'google:12345']);
   *
   *    // ref to "https://singpath.firebaseio.com/events?limitTo=50"
   *    spfFirebaseRef(['events', 'google:12345'], {limitTo: 50});
   *
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
      return function spfFirebaseRef(paths, options) {
        var ref = new $window.Firebase(baseUrl);

        $log.debug('singpath base URL: "' + baseUrl + '".');

        paths = paths || [];
        ref = paths.reduce(function(ref, p) {
          return ref.child(p);
        }, ref);

        options = options || {};
        Object.keys(options).forEach(function(k) {
          ref[k](options[k]);
        });

        $log.debug('singpath ref path: "' + ref.path.toString() + '".');
        return ref;
      };
    }];

  }).

  /**
   * Like spfFirebaseRef by return an $firebase object.
   *
   */
  factory('spfFirebaseSync', [
    '$firebase',
    'spfFirebaseRef',
    function spfFirebaseSyncFactory($firebase, spfFirebaseRef) {
      return function spfFirebaseSync() {
        return $firebase(spfFirebaseRef.apply(null, arguments));
      };
    }
  ]).


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
        },

        /**
         * Register a callback for the authentication event.
         */
        onAuth: function(fn, ctx) {
          return auth.$onAuth(fn, ctx);
        }

      };
    }
  ]).

  /**
   * Service to interact with singpath firebase db
   *
   */
  factory('spfDataStore', [
    '$q',
    'spfFirebaseRef',
    'spfFirebaseSync',
    'spfAuth',
    'crypto',
    function spfDataStoreFactory($q, spfFirebaseRef, spfFirebaseSync, spfAuth, crypto) {
      var userData, userDataPromise, api;

      api = {
        auth: {

          _user: function() {
            return spfFirebaseSync(['auth/users', spfAuth.user.uid]).$asObject();
          },

          /**
           * Returns a promise resolving to an angularFire $firebaseObject
           * for the current user data.
           *
           * The promise will be rejected if the is not authenticated.
           *
           */
          user: function() {
            if (!spfAuth.user || !spfAuth.user.uid) {
              return $q.reject(new Error('the user is not authenticated.'));
            }

            if (userData) {
              return $q.when(userData);
            }

            if (userDataPromise) {
              return $q.when(userDataPromise);
            }

            userDataPromise = api.auth._user().$loaded().then(
              api.auth.register
            ).then(function(data) {
              userData = data;
              userDataPromise = null;
              return data;
            });

            return userDataPromise;
          },

          /**
           * Setup initial data for the current user.
           *
           * Should run if 'auth.user().$value is `null`.
           *
           * Returns a promise resolving to the user data when
           * they become available.
           *
           */
          register: function(userData) {
            if (angular.isUndefined(userData)) {
              return $q.reject(new Error('A user should be logged in to register'));
            }

            // $value will be undefined and not null when the userData object
            // is set.
            if (userData.$value !== null) {
              return $q.when(userData);
            }

            userData.$value = {
              id: spfAuth.user.uid,
              nickName: spfAuth.user.google.displayName,
              displayName: spfAuth.user.google.displayName,
              createdAt: {
                '.sv': 'timestamp'
              }
            };

            return userData.$save().then(function() {
              return userData;
            });
          }
        },

        classMentor: {
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
                hash = crypto.password.newHash(password);
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
                var hash = crypto.password.fromSalt(pw, options.$value.salt, options.$value);
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
        }
      };

      return api;
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
    '$window',
    function spfAlertFactory($window) {
      var ctx = $window.alertify;
      var spfAlert = function(type, content) {
        ctx.log(content, type.toLowerCase());
      };

      spfAlert.success = spfAlert.bind(ctx, 'success');
      spfAlert.info = spfAlert.bind(ctx);
      spfAlert.warning = spfAlert.bind(ctx, 'error');
      spfAlert.danger = spfAlert.bind(ctx, 'error');

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
                  options: {
                    salt: hex.stringify(salt),
                    iterations: hashOpts.iterations,
                    keySize: hashOpts.keySize,
                    hasher: 'PBKDF2',
                    prf: prf
                  }
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

  directive('spfBsValidClass', [

    function spfBsValidClassFactory() {
      return {
        restrict: 'A',
        scope: false,
        require: 'ngModel',
        // arguments: scope, iElement, iAttrs, controller
        link: function spfBsValidClassPostLink(s, iElement, a, model) {
          var formControl, setPristine = model.$setPristine;

          function findFormController(input, className) {
            var formControl = input;
            while (formControl.length > 0) {
              formControl = formControl.parent();
              if (formControl.hasClass(className)) {
                return formControl;
              }
            }
          }

          formControl = findFormController(iElement, 'form-group');
          if (!formControl) {
            formControl = findFormController(iElement, 'radio');
          }

          if (!formControl) {
            return;
          }

          model.$setPristine = function augmentedSetPristine() {
            formControl.removeClass('has-error');
            formControl.removeClass('has-success');
            return setPristine.apply(model, arguments);
          };

          model.$viewChangeListeners.push(function spfBsValidClassOnChange() {

            if (model.$pristine) {
              formControl.removeClass('has-error');
              formControl.removeClass('has-success');
              return;
            }

            if (model.$valid) {
              formControl.removeClass('has-error');
              formControl.addClass('has-success');
            } else {
              formControl.addClass('has-error');
              formControl.removeClass('has-success');
            }
          });
        }
      };
    }
  ])

  ;

})();
