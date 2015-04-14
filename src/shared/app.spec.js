/* eslint camelcase: false*/
/* global describe, beforeEach, module, it, inject, expect, jasmine */

(function() {
  'use strict';

  describe('spf.shared', function() {

    // /**
    //  * Test core singpath fire controllers.
    //  *
    //  */
    // describe('controllers', function() {
    //   var $controller, $rootScope, $q;

    //   beforeEach(module('spf.shared'));

    //   beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
    //     $controller = _$controller_;
    //     $rootScope = _$rootScope_;
    //     $q = _$q_;
    //   }));

    // });

    /**
     * Test core singpath fire services
     */
    describe('services', function() {

      describe('spfCrypto', function() {

        describe('password', function() {
          var provider, crypto;

          beforeEach(module('spf.shared', function(spfCryptoProvider) {
            provider = spfCryptoProvider;
          }));

          beforeEach(inject(function(_spfCrypto_) {
            crypto = _spfCrypto_;
          }));

          it('should create a hash using 256b hash (128b salt, 2024 iteration', function() {
            var hash = crypto.password.newHash('foo');

            expect(hash.options.hasher).toBe('PBKDF2');
            expect(hash.options.prf).toBe('SHA256');
            expect(hash.value.length).toBe(256 / 8 * 2); // 256 bit hex encoded
            expect(hash.options.salt.length).toBe(128 / 8 * 2); // 64 bit hex encoded
            expect(hash.options.iterations).toBe(1012);
          });

          it('should let you configure the hasher', function() {
            var hash;

            provider.setSaltSize(128 / 8);
            provider.setHashKeySize(128 / 32);
            provider.setIterations(100);

            hash = crypto.password.newHash('foo');

            expect(hash.value.length).toBe(128 / 8 * 2); // 256 bit hex encoded
            expect(hash.options.salt.length).toBe(128 / 8 * 2); // 64 bit hex encoded
            expect(hash.options.iterations).toBe(100);
          });

          it('should be able to create hash from salts and options', function() {
            var hash = crypto.password.fromSalt('password', '11111111', {
              keySize: 128 / 32,
              iterations: 10,
              prf: 'SHA1'
            });

            expect(hash).toBe('1a9e75789b45e1e072d420e2995ad5f9');
          });

        });

      });

      describe('spfFirebaseRef', function() {
        var provider, factory, Firebase, firebaseSpy, spfFirebaseRef, ref;

        beforeEach(module('spf.shared', function(spfFirebaseRefProvider) {
          var log = jasmine.createSpyObj('$log', ['info', 'debug']);
          provider = spfFirebaseRefProvider;
          factory = function() {
            return provider.$get.slice(-1).pop()({
              Firebase: Firebase
            }, log);
          };
        }));

        beforeEach(function() {
          firebaseSpy = jasmine.createSpy('Firebase');
          ref = jasmine.createSpyObj('ref', ['child', 'orderBy', 'limitToLast']);
          ref.child.and.returnValue(ref);
          ref.orderBy.and.returnValue(ref);
          ref.limitToLast.and.returnValue(ref);
          ref.path = {};
          Firebase = function(url) {
            firebaseSpy(url);
            this.child = ref.child.bind(ref);
            this.path = {};
          };
        });

        it('should return a Firebase ref', inject(function() {
          spfFirebaseRef = factory();
          expect(spfFirebaseRef().constructor).toBe(Firebase);
        }));

        it('should return ref to singpath database', function() {
          spfFirebaseRef = factory();
          spfFirebaseRef();
          expect(firebaseSpy).toHaveBeenCalledWith('https://singpath-play.firebaseio.com/');
        });

        it('should allow to configure the ref baseurl', function() {
          provider.setBaseUrl('https://singpath-dev.firebaseio.com/');
          spfFirebaseRef = factory();
          spfFirebaseRef();
          expect(firebaseSpy).toHaveBeenCalledWith('https://singpath-dev.firebaseio.com/');
        });

        it('should allow to point to a specific child path', function() {
          spfFirebaseRef = factory();
          spfFirebaseRef(['auth', 'users']);
          expect(ref.child.calls.count()).toBe(2);
          expect(ref.child.calls.argsFor(0)).toEqual(['auth']);
          expect(ref.child.calls.argsFor(1)).toEqual(['users']);
        });

        it('should allow to point to a specific query options', function() {
          expect(ref.child.calls.count()).toBe(0);
          spfFirebaseRef = factory();
          spfFirebaseRef(['events'], {
            orderBy: 'timestamps',
            limitToLast: 50
          });

          expect(ref.orderBy).toHaveBeenCalledWith('timestamps');
          expect(ref.limitToLast).toHaveBeenCalledWith(50);
        });

      });

      describe('spfFirebase', function() {
        var firebaseObject, firebaseArray, spfFirebaseRef;

        beforeEach(module('spf.shared'));

        beforeEach(function() {
          firebaseObject = jasmine.createSpy('firebaseObject');
          firebaseArray = jasmine.createSpy('firebaseArray');
          spfFirebaseRef = jasmine.createSpy('spfFirebaseRef');

          module(function($provide) {
            $provide.value('$firebaseObject', firebaseObject);
            $provide.value('$firebaseArray', firebaseArray);
            $provide.value('spfFirebaseRef', spfFirebaseRef);
          });
        });

        describe('ref', function() {

          it('should return a firebase ref', inject(function(spfFirebase) {
            var expected = {};
            var actual;

            spfFirebaseRef.and.returnValue(expected);

            actual = spfFirebase.ref(['foo']);

            expect(actual).toBe(expected);
            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
          }));

        });

        describe('obj', function() {

          it('should return a $firebaseObject obj', inject(function(spfFirebase) {
            var expectedRef = {};
            var expectedObj = {};

            spfFirebaseRef.and.returnValue(expectedRef);
            firebaseObject.and.returnValue(expectedObj);

            expect(spfFirebase.obj(['foo'])).toBe(expectedObj);
            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(firebaseObject).toHaveBeenCalledWith(expectedRef);
          }));

        });

        describe('array', function() {

          it('should return a $firebaseArray obj', inject(function(spfFirebase) {
            var expectedRef = {};
            var expectedArr = {};

            spfFirebaseRef.and.returnValue(expectedRef);
            firebaseArray.and.returnValue(expectedArr);

            expect(spfFirebase.array(['foo'], {'foo': 'bar'})).toBe(expectedArr);
            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo'], {'foo': 'bar'});
            expect(firebaseArray).toHaveBeenCalledWith(expectedArr);
          }));

        });

        describe('push', function() {

          it('should resolve to a Firebase obj for the new item', inject(function($rootScope, spfFirebase) {
            var newItem = {};
            var expectedRef = jasmine.createSpyObj('Firebase', ['push']);
            var expectedNewRef = {};
            var actualRef;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.push.and.returnValue(expectedNewRef);

            spfFirebase.push(['foo'], newItem).then(function(ref) {
              actualRef = ref;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.push).toHaveBeenCalledWith(newItem, jasmine.any(Function));

            expectedRef.push.calls.first().args[1]();
            $rootScope.$apply();

            expect(actualRef).toBe(expectedNewRef);
          }));

          it('should resolve to an error', inject(function($rootScope, spfFirebase) {
            var newItem = {};
            var expectedRef = jasmine.createSpyObj('Firebase', ['push']);
            var expectedNewRef = {};
            var expectedError = new Error();
            var actualRef;
            var error;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.push.and.returnValue(expectedNewRef);

            spfFirebase.push(['foo'], newItem).then(function(ref) {
              actualRef = ref;
            }, function(err) {
              error = err;
            });

            expect(expectedRef.push).toHaveBeenCalledWith(newItem, jasmine.any(Function));

            expectedRef.push.calls.first().args[1](expectedError);
            $rootScope.$apply();

            expect(actualRef).toBeUndefined();
            expect(error).toBe(expectedError);
          }));

        });

        describe('set', function() {

          it('should resolve to a Firebase obj for the new item', inject(function($rootScope, spfFirebase) {
            var newValue = {};
            var expectedRef = jasmine.createSpyObj('Firebase', ['set']);
            var actualRef;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.set.and.returnValue();

            spfFirebase.set(['foo'], newValue).then(function(ref) {
              actualRef = ref;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.set).toHaveBeenCalledWith(newValue, jasmine.any(Function));

            expectedRef.set.calls.first().args[1]();
            $rootScope.$apply();

            expect(actualRef).toBe(expectedRef);
          }));

          it('should resolve to an error', inject(function($rootScope, spfFirebase) {
            var newValue = {};
            var expectedRef = jasmine.createSpyObj('Firebase', ['set']);
            var actualRef;
            var expectedError = new Error();
            var error;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.set.and.returnValue();

            spfFirebase.set(['foo'], newValue).then(function(ref) {
              actualRef = ref;
            }, function(err) {
              error = err;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.set).toHaveBeenCalledWith(newValue, jasmine.any(Function));

            expectedRef.set.calls.first().args[1](expectedError);
            $rootScope.$apply();

            expect(actualRef).toBeUndefined();
            expect(error).toBe(expectedError);
          }));

        });

        describe('remove', function() {

          it('should resolve to a Firebase obj for the new item', inject(function($rootScope, spfFirebase) {
            var expectedRef = jasmine.createSpyObj('Firebase', ['remove']);
            var actualRef;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.remove.and.returnValue();

            spfFirebase.remove(['foo']).then(function(ref) {
              actualRef = ref;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.remove).toHaveBeenCalledWith(jasmine.any(Function));

            expectedRef.remove.calls.first().args[0]();
            $rootScope.$apply();

            expect(actualRef).toBe(expectedRef);
          }));

          it('should resolve to an error', inject(function($rootScope, spfFirebase) {
            var expectedRef = jasmine.createSpyObj('Firebase', ['remove']);
            var actualRef;
            var expectedError = new Error();
            var error;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.remove.and.returnValue();

            spfFirebase.remove(['foo']).then(function(ref) {
              actualRef = ref;
            }, function(err) {
              error = err;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.remove).toHaveBeenCalledWith(jasmine.any(Function));

            expectedRef.remove.calls.first().args[0](expectedError);
            $rootScope.$apply();

            expect(actualRef).toBeUndefined();
            expect(error).toBe(expectedError);
          }));

        });

      });

      describe('spfAuth', function() {
        var auth, spfFirebaseRef;

        beforeEach(module('spf.shared'));

        beforeEach(function() {
          var $firebaseAuth;

          $firebaseAuth = jasmine.createSpy('$firebaseAuth');
          spfFirebaseRef = jasmine.createSpy('spfFirebaseRef');
          auth = jasmine.createSpyObj('auth', [
            '$getAuth', '$authWithOAuthPopup', '$authWithOAuthRedirect', '$unauth', '$onAuth'
          ]);
          $firebaseAuth.and.returnValue(auth);

          module(function($provide) {
            $provide.value('spfFirebaseRef', spfFirebaseRef);
            $provide.value('$firebaseAuth', $firebaseAuth);
          });

        });

        it('should authenticate current user', function() {
          var user = {
            uid: '1234'
          };

          auth.$getAuth.and.returnValue(user);

          inject(function(spfAuth) {
            expect(spfAuth.user).toBe(user);
          });
        });

        it('should authenticate current user (guest)', function() {
          auth.$getAuth.and.returnValue(null);

          inject(function(spfAuth) {
            expect(spfAuth.user).toBeNull();
          });
        });

        describe('login', function() {
          var user;

          beforeEach(function() {
            user = {
              uid: '1234'
            };
          });

          it('should authenticate against a google account', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth) {
              auth.$authWithOAuthPopup.and.returnValue($q.when(user));

              spfAuth.login();
              expect(auth.$authWithOAuthPopup).toHaveBeenCalledWith('google', {
                scope: 'email'
              });
            });
          });

          it('should set spfAuth.user on success', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth, $rootScope) {
              auth.$authWithOAuthPopup.and.returnValue($q.when(user));

              spfAuth.login();
              $rootScope.$apply();
              expect(spfAuth.user).toBe(user);
            });
          });

          it('should resolve to auth user on success', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth, $rootScope) {
              var result;

              auth.$authWithOAuthPopup.and.returnValue($q.when(user));

              spfAuth.login().then(function(resp) {
                result = resp;
              });

              $rootScope.$apply();
              expect(result).toBe(user);
            });
          });

          it('should reject on error', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth, $rootScope) {
              var result;
              var err = new Error();

              auth.$authWithOAuthPopup.and.returnValue($q.reject(err));

              spfAuth.login().catch(function(e) {
                result = e;
              });

              $rootScope.$apply();
              expect(result).toBe(err);
            });
          });

          it('should resolve to $firebaseAuth.$authWithOAuthRedirect promise when popup is not available', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth, $rootScope) {
              var result;
              var err = new Error();
              var redirectResult = {};

              err.code = 'TRANSPORT_UNAVAILABLE';
              auth.$authWithOAuthPopup.and.returnValue($q.reject(err));
              // I am guessing the redirect promise only resolve if it fails
              // (redirect not available), but for the test it doesn't matter.
              auth.$authWithOAuthRedirect.and.returnValue($q.when(redirectResult));

              spfAuth.login().then(function(resp) {
                result = resp;
              });

              $rootScope.$apply();
              expect(result).toBe(redirectResult);
            });
          });

          it('should authenticate against a google account when popup is not available', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth, $rootScope) {
              var err = new Error();
              var redirectResult = {};

              err.code = 'TRANSPORT_UNAVAILABLE';
              auth.$authWithOAuthPopup.and.returnValue($q.reject(err));
              auth.$authWithOAuthRedirect.and.returnValue($q.when(redirectResult));

              spfAuth.login();
              $rootScope.$apply();
              expect(auth.$authWithOAuthRedirect).toHaveBeenCalledWith('google', {
                scope: 'email'
              });
            });
          });

          it('should reject when neither popup or redirect is available', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, spfAuth, $rootScope) {
              var result;
              var popUpErr = new Error();
              var redirectErr = new Error();

              popUpErr.code = 'TRANSPORT_UNAVAILABLE';
              auth.$authWithOAuthPopup.and.returnValue($q.reject(popUpErr));
              auth.$authWithOAuthRedirect.and.returnValue($q.reject(redirectErr));

              spfAuth.login().catch(function(e) {
                result = e;
              });

              $rootScope.$apply();
              expect(result).toBe(redirectErr);
            });
          });

        });

        describe('logout', function() {

          it('should unauthenticates current user', function() {
            auth.$getAuth.and.returnValue({
              uid: '1234'
            });

            inject(function($q, spfAuth) {
              auth.$unauth.and.returnValue(null);

              spfAuth.logout();
              expect(auth.$unauth).toHaveBeenCalled();
            });
          });

          it('should reset spfAuth.user', function() {
            auth.$getAuth.and.returnValue({
              uid: '1234'
            });

            inject(function($q, spfAuth) {
              auth.$unauth.and.returnValue(null);

              spfAuth.logout();
              expect(auth.user).toBeUndefined();
            });
          });

        });

      });

      describe('spfAuthData', function() {
        var spfFirebase, spfAuth, spfCrypto;

        beforeEach(module('spf.shared'));

        beforeEach(function() {
          spfFirebase = jasmine.createSpyObj('spfFirebase', ['loadedObj']);
          spfCrypto = {
            md5: jasmine.createSpy('spfCrypto.md5')
          };
          spfAuth = {
            user: {
              uid: 'custome:1',
              google: {
                displayName: 'Bob Smith',
                email: 'bob@example.com'
              }
            },
            onAuth: jasmine.createSpy('spfAuth.onAuth')
          };

          module(function($provide) {
            $provide.value('spfFirebase', spfFirebase);
            $provide.value('spfCrypto', spfCrypto);
            $provide.value('spfAuth', spfAuth);
          });
        });

        it('should resolved to user data', function() {
          inject(function($q, $rootScope, spfAuthData) {
            var user = jasmine.createSpyObj('userSync', ['$save']);
            var result;

            spfFirebase.loadedObj.and.returnValue($q.when(user));
            spfAuthData.user().then(function(_result_) {
              result = _result_;
            });
            $rootScope.$apply();

            expect(result).toBe(user);
            expect(user.$save).not.toHaveBeenCalled();
          });
        });

        it('should return undefined if the user is not logged in', function() {
          inject(function($rootScope, spfAuthData) {
            var result, error;

            spfAuth.user = null;
            spfAuthData.user().then(function(_result_) {
              result = _result_;
            }, function(e) {
              error = e;
            });

            $rootScope.$apply();
            expect(result).toBeUndefined();
            expect(error).toBeDefined();
          });
        });

        it('should setup user data', function() {
          inject(function($rootScope, $q, spfAuthData) {
            var user = jasmine.createSpyObj('userSync', ['$save']);
            var result;

            user.$value = null;
            user.$save.and.returnValue($q.when(user));
            spfCrypto.md5.and.returnValue('foo');

            spfFirebase.loadedObj.and.returnValue($q.when(user));
            spfAuthData.user().then(function(_result_) {
              result = _result_;
            });
            $rootScope.$apply();

            expect(result).toBe(user);
            expect(user.$value).toEqual({
              id: 'custome:1',
              fullName: 'Bob Smith',
              displayName: 'Bob Smith',
              email: 'bob@example.com',
              gravatar: '//www.gravatar.com/avatar/foo',
              createdAt: {
                '.sv': 'timestamp'
              }
            });
            expect(user.$save).toHaveBeenCalled();
          });
        });

      });

    });

  });

})();
