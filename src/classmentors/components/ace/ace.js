(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.aceOfCoders, {
        templateUrl: 'classmentors/components/ace/ace-view.html',
        controller: 'ClmAceOfCodersCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmAceOfCodersCtrlInitialData',
            function(clmAceOfCodersCtrlInitialData) {
              return clmAceOfCodersCtrlInitialData();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Use to resolve `initialData` of `ClmAceOfCodersCtrl`.
   *
   */
  factory('clmAceOfCodersCtrlInitialData', [
    '$q',
    function clmAceOfCodersCtrlInitialDataFactory($q) {
      return function clmAceOfCodersCtrlInitialData() {
        return $q.all({});
      };
    }
  ]).

  /**
   * ClmAceOfCodersCtrl
   *
   */
  controller('ClmAceOfCodersCtrl', [
    'initialData',
    'spfNavBarService',
    function ClmAceOfCodersCtrl(initialData, spfNavBarService) {
      spfNavBarService.update('Ace of Coders');
    }
  ])

  ;

})();
