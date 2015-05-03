/* eslint-env jasmine */
/* global module, inject */

(function() {
  'use strict';

  describe('SPF_COUNTRIES', function() {

    beforeEach(module('spf.shared'));

    it('should hold a list of country', inject(function(SPF_COUNTRIES) {
      var sg = SPF_COUNTRIES.find(function(country) {
        return country.code === 'SG';
      });

      expect(sg.name).toBe('Singapore');
    }));

  });

})();
