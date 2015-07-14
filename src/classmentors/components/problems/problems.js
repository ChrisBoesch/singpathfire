(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.levelList, {
        templateUrl: 'classmentors/components/problems/problems-view-level-list.html',
        controller: 'ClmLevelListCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmLevelListCtrlInitialData',
            function(clmLevelListCtrlInitialData) {
              return clmLevelListCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.newLevel, {
        templateUrl: 'classmentors/components/problems/problems-view-new-level.html',
        controller: 'ClmNewLevelCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmNewLevelCtrlInitialData',
            function(clmNewLevelCtrlInitialData) {
              return clmNewLevelCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).


  /**
   * Use to resolve `initialData` of `ClmLevelListCtrl`.
   *
   */
  factory('clmLevelListCtrlInitialData', [
    '$q',
    'clmDataStore',
    function clmLevelListCtrlInitialDataFactory($q, clmDataStore) {
      return function clmLevelListCtrlInitialData() {
        return $q.all({
          levels: clmDataStore.problems.levels(),
          profile: clmDataStore.currentUserProfile()
        });
      };
    }
  ]).

  /**
   * ClmLevelListCtrl
   *
   */
  controller('ClmLevelListCtrl', [
    'initialData',
    'spfNavBarService',
    'urlFor',
    function ClmLevelListCtrl(initialData, spfNavBarService, urlFor) {
      var opts = [];

      this.levels = initialData.levels;
      this.profile = initialData.profile;

      if (this.profile && this.profile.user && this.profile.user.isAdmin) {
        opts.push({
          title: 'New level',
          url: '#' + urlFor('newLevel'),
          icon: 'add-circle-outline'
        });
      }

      spfNavBarService.update('Problem Levels', undefined, opts);

      this.listProblems = function(level) {
        console.dir(level);
      };
    }
  ]).


  /**
   * Use to resolve `initialData` of `ClmNewLevelCtrl`.
   *
   * Provide the controller with the current user profile.
   *
   * The promise with fails if the user has no profile or is not an admin.
   *
   * @return {Function}
   *
   */
  factory('clmNewLevelCtrlInitialData', [
    '$q',
    'clmDataStore',
    function clmNewLevelCtrlInitialDataFactory($q, clmDataStore) {
      return function clmNewLevelCtrlInitialData() {
        return $q.all({
          profile: clmDataStore.currentUserProfile().then(function(profile) {
            if (!profile && !profile.user) {
              return $q.reject(new Error('You should be logged in to create a new level.'));
            }

            if (!profile.user.isAdmin) {
              return $q.reject(new Error('You should be an admin to create a new level.'));
            }

            return profile;
          })
        });
      };
    }
  ]).

  /**
   * ClmNewLevelCtrl
   *
   */
  controller('ClmNewLevelCtrl', [
    'initialData',
    '$location',
    'spfNavBarService',
    'urlFor',
    'spfAlert',
    'clmDataStore',
    function ClmNewLevelCtrl(initialData, $location, spfNavBarService, urlFor, spfAlert, clmDataStore) {

      spfNavBarService.update('New Level', {
        title: 'Levels',
        url: '#' + urlFor('levelList')
      });

      this.profile = initialData.profile;

      this.newLevel = {acceptContribution: false};
      this.priority = 2;
      this.creatingLevel = false;

      this.save = function(profile, level, priority) {
        level.owner = {
          publicId: profile.$id,
          displayName: profile.user.displayName,
          gravatar: profile.user.gravatar
        };

        this.creatingLevel = true;
        clmDataStore.problems.newLevel(level, priority).then(function() {
          spfAlert.success('Event created');
          $location.path(urlFor('levelList'));
        }).catch(function() {
          spfAlert.error('Failed to create level.');
        }).finally(function() {
          this.creatingLevel = false;
        });
      };
    }
  ])

  ;

})();
