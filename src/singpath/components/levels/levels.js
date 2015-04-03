(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.levels, {
        templateUrl: 'singpath/components/levels/levels-view-list.html',
        controller: 'LevelListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'levelListCtrlInitialData',
            function(levelListCtrlInitialData) {
              return levelListCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.newLevel, {
        templateUrl: 'singpath/components/levels/levels-view-new.html',
        controller: 'NewLevelCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'newLevelCtrlInitialData',
            function(newLevelCtrlInitialData) {
              return newLevelCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Use to resolve `initialData` of `LevelListCtrl`.
   *
   */
  factory('levelListCtrlInitialData', [
    '$q',
    '$route',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function levelListCtrlInitialDataFactory($q, $route, spfAuth, spfAuthData, spfDataStore) {
      return function levelListCtrlInitialData() {
        var userPromise = spfAuthData.user();

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.all({
            auth: spfAuth,
            currentUser: userPromise,
            path: spfDataStore.paths.get($route.current.params.pathId),
            levels: spfDataStore.levels.list($route.current.params.pathId),
            profile: undefined
          });
        }

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          path: spfDataStore.paths.get($route.current.params.pathId),
          levels: spfDataStore.levels.list($route.current.params.pathId),
          profile: userPromise.then(function(userData) {
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
   * LevelListCtrl
   *
   */
  controller('LevelListCtrl', [
    'initialData',
    'urlFor',
    'spfNavBarService',
    function LevelListCtrl(initialData, urlFor, spfNavBarService) {
      var navBarOptions = [];

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.path = initialData.path;
      this.levels = initialData.levels;
      this.profile = initialData.profile;

      if (this.path.$canBeEditedBy(this.currentUser)) {
        navBarOptions.push({
          title: 'New level',
          url: '#' + urlFor('newLevel', {pathId: this.path.$id}),
          icon: 'add-circle-outline'
        });
      }

      spfNavBarService.update(
        initialData.path.title,
        [{
          title: 'Paths',
          url: '#' + urlFor('paths')
        }],
        navBarOptions
      );
    }
  ]).

  /**
   * Get user profile for new level view controller
   */
  factory('newLevelCtrlInitialData', [
    '$q',
    '$route',
    'spfAuth',
    'spfAuthData',
    'spfDataStore',
    function newLevelCtrlInitialDataFactory($q, $route, spfAuth, spfAuthData, spfDataStore) {
      return function newLevelCtrlInitialData() {
        var profilePromise;
        var userPromise = spfAuthData.user();
        var errLoggedOff = new Error('You should be logged in to create a level.');
        var errCannotEdit = new Error('You cannot edit this path');

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
          profile: profilePromise,
          path: $q.all({
            path: spfDataStore.paths.get($route.current.params.pathId),
            user: userPromise
          }).then(function(results) {
            if (
              !results.path ||
              !results.path.$canBeEditedBy ||
              !results.path.$canBeEditedBy(results.user)
            ) {
              return $q.reject(errCannotEdit);
            }
            return results.path;
          })
        });
      };
    }
  ]).

  /**
   * NewLevelCtrl - controller for new level view.
   *
   */
  controller('NewLevelCtrl', [
    '$q',
    '$location',
    'initialData',
    'urlFor',
    'spfNavBarService',
    'spfAuthData',
    'spfAlert',
    'spfDataStore',
    function NewLevelCtrl($q, $location, initialData, urlFor, spfNavBarService, spfAuthData, spfAlert, spfDataStore) {
      var self = this;

      spfNavBarService.update(
        'New level', {
          title: 'Levels',
          url: '#' + urlFor('levels', {pathId: initialData.path.$id})
        }
      );

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;
      this.path = initialData.path;
      this.level = {};
      this.savingLevel = false;

      this.createLevel = function(currentUser, path, level) {
        var next;

        self.savingLevel = true;

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
          level.owner = {
            publicId: currentUser.publicId,
            displayName: currentUser.displayName,
            gravatar: currentUser.gravatar
          };
          level.language = path.language;

          return spfDataStore.levels.create(path.$id, level);
        }).then(function(updatedLevel) {
          spfAlert.success('Level created.');
          $location.path(urlFor('levels', {pathId: path.$id}));
          return updatedLevel;
        }).catch(function(err) {
          spfAlert.error(err.message || err.toString());
          return err;
        }).finally(function() {
          this.savingLevel = false;
        });
      };
    }
  ])

  ;

})();
