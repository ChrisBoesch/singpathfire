/**
 * Defines the main shared services, directive and filters
 *
 */
(function() {
  'use strict';

  var module = angular.module('spf.shared', [
    'angular-loading-bar',
    'firebase',
    'ngAnimate',
    'ngMessages',
    'ngRoute',
    'ngMaterial'
  ]);

  module.constant('routes', {
    home: '/'
  });

  /**
   * Configure cfpLoadingBar options.
   *
   */
  module.config([
    'cfpLoadingBarProvider',
    function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = false;
    }
  ]);

  module.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('brown')
      .accentPalette('amber')
      .warnPalette('deep-orange');
  });

  /**
   * Listen for routing error to alert the user of the error and
   * redirect to the default route if not is selected.
   *
   * No route will be selected if the user reload the page in an invalid state
   * for her/his last route. It that case the app should redirect the user
   * to the home route.
   *
   */
  module.run([
    '$rootScope',
    '$location',
    'routes',
    'spfAlert',
    function($rootScope, $location, routes, spfAlert) {
      $rootScope.$on('$routeChangeError', function(e, failedRoute, currentRoute, err) {
        spfAlert.error(err.message || err.toString());

        if (!currentRoute) {
          $location.path(routes.home);
        }
      });
    }
  ]);

  module.factory('urlFor', [
    'routes',
    function urlForFactory(routes) {
      var routeFns = Object.keys(routes).reduce(function(fns, name) {
        var parts = routes[name].split('/');

        fns[name] = function(keys) {
          keys = keys || {};
          return parts.map(function(part) {
            return part[0] === ':' ? keys[part.slice(1)] : part;
          }).join('/');
        };

        return fns;
      }, {});

      return function(name, params) {
        var fn = routeFns[name] || routeFns.home;
        return fn(params);
      };
    }
  ]);

  module.filter('urlFor', [
    'urlFor',
    function urlForFilterFactory(urlFor) {
      return function urlForFilter(name, params) {
        var url = urlFor(name, params);
        return url;
      };
    }
  ]);

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
   * The base url is configurable with `spfFirebaseRefProvider.setBaseUrl`:
   *
   *    angular.module('spf').config([
   *      'spfFirebaseRefProvider',
   *      function(spfFirebaseRefProvider){
   *          spfFirebaseRefProvider.setBaseUrl(newBaseUrl);
   *      }
   *    ])
   *
   */
  module.provider('spfFirebaseRef', function OepFirebaseProvider() {
    var baseUrl = 'https://singpath-play.firebaseio.com/';

    this.setBaseUrl = function(url) {
      baseUrl = url;
    };

    this.$get = ['$window', '$log', function spfFirebaseRefFactory($window, $log) {
      return function spfFirebaseRef(paths, queryOptions) {
        var ref = new $window.Firebase(baseUrl);
        var filters = ['equalTo', 'startAt', 'endAt'];
        var filter, i;

        paths = paths || [];
        paths = angular.isArray(paths) ? paths : [paths];
        ref = paths.reduce(function(prevRef, p) {
          return prevRef.child(p);
        }, ref);

        queryOptions = queryOptions || {};
        if (queryOptions.hasOwnProperty('orderByPriority')) {
          ref = ref.orderByPriority();
        } else if (queryOptions.hasOwnProperty('orderByKey')) {
          ref = ref.orderByKey();
        } else if (queryOptions.orderByChild) {
          ref = ref.orderByChild(queryOptions.orderByChild);
        } else if (queryOptions.orderByValue) {
          ref = ref.orderByValue(queryOptions.orderByValue);
        }

        for (i = 0; i < filters.length; i++) {
          filter = queryOptions[filters[i]];

          if (filter == null) {
            continue;
          }

          if (!angular.isArray(filter)) {
            ref = ref[filters[i]](filter);
          } else if (queryOptions.hasOwnProperty('orderByPriority')) {
            ref = ref[filters[i]].apply(ref, filter);
          } else {
            $log.warning('The query should be ordered by priority to filter by value and key');
          }

          break;
        }

        if (queryOptions.limitToFirst) {
          ref = ref.limitToFirst(queryOptions.limitToFirst);
        } else if (queryOptions.limitToLast) {
          ref = ref.limitToLast(queryOptions.limitToLast);
        }

        $log.debug('singpath base URL: "' + baseUrl + '".');
        $log.debug('singpath ref path: "' + ref.path.toString() + '".');
        return ref;
      };
    }];

  });

  /**
   * Helpers for firebase Firebase, $firebaseObject and $firebaseArray object.
   *
   * Remove boilerplates:
   * - get $firebaseObject or $firebaseArray object using a relative path
   *   instead of Firebase obj.
   * - wrap a promise around the Firebase operation (currently provide set,
   *   remove and push).
   * - limit the number of object and returned object to mock in tests; just
   *   mock spfFirebase.
   *
   */
  module.factory('spfFirebase', [
    '$q',
    '$log',
    '$firebaseObject',
    '$firebaseArray',
    'spfFirebaseRef',
    function spfFirebaseFactory($q, $log, $firebaseObject, $firebaseArray, spfFirebaseRef) {
      var invalidChar = ['.', '#', '$', '/', '[', ']'];
      var spfFirebase;

      spfFirebase = {

        /**
         * alias for spfFirebaseRef.
         *
         */
        ref: function() {
          return spfFirebaseRef.apply(this, arguments);
        },

        /**
         * Convenient function to return a $firebaseObject object.
         *
         * example:
         *
         *    var userPromise = spfFirebase.obj(['singpath/auth/users', userId]).$loaded();
         *
         */
        obj: function() {
          return $firebaseObject(spfFirebaseRef.apply(this, arguments));
        },

        loadedObj: function() {
          return spfFirebase.obj.apply(this, arguments).$loaded();
        },

        /**
         * Convenient function to return a $firebaseArray object.
         *
         * example:
         *
         *     var usersPromise = spfFirebase.obj(['singpath/auth/users']).$loaded();
         *
         */
        array: function() {
          return $firebaseArray(spfFirebaseRef.apply(this, arguments));
        },

        loadedArray: function() {
          return spfFirebase.array.apply(this, arguments).$loaded();
        },

        /**
         * Add data to a collection.
         *
         * Returns a promise resolving to an error on error or a Firebase
         * reference to the new item in the collection.
         *
         */
        push: function(root, value) {
          return $q(function(resolve, reject) {
            var ref;

            ref = spfFirebaseRef(root).push(value, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(ref);
              }
            });
          });
        },

        /**
         * Add data to a collection like `push` but also set the priority.
         *
         * Returns a promise resolving to an error on error or a Firebase
         * reference to the new item in the collection.
         *
         */
        pushWithPriority: function(root, value, priority) {
          return $q(function(resolve, reject) {
            var ref = spfFirebaseRef(root).push();

            ref.setWithPriority(value, priority, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(ref);
              }
            });
          });
        },

        /**
         * Set a firebase entry to the value.
         *
         * Returns a promise resolving to an error on error or to a Firebase
         * reference to the firebase entry.
         *
         */
        set: function(path, value) {
          return $q(function(resolve, reject) {
            var ref = spfFirebaseRef(path);

            ref.set(value, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(ref);
              }
            });
          });
        },

        /**
         * Set a firebase entry to the value with a priority.
         *
         * Returns a promise resolving to an error on error or to a Firebase
         * reference to the firebase entry.
         *
         */
        setWithPriority: function(path, value, priority) {
          priority = priority || 0;

          return $q(function(resolve, reject) {
            var ref = spfFirebaseRef(path);

            ref.setWithPriority(value, priority, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(ref);
              }
            });
          });
        },

        patch: function(path, value) {
          return $q(function(resolve, reject) {
            var ref = spfFirebaseRef(path);

            $log.debug('PATCH', JSON.stringify(value));

            ref.update(value, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(ref);
              }
            });
          });
        },

        /**
         * Remove firebase entry to the value.
         *
         * Returns a promise resolving to an error on error or to a Firebase
         * reference to empty firebase entry.
         */
        remove: function(path) {
          return $q(function(resolve, reject) {
            var ref = spfFirebaseRef(path);

            ref.remove(function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(ref);
              }
            });
          });
        },

        /**
         * Return a factory extending `$firebaseObject`.
         *
         * Unlike `$firebaseObject.$extend`, it return a plain function and not
         * a constructor. It also takes as argument path and options like
         * `spfFirebase.ref`.
         *
         */
        objFactory: function(mixin) {
          var Obj = $firebaseObject.$extend(mixin);
          return function factory() {
            return new Obj(spfFirebase.ref.apply(spfFirebase, arguments));
          };
        },

        /**
         * Return a factory extending `$firebaseArray`.
         *
         * Unlike `$firebaseArray.$extend`, it return a plain function and not
         * a constructor. It also takes as argument path and options like
         * `spfFirebase.ref`.
         *
         */
        arrayFactory: function(mixin) {
          var Arr = $firebaseArray.$extend(mixin);
          return function factory() {
            return new Arr(spfFirebase.ref.apply(spfFirebase, arguments));
          };
        },

        /**
         * Remove invalid items from an object.
         *
         * Invalid items have a key with an invalid char:
         * '.', '#', '$', '/', '[' or ']'.
         */
        cleanObj: function(obj) {
          if (obj === undefined) {
            return null;
          }

          if (
            obj == null ||
            !angular.isObject(obj) ||
            angular.isArray(obj) ||
            angular.isNumber(obj) ||
            angular.isString(obj) ||
            angular.isDate(obj)
          ) {
            return obj;
          }

          return Object.keys(obj).reduce(function(copy, key) {
            if (!key) {
              return copy;
            }

            for (var i = 0; i < invalidChar.length; i++) {
              if (key.indexOf(invalidChar[i]) !== -1) {
                return copy;
              }
            }

            copy[key] = obj[key];

            if (copy[key] === undefined) {
              copy[key] = null;
            }
            return copy;
          }, {});
        },

        errTransactionFailed: new Error('Transaction failed'),
        errTransactionAborted: new Error('Transaction aborted'),

        /**
         * Promise based transaction helper.
         *
         * `path` is the firebase path the transaction will work on.
         *
         * `callback` will be called with the current value at the path. It should return
         * a new value to update the path with or undefined to abort the transaction.
         *
         * The returned promise will resolve to the new value or will reject
         * with a spfFirebase.errTransactionFailed or spfFirebase.errTransactionAborted
         * error.
         *
         */
        transaction: function(path, callback) {
          return $q(function(ok, fails) {
            spfFirebase.ref(path).transaction(callback, function(error, committed, snapshot) {
              if (error) {
                $log.error(error);
                fails(spfFirebase.errTransactionFailed);
              } else if (!committed) {
                fails(spfFirebase.errTransactionAborted);
              } else {
                ok(snapshot);
              }
            }, false);
          });
        },

        /**
         * Return a promise resolving to the record at the firebase path.
         *
         * An alternative to using an AngularFire object whenyou don't need
         * the update.
         *
         */
        valueAt: function(path) {
          return $q(function(ok, fails) {
            spfFirebase.ref(path).once('value', function(snapshot) {
              ok(snapshot.val());
            }, fails);
          });
        }
      };

      return spfFirebase;
    }
  ]);

  /**
   * Returns an object with `user` (Firebase auth user data) property,
   * and login/logout methods.
   */
  module.factory('spfAuth', [
    '$q',
    '$route',
    '$log',
    '$firebaseAuth',
    'spfFirebaseRef',
    function($q, $route, $log, $firebaseAuth, spfFirebaseRef) {
      var auth = $firebaseAuth(spfFirebaseRef());
      var options = {
        scope: 'email'
      };

      var spfAuth = {
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

          return auth.$authWithOAuthPopup('google', options).then(function(user) {
            self.user = user;
            return user;
          }, function(error) {
            // spfAlert.warning('You failed to authenticate with Google');
            if (error.code === 'TRANSPORT_UNAVAILABLE') {
              return auth.$authWithOAuthRedirect('google', options);
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
        },

        /**
         * Register a callback for the authentication event.
         */
        onAuth: function(fn, ctx) {
          return auth.$onAuth(fn, ctx);
        }
      };

      spfAuth.onAuth(function(currentAuth) {
        $log.debug('reloading');
        $route.reload();

        if (!currentAuth) {
          spfAuth.user = undefined;
        }
      });

      return spfAuth;
    }
  ]);

  /**
   * Service to interact with '/auth/users' singpath firebase db entry
   *
   */
  module.factory('spfAuthData', [
    '$q',
    '$log',
    'spfFirebase',
    'spfAuth',
    'spfCrypto',
    function spfAuthDataFactory($q, $log, spfFirebase, spfAuth, spfCrypto) {
      var userData, userDataPromise, spfAuthData;

      spfAuth.onAuth(function(auth) {
        if (!auth) {
          userData = userDataPromise = undefined;
        }
      });

      spfAuthData = {
        _factory: spfFirebase.objFactory({
          $completed: function() {
            return Boolean(
              this.publicId &&
              this.country && (
                this.yearOfBirth ||
                this.country.code !== 'SG'
              ) && (
                this.school || (
                  !this.yearOfBirth ||
                  this.yearOfBirth < 1996 ||
                  this.yearOfBirth > 2004
              ))
            );
          }
        }),

        _user: function() {
          return spfAuthData._factory(['auth/users', spfAuth.user.uid]).$loaded();
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
            return $q.reject(new Error('Your did not login or your session expired.'));
          }

          if (userData) {
            return $q.when(userData);
          }

          if (userDataPromise) {
            return $q.when(userDataPromise);
          }

          userDataPromise = spfAuthData._user().then(
            spfAuthData.register
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
        register: function(userDataObj) {
          var gravatarBaseUrl = '//www.gravatar.com/avatar/';

          if (angular.isUndefined(userDataObj)) {
            return $q.reject(new Error('A user should be logged in to register'));
          }

          // $value will be undefined and not null when the userDataObj object
          // is set.
          if (userDataObj.$value !== null) {
            return $q.when(userDataObj);
          }

          userDataObj.$value = {
            id: spfAuth.user.uid,
            fullName: spfAuth.user.google.displayName,
            displayName: spfAuth.user.google.displayName,
            email: spfAuth.user.google.email,
            gravatar: gravatarBaseUrl + spfCrypto.md5(spfAuth.user.google.email),
            createdAt: {
              '.sv': 'timestamp'
            }
          };

          return userDataObj.$save().then(function() {
            return userDataObj;
          });
        },

        publicId: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebase.set(['auth/publicIds', userSync.publicId], userSync.$id).then(function() {
            return spfFirebase.set(['auth/usedPublicIds', userSync.publicId], true);
          }, function(err) {
            $log.info(err);
            return $q.reject(new Error('Failed to save public id. It might have already being used by an other user.'));
          }).then(function() {
            return userSync.$save();
          });
        },

        isPublicIdAvailable: function(publicId) {
          return spfFirebase.loadedObj(['auth/usedPublicIds', publicId]).then(function(publicIdSync) {
            return !publicIdSync.$value;
          });
        }
      };

      return spfAuthData;
    }
  ]);

  module.provider('spfCrypto', [
    function cryptoProvider() {
      var saltSize = 128 / 8;
      var hashOpts = {
        keySize: 256 / 32,
        iterations: 1012
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
            md5: function(message) {
              return new CryptoJS.MD5(message);
            },

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
            },

            randomString: function(size) {
              var random = CryptoJS.lib.WordArray.random(size);
              return hex.stringify(random);
            }
          };
        }
      ];
    }
  ]);

  module.filter('spfEmpty', [
    function spfEmptyFactory() {
      return function spfEmpty(obj) {
        if (!obj) {
          return true;
        }

        if (obj.hasOwnProperty('$value')) {
          return obj.$value === null;
        }

        if (obj.length !== undefined) {
          return obj.length === 0;
        }

        return Object.keys(obj).length === 0;
      };
    }
  ]);

  module.filter('spfLength', [
    function spfLengthFactory() {
      return function spfLength(obj) {
        if (!obj) {
          return 0;
        }

        if (obj.hasOwnProperty('$value') && obj.$value === null) {
          return 0;
        }

        if (obj.length !== undefined) {
          return obj.length;
        }

        return Object.keys(obj).filter(function(k) {
          return k && k[0] !== '$';
        }).length;
      };
    }
  ]).

  filter('spfToArray', [
    function spfToArrayFilterFactory() {
      return function spfToArrayFilter(obj) {
        if (!(obj instanceof Object)) {
          return obj;
        }
        return Object.keys(obj).reduce(function(arr, key) {
          if (!key || key[0] === '$') {
            return arr;
          }

          arr.push(Object.defineProperty(
            obj[key],
            '$$hashKey',
            {__proto__: null, value: key}
          ));

          return arr;
        }, []);
      };
    }
  ])
  ;

})();
