/* global describe, beforeEach, it, browser */

describe('angularjs homepage', function() {
  'use strict';

  beforeEach(function() {
    browser.addMockModule('e2eClmMock', function() {
      angular.module('e2eClmMock', ['clm']);
    });
  });

  it('should show an empty list of event', function() {
    browser.get('/classmentors.html');
    // TODO: make sure the session is reset.
  });
});
