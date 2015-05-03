(function() {
  'use strict';

  angular.module('spf').

  config([
    '$mdIconProvider',
    function($mdIconProvider) {
      // Configure URLs for icons specified by [set:]id.
      $mdIconProvider
        .icon(
          'language:python',
          'singpath/components/icons/icons-python.svg',
          120
        )
        .icon(
          'language:angularjs',
          'singpath/components/icons/icons-angularjs.svg',
          120
        )
        .icon(
          'language:javascript',
          'singpath/components/icons/icons-javascript.svg',
          630
        );
    }
  ])

  ;

})();
