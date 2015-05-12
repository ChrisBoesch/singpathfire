(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.profile, {
        templateUrl: 'singpath/components/profile/profile-view.html',
        controller: 'SpfProfileCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'spfProfileCtrlInitialData',
            function(spfProfileCtrlInitialData) {
              return spfProfileCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Use to resolve `initialData` of `SpfProfileCtrl`.
   *
   */
  factory('spfProfileCtrlInitialData', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function spfProfileCtrlInitialDataFactory($q, spfAuth, spfAuthData, spfDataStore) {
      return function spfProfileCtrlInitialData() {
        var profilePromise;
        var errLoggedOff = new Error('You should be logged in to create/update your profile.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = spfDataStore.currentUserProfile().then(function(profile) {
          if (profile && profile.$value === null) {
            return spfDataStore.initProfile();
          }

          return profile;
        });

        return $q.all({
          auth: spfAuth,
          currentUser: spfAuthData.user(),
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * SpfProfileCtrl
   *
   */
  controller('SpfProfileCtrl', [
    'initialData',
    'spfFirebase',
    'spfAlert',
    'spfAuthData',
    'spfDataStore',
    function SpfProfileCtrl(initialData, spfFirebase, spfAlert, spfAuthData, spfDataStore) {
      var self = this;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;

      this.savingProfile = false;

      this.saveProfile = function(currentUser) {
        var resultPromise;

        self.savingProfile = true;
        if (!self.profile) {
          cleanData(currentUser);
          resultPromise = spfAuthData.publicId(currentUser).then(function() {
            return spfDataStore.initProfile();
          });
        } else {
          cleanData(currentUser);
          resultPromise = currentUser.$save().then(function() {
            return spfDataStore.currentUserProfile();
          });
        }

        return resultPromise.then(function(profile) {
          spfAlert.success('Your profile is saved.');
          self.profile = profile;
          return profile;
        }).finally(function() {
          self.savingProfile = false;
        });
      };

      function cleanData(currentUser) {
        currentUser.country = spfFirebase.cleanObj(currentUser.country);
        currentUser.school = spfFirebase.cleanObj(currentUser.school);
      }
    }
  ])

  ;

})();
