/* global describe, beforeEach, it, browser, expect, element, by */

describe('angularjs homepage', function() {
  'use strict';

  beforeEach(function() {
    browser.addMockModule('e2eSpfMock', function() {
      angular.module('e2eSpfMock', ['spf']);
    });
  });

  it('should greet', function() {
    browser.get('/#/class-mentors');

    expect(element(by.id('hello-who')).getText()).toEqual('world');

    element(by.id('nav-login')).click();
    browser.sleep(1000);
    expect(element(by.id('hello-who')).getText()).toEqual('bob');
  });
});
