/* jshint camelcase: false*/
/* global describe, beforeEach, module, it, inject, expect, jasmine */

(function() {
  'use strict';

  describe('spf', function() {

    /**
     * Test core singpath fire controllers.
     *
     */
    describe('controllers', function() {
      var $controller, $rootScope, $q;

      beforeEach(module('spf'));

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));


      /**
       * Test SpfNavBarCtrl.
       */
      describe('SpfNavBarCtrl', function() {
        var ctrl, alert, auth;

        beforeEach(function() {
          auth = jasmine.createSpyObj('spfAuth', ['login', 'logout']);
          alert = jasmine.createSpy('spfAlert');
          ['info', 'success', 'warning', 'danger'].map(function(k) {
            alert[k] = jasmine.createSpy(k);
          });
          ctrl = $controller('SpfNavBarCtrl', {
            spfAuth: auth,
            spfAlert: alert
          });

        });

        it('should have auth attribute', function() {
          expect(ctrl.auth).toBe(auth);
        });

        it('should login users', function() {
          var resp = {
            uid: '1234'
          };
          var result;

          auth.login.and.returnValue($q.when(resp));

          ctrl.login().then(function(resp) {
            result = resp;
          });
          $rootScope.$apply();

          expect(result).toBe(resp);
        });

        it('should alert users when login fails', function() {
          var e = new Error('I want it to fail');

          auth.login.and.returnValue($q.reject(e));

          ctrl.login();
          $rootScope.$apply();

          expect(alert.warning).toHaveBeenCalled();
        });

        it('should reject login promise on error', function() {
          var e = new Error('I want it to fail');
          var result;

          auth.login.and.returnValue($q.reject(e));

          ctrl.login().catch(function(e) {
            result = e;
          });
          $rootScope.$apply();

          expect(result).toBe(e);
        });

      });


    });


    /**
     * Test core singpath fire services
     */
    describe('services', function() {


      describe('spfFirebase', function() {
        var provider, factory, Firebase, firebaseSpy, spfFirebase;

        beforeEach(module('spf', function(spfFirebaseProvider) {
          provider = spfFirebaseProvider;
          firebaseSpy = jasmine.createSpy('Firebase');
          Firebase = function(url) {
            firebaseSpy(url);
          };
          factory = function() {
            return provider.$get.slice(-1).pop()({
              Firebase: Firebase
            });
          };
        }));

        it('should return true on method call', inject(function() {
          spfFirebase = factory();
          expect(spfFirebase().constructor).toBe(Firebase);
        }));

        it('should return ref to singpath database', function() {
          spfFirebase = factory();
          spfFirebase();
          expect(firebaseSpy).toHaveBeenCalledWith('https://singpath.firebaseio.com/');
        });

        it('should allow to configure the ref baseurl', function() {
          provider.setBaseUrl('https://singpath-dev.firebaseio.com/');
          spfFirebase = factory();
          spfFirebase();
          expect(firebaseSpy).toHaveBeenCalledWith('https://singpath-dev.firebaseio.com/');
        });

      });


      describe('spfAuth', function() {
        var auth, spfFirebase;

        beforeEach(module('spf'));

        beforeEach(function() {
          var $firebaseAuth;

          spfFirebase = jasmine.createSpy('spfFirebase');
          auth = jasmine.createSpyObj('auth', ['$getAuth', '$authWithOAuthPopup', '$authWithOAuthRedirect', '$unauth']);
          $firebaseAuth = jasmine.createSpy('$firebaseAuth').and.returnValue(auth);

          module(function($provide) {
            $provide.value('spfFirebase', spfFirebase);
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
              expect(auth.$authWithOAuthPopup).toHaveBeenCalledWith('google');
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
              expect(auth.$authWithOAuthRedirect).toHaveBeenCalledWith('google');
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


      describe('spfAlert', function() {
        var $alert, spfAlert;

        beforeEach(module('spf'));

        beforeEach(function() {
          module(function($provide) {
            $alert = jasmine.createSpy();
            $alert.and.returnValue(null);
            $provide.value('$alert', $alert);
          });

          inject(function(_spfAlert_) {
            spfAlert = _spfAlert_;
          });
        });

        it('should alert users', function() {
          spfAlert('Title', 'Content');
          expect($alert.calls.mostRecent().args[0].content).toBe('Content');
          expect($alert.calls.mostRecent().args[0].title).toBe('Title');
          expect($alert.calls.mostRecent().args[0].type).toBe('title');
        });

        describe('spfAlert.success', function() {

          it('should send a notification of type "success"', function() {
            spfAlert.success('Content');
            expect($alert.calls.mostRecent().args[0].content).toBe('Content');
            expect($alert.calls.mostRecent().args[0].title).toBe('Success');
            expect($alert.calls.mostRecent().args[0].type).toBe('success');
          });

        });

        describe('spfAlert.info', function() {

          it('should send a notification of type "info"', function() {
            spfAlert.info('Content');
            expect($alert.calls.mostRecent().args[0].content).toBe('Content');
            expect($alert.calls.mostRecent().args[0].title).toBe('Info');
            expect($alert.calls.mostRecent().args[0].type).toBe('info');
          });

        });

        describe('spfAlert.warning', function() {

          it('should send a notification of type "warning"', function() {
            spfAlert.warning('Content');
            expect($alert.calls.mostRecent().args[0].content).toBe('Content');
            expect($alert.calls.mostRecent().args[0].title).toBe('Warning');
            expect($alert.calls.mostRecent().args[0].type).toBe('warning');
          });

        });

        describe('spfAlert.danger', function() {

          it('should send a notification of type "danger"', function() {
            spfAlert.danger('Content');
            expect($alert.calls.mostRecent().args[0].content).toBe('Content');
            expect($alert.calls.mostRecent().args[0].title).toBe('Danger');
            expect($alert.calls.mostRecent().args[0].type).toBe('danger');
          });

        });

      });

    });


  });

})();
