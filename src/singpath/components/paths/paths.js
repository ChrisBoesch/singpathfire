(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.paths, {
        templateUrl: 'singpath/components/paths/paths-view-list.html',
        controller: 'PathListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'pathListCtrlInitialData',
            function(pathListCtrlInitialData) {
              return pathListCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.newPath, {
        templateUrl: 'singpath/components/paths/paths-view-new.html',
        controller: 'NewPathCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'newPathCtrlInitialData',
            function(newPathCtrlInitialData) {
              return newPathCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Use to resolve `initialData` of `PathListCtrl`.
   *
   */
  factory('pathListCtrlInitialData', [
    '$q',
    'spfDataStore',
    function pathListCtrlInitialDataFactory($q, spfDataStore) {
      return function pathListCtrlInitialData() {
        return $q.all({
          paths: spfDataStore.paths.list(),
          profile: spfDataStore.currentUserProfile()
        });
      };
    }
  ]).

  /**
   * PathListCtrl
   *
   */
  controller('PathListCtrl', [
    'initialData',
    'urlFor',
    'spfNavBarService',
    function PathListCtrl(initialData, urlFor, spfNavBarService) {
      spfNavBarService.update(
        'Paths',
        undefined, [{
          title: 'New path',
          url: '#' + urlFor('newPath'),
          icon: 'add-circle-outline'
        }]
      );
      this.paths = initialData.paths;
      this.profile = initialData.profile;
    }
  ]).

  /**
   * Get user profile for new path view controller
   */
  factory('newPathCtrlInitialData', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function newPathCtrlInitialDataFactory($q, spfAuth, spfAuthData, spfDataStore) {
      return function newPathCtrlInitialData() {
        var profilePromise;
        var errLoggedOff = new Error('The user should be logged in to create a path.');

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
   * NewPathCtrl - controller for new path view.
   *
   */
  controller('NewPathCtrl', [
    '$q',
    '$location',
    'initialData',
    'urlFor',
    'spfFirebase',
    'spfNavBarService',
    'spfAuthData',
    'spfAlert',
    'spfDataStore',
    function NewPathCtrl(
      $q, $location, initialData, urlFor, spfFirebase, spfNavBarService, spfAuthData, spfAlert, spfDataStore
    ) {
      var self = this;

      spfNavBarService.update(
        'New path', {
          title: 'Paths',
          url: '#' + urlFor('paths')
        }
      );

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.path = {};
      this.savingPath = false;
      this.profileNeedsUpdate = !this.currentUser.$completed();

      this.createPath = function(currentUser, path) {
        var next;

        self.savingPath = true;

        if (!self.profile) {
          cleanProfile();
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return spfDataStore.initProfile();
          }).then(function(profile) {
            self.profile = profile;
            self.profileNeedsUpdate = !self.currentUser.$completed();
            return profile;
          });
        } else if (self.profileNeedsUpdate) {
          cleanProfile();
          next = self.currentUser.$save().then(function() {
            self.profileNeedsUpdate = !self.currentUser.$completed();
          });
        } else {
          next = $q.when();
        }

        return next.then(function() {
          path.owner = {
            publicId: currentUser.publicId,
            displayName: currentUser.displayName,
            gravatar: currentUser.gravatar
          };

          return spfDataStore.paths.create(path);
        }).then(function(updatedPath) {
          spfAlert.success('Path created.');
          $location.path(urlFor('paths'));
          return updatedPath;
        }).catch(function(err) {
          spfAlert.error(err.message || err.toString());
          return err;
        }).finally(function() {
          self.savingPath = false;
        });
      };

      function cleanProfile() {
        self.currentUser.country = spfFirebase.cleanObj(self.currentUser.country);
        self.currentUser.school = spfFirebase.cleanObj(self.currentUser.school);
      }
    }
  ])

  ;

})();
