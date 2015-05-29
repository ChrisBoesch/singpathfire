(function() {
  'use strict';

  angular.module('spf.shared').

  /**
   * Defined an icon set.
   *
   * The set is build at https://icomoon.io/app:
   * 0. go to https://icomoon.io/app.
   * 1. Select icons from the "Material Design Icons" collection.
   * 2. download and extract the set.
   * 3. copy svgdefs.svg into this component folder
   *    (replace the existing ones).
   * 4. open svgdefs.svg and replace all the `symbols` tags for `g` tags.
   * 5. open svgdefs.svg and rename all icon ids from "icon-something" to just
   *    "something"
   *
   * The set is now ready.
   */
  config([
    '$mdIconProvider',
    function($mdIconProvider) {
      $mdIconProvider.defaultIconSet('shared/components/icons/svgdefs.svg', 1024)
        .icon(
          'language:python',
          'shared/components/icons/icons-python.svg',
          120
        )
        .icon(
          'language:angularjs',
          'shared/components/icons/icons-angularjs.svg',
          120
        )
        .icon(
          'language:javascript',
          'shared/components/icons/icons-javascript.svg',
          630
        );
    }
  ])

  ;

})();
