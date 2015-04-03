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
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function pathListCtrlInitialDataFactory($q, spfAuth, spfAuthData, spfDataStore) {
      return function pathListCtrlInitialData() {
        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.all({
            paths: spfDataStore.paths.list(),
            profile: undefined
          });
        }

        return $q.all({
          paths: spfDataStore.paths.list(),
          profile: spfAuthData.user().then(function(userData) {
            if (!userData.publicId) {
              return;
            }

            return spfDataStore.profile(userData.publicId).then(function(profile) {
              if (profile && profile.$value === null) {
                return spfDataStore.initProfile(userData);
              }
              return profile;
            });
          })
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
        var userPromise = spfAuthData.user();
        var profilePromise;
        var errLoggedOff = new Error('The user should be logged in to create a path.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return;
          }

          return spfDataStore.profile(userData.publicId).then(function(profile) {
            if (profile && profile.$value === null) {
              return spfDataStore.initProfile(userData);
            }

            return profile;
          });
        });

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
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
    'spfNavBarService',
    'spfAuthData',
    'spfAlert',
    'spfDataStore',
    function NewPathCtrl($q, $location, initialData, urlFor, spfNavBarService, spfAuthData, spfAlert, spfDataStore) {
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

      this.createPath = function(currentUser, path) {
        var next;

        self.savingPath = true;

        if (!self.profile) {
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return spfDataStore.initProfile(currentUser);
          }).then(function(profile) {
            self.profile = profile;
            return profile;
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
          this.savingPath = false;
        });
      };
    }
  ])

  ;

})();
