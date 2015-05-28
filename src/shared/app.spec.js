/* eslint-env jasmine */
/* global module, inject, angular */

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
          ref = jasmine.createSpyObj('ref', ['child', 'orderByPriority', 'startAt', 'limitToLast']);
          ref.child.and.returnValue(ref);
          ref.orderByPriority.and.returnValue(ref);
          ref.startAt.and.returnValue(ref);
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
            orderByPriority: null,
            limitToLast: 50,
            startAt: [null, 'someKey']
          });

          expect(ref.orderByPriority).toHaveBeenCalledWith();
          expect(ref.limitToLast).toHaveBeenCalledWith(50);
          expect(ref.startAt).toHaveBeenCalledWith(null, 'someKey');
          // TODO test order
        });

      });

      describe('spfFirebase', function() {
        var firebaseObject, firebaseArray, spfFirebaseRef;

        beforeEach(module('spf.shared'));

        beforeEach(function() {
          firebaseObject = jasmine.createSpy('firebaseObject');
          firebaseArray = jasmine.createSpy('firebaseArray');
          spfFirebaseRef = jasmine.createSpy('spfFirebaseRef');

          firebaseObject.$extend = jasmine.createSpy('$extend');
          firebaseArray.$extend = jasmine.createSpy('$extend');

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

        describe('setWithPriority', function() {

          it('should resolve to a Firebase obj for the new item', inject(function($rootScope, spfFirebase) {
            var newValue = {};
            var expectedRef = jasmine.createSpyObj('Firebase', ['setWithPriority']);
            var actualRef;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.setWithPriority.and.returnValue();

            spfFirebase.setWithPriority(['foo'], newValue, 2).then(function(ref) {
              actualRef = ref;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.setWithPriority).toHaveBeenCalledWith(newValue, 2, jasmine.any(Function));

            expectedRef.setWithPriority.calls.first().args[2]();
            $rootScope.$apply();

            expect(actualRef).toBe(expectedRef);
          }));

          it('should resolve to an error', inject(function($rootScope, spfFirebase) {
            var newValue = {};
            var expectedRef = jasmine.createSpyObj('Firebase', ['setWithPriority']);
            var actualRef;
            var expectedError = new Error();
            var error;

            spfFirebaseRef.and.returnValue(expectedRef);
            expectedRef.setWithPriority.and.returnValue();

            spfFirebase.setWithPriority(['foo'], newValue, 2).then(function(ref) {
              actualRef = ref;
            }, function(err) {
              error = err;
            });

            expect(spfFirebaseRef).toHaveBeenCalledWith(['foo']);
            expect(expectedRef.setWithPriority).toHaveBeenCalledWith(newValue, 2, jasmine.any(Function));

            expectedRef.setWithPriority.calls.first().args[2](expectedError);
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

        describe('objFactory', function() {

          it('should call $firebaseObject.$extend', inject(function(spfFirebase) {
            var mixin = {noop: function() {}};
            var path = ['classMentors/userProfile', 'bob'];
            var isConstructor = false;
            var expected = {};
            var actual, factory;
            var extendedfirebaseObject = function(ref) {
              isConstructor = this instanceof extendedfirebaseObject;
              actual = ref;
            };

            spfFirebaseRef.and.returnValue(expected);
            firebaseObject.$extend.and.returnValue(extendedfirebaseObject);

            factory = spfFirebase.objFactory(mixin);
            factory(path);

            expect(firebaseObject.$extend).toHaveBeenCalledWith(mixin);
            expect(spfFirebaseRef).toHaveBeenCalledWith(path);
            expect(isConstructor).toBe(true);
            expect(actual).toBe(expected);
          }));

        });

        describe('arrayFactory', function() {

          it('should call $firebaseArray.$extend', inject(function(spfFirebase) {
            var mixin = {noop: function() {}};
            var path = ['classMentors/userProfile', 'bob'];
            var isConstructor = false;
            var expected = {};
            var actual, factory;
            var extendedfirebaseArray = function(ref) {
              isConstructor = this instanceof extendedfirebaseArray;
              actual = ref;
            };

            spfFirebaseRef.and.returnValue(expected);
            firebaseArray.$extend.and.returnValue(extendedfirebaseArray);

            factory = spfFirebase.arrayFactory(mixin);
            factory(path);

            expect(firebaseArray.$extend).toHaveBeenCalledWith(mixin);
            expect(spfFirebaseRef).toHaveBeenCalledWith(path);
            expect(isConstructor).toBe(true);
            expect(actual).toBe(expected);
          }));

        });

        describe('transaction', function() {
          var $q, $rootScope, spfFirebase, fn;

          beforeEach(inject(function(_$q_, _$rootScope_, _spfFirebase_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            spfFirebase = _spfFirebase_;
            fn = jasmine.createSpy('fn');
          }));

          it('should call spfFirebase.ref with the given path', function() {
            var path = ['foo'];

            spfFirebase.ref = jasmine.createSpy('spfFirebase.ref');
            spfFirebase.ref.and.returnValue(jasmine.createSpyObj('ref', ['transaction']));
            spfFirebase.transaction(path, fn);

            expect(spfFirebase.ref).toHaveBeenCalledWith(path);
          });

          it('should call the firebase ref transaction method', function() {
            var ref = jasmine.createSpyObj('ref', ['transaction']);

            spfFirebase.ref = jasmine.createSpy('spfFirebase.ref');
            spfFirebase.ref.and.returnValue(ref);
            spfFirebase.transaction(['some/path'], fn);

            expect(ref.transaction.calls.count()).toBe(1);
            expect(ref.transaction).toHaveBeenCalledWith(fn, jasmine.any(Function), false);
          });

          it('should return a promise resolving to the snapshot of the update path', function() {
            var ref = jasmine.createSpyObj('ref', ['transaction']);
            var expected = {someProp: 'someValue'};
            var actual, onComplete;

            spfFirebase.ref = jasmine.createSpy('spfFirebase.ref');
            spfFirebase.ref.and.returnValue(ref);
            spfFirebase.transaction(['some/path'], fn).then(function(ss) {
              actual = ss;
            });

            onComplete = ref.transaction.calls.argsFor(0)[1];
            onComplete(null, true, expected);
            $rootScope.$apply();

            expect(actual).toBe(expected);
          });

          it('should return a promise resolving to an error if the transaction failed', function() {
            var ref = jasmine.createSpyObj('ref', ['transaction']);
            var transactionError = new Error('some error');
            var err, onComplete;

            spfFirebase.ref = jasmine.createSpy('spfFirebase.ref');
            spfFirebase.ref.and.returnValue(ref);
            spfFirebase.transaction(['some/path'], fn).catch(function(e) {
              err = e;
            });

            onComplete = ref.transaction.calls.argsFor(0)[1];
            onComplete(transactionError, true, 'someValue');
            $rootScope.$apply();

            expect(err).toEqual(jasmine.any(Error));
            expect(err).toBe(spfFirebase.errTransactionFailed);
          });

          it('should return a promise resolving to an error if the transaction failed', function() {
            var ref = jasmine.createSpyObj('ref', ['transaction']);
            var err, onComplete;

            spfFirebase.ref = jasmine.createSpy('spfFirebase.ref');
            spfFirebase.ref.and.returnValue(ref);
            spfFirebase.transaction(['some/path'], fn).catch(function(e) {
              err = e;
            });

            onComplete = ref.transaction.calls.argsFor(0)[1];
            onComplete(null, false, 'someValue');
            $rootScope.$apply();

            expect(err).toEqual(jasmine.any(Error));
            expect(err).toBe(spfFirebase.errTransactionAborted);
          });

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
          spfFirebase = jasmine.createSpyObj('spfFirebase', ['objFactory']);
          spfCrypto = {
            md5: jasmine.createSpy('spfCrypto.md5')
          };
          spfAuth = {
            user: {
              uid: 'google:1',
              google: {
                displayName: 'Bob Smith',
                email: 'bob@example.com'
              }
            },
            onAuth: jasmine.createSpy('spfAuth.onAuth')
          };

          spfFirebase.objFactory.and.callFake(function(mixin) {
            var factory = jasmine.createSpy('objFactoryFactory');

            expect(arguments.length).toBe(1);
            factory._mixin = mixin;
            return factory;
          });

          module(function($provide) {
            $provide.value('spfFirebase', spfFirebase);
            $provide.value('spfCrypto', spfCrypto);
            $provide.value('spfAuth', spfAuth);
          });
        });

        it('should extend $firebaseObject for user auth data', inject(function($rootScope, $q, spfAuthData) {
          var userObj = jasmine.createSpyObj('userObj', ['$loaded']);
          var result;

          expect(spfAuthData._factory).toEqual(jasmine.any(Function));

          spfAuthData._factory.and.returnValue(userObj);
          userObj.$loaded.and.returnValue($q.when(userObj));

          spfAuthData._user().then(function(resp) {
            result = resp;
          });
          $rootScope.$apply();

          expect(result).toBe(userObj);
        }));

        it('should query auth user data', inject(function($q, $rootScope, spfAuthData) {
          var userObj = jasmine.createSpyObj('userObj', ['$loaded']);

          expect(spfAuthData._factory).toEqual(jasmine.any(Function));

          spfAuthData._factory.and.returnValue(userObj);
          userObj.$loaded.and.returnValue($q.when(userObj));

          spfAuthData._user();
          $rootScope.$apply();

          expect(spfAuthData._factory.calls.count()).toBe(1);
          expect(spfAuthData._factory.calls.argsFor(0).length).toBe(1);
          expect(
            spfAuthData._factory.calls.argsFor(0)[0].join('/')
          ).toBe(
            'auth/users/google:1'
          );
        }));

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

        it('should setup user data', inject(function($q, $rootScope, spfAuthData) {
          var userObj = jasmine.createSpyObj('userObj', ['$loaded', '$save']);
          var result;

          expect(spfAuthData._factory).toEqual(jasmine.any(Function));

          spfAuthData._factory.and.returnValue(userObj);
          userObj.$loaded.and.returnValue($q.when(userObj));
          userObj.$save.and.returnValue($q.when());
          userObj.$value = null;
          spfCrypto.md5.and.returnValue('foo');

          spfAuthData.user().then(function(_result_) {
            result = _result_;
          });
          $rootScope.$apply();

          expect(result).toBe(userObj);
          expect(userObj.$value).toEqual({
            id: 'google:1',
            fullName: 'Bob Smith',
            displayName: 'Bob Smith',
            email: 'bob@example.com',
            gravatar: '//www.gravatar.com/avatar/foo',
            createdAt: {
              '.sv': 'timestamp'
            }
          });
          expect(userObj.$save).toHaveBeenCalled();
        }));

        it('should extend $firebaseObject for user auth data to add $completed method',
          inject(function(spfAuthData) {
            expect(spfAuthData._factory._mixin).toEqual(jasmine.any(Object));
            expect(spfAuthData._factory._mixin.$completed).toEqual(jasmine.any(Function));
          })
        );

        describe('$completed', function() {
          var userData, $completed;

          beforeEach(inject(function(spfAuthData) {
            userData = {};
            $completed = spfAuthData._factory._mixin.$completed.bind(userData);
          }));

          it('should return true if the user has his public id and country are set', function() {
            userData.publicId = 'bob';
            userData.country = {name: 'United Kindom', code: 'GB'};
            expect($completed()).toBe(true);
          });

          it('should return true if the user has his public id, country and age are set', function() {
            userData.publicId = 'bob';
            userData.yearOfBirth = 1990;
            userData.country = {name: 'United Kindom', code: 'GB'};
            expect($completed()).toBe(true);
          });

          it('should return true if the user has his public id, country, age and School are set', function() {
            userData.publicId = 'bob';
            userData.yearOfBirth = 2003;
            userData.country = {name: 'Singapore', code: 'SG'};
            userData.school = {name: 'Other', type: 'Other'};
            expect($completed()).toBe(true);
          });

          it('should return false if the user is from singapore, is 11y old and his school is not set', function() {
            userData.publicId = 'bob';
            userData.yearOfBirth = 2004;
            userData.country = {name: 'Singapore', code: 'SG'};
            expect($completed()).toBe(false);
          });

          it('should return false if the user is from singapore, is 19y old and his school is not set', function() {
            userData.publicId = 'bob';
            userData.yearOfBirth = 1996;
            userData.country = {name: 'Singapore', code: 'SG'};
            expect($completed()).toBe(false);
          });

          it('should return false if the user is from singapore and his/her age is missing', function() {
            userData.publicId = 'bob';
            userData.country = {name: 'Singapore', code: 'SG'};
            expect($completed()).toBe(false);
          });

          it('should return false if the user country is missing', function() {
            userData.publicId = 'bob';
            expect($completed()).toBe(false);
          });

        });

      });

    });

  });

})();
