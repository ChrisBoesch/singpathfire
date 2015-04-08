(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.temp, {
        templateUrl: 'singpath/components/temp/temp.html',
        controller: 'TempCtrl',
        controllerAs: 'ctrl'
      }).

      when(routes.temp1, {
        templateUrl: 'singpath/components/temp/temp1.html',
        controller: 'TempCtrl',
        controllerAs: 'ctrl'
      });

    }
  ]).

  /**
   * TempCtrl
   *
   */
  controller('TempCtrl', [
    function TempCtrl() {
      this.name = 'Chris';
    }
  ]);

})();
