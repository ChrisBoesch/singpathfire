(function() {
  'use strict';

  angular.module('spf.shared.material').

  config([
    '$mdIconProvider',
    function($mdIconProvider) {
      // TODO: fix.
      $mdIconProvider.defaultIconSet('shared/components/icons/svgdefs.svg', 24);
    }
  ]);

})();
