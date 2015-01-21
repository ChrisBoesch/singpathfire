/**
 * Defines the SingPath Fire angular app and its main services and controllers.
 *
 * If was to become too big, only config and contants should be kept here;
 * controllers could be sent off to a main/main-controllers.js and services
 * to mani/main-services.js.
 *
 */
(function() {
  'use strict';

  angular.module('spf', [
    'angular-loading-bar',
    'firebase',
    'mgcrea.ngStrap',
    'ngAnimate',
    'ngRoute'
  ]).

  config(['$routeProvider', 'cfpLoadingBarProvider',
    function($routeProvider, cfpLoadingBarProvider) {
      $routeProvider.otherwise({
        redirectTo: '/'
      });

      cfpLoadingBarProvider.includeSpinner = false;
    }
  ]).

  constant('routes', {
    'home': '/'
  }).

  controller('SpfNavBarCtrl', [
    function() {

    }
  ])

  ;

})();
