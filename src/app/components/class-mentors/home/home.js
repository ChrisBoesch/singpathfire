(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.classMentor, {
        templateUrl: 'app/components/class-mentors/home/home-view.html',
        controller: 'ClassMemtorsHomeCtrl',
        controllerAs: 'ctrl'
      });
    }
  ]).

  controller('ClassMemtorsHomeCtrl', [
    'spfAuth',
    function(spfAuth) {
      this.auth = spfAuth;
    }
  ]);

})();
