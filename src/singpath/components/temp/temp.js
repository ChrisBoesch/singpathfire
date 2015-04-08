(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.levels, {
        templateUrl: 'singpath/components/temp/temp.html',
        controller: 'TempCtrl',
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
        templateUrl: 'singpath/components/temp/temp1.html',
        controller: 'TempCtrl',
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
   * TempCtrl
   *
   */
  controller('TempCtrl', [
    'initialData',
    'urlFor',
    'spfNavBarService',
    function TempCtrl(initialData, urlFor, spfNavBarService) {
      var navBarOptions = [];

    }
  ])

})();
