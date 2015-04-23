(function() {
  'use strict';
  /* eslint no-extend-native: 0 */

  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.lastIndexOf(searchString, position) === position;
    };
  }

})();
