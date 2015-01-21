(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.home, {
        templateUrl: 'app/components/home/home-view.html',
        controller: 'HomeCtrl',
        controllerAs: 'ctrl'
      });
    }
  ]).

  controller('HomeCtrl', [
    function() {
      this.greeting = 'Hello world!';
    }
  ]);

})();
