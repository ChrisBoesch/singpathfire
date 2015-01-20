/* global describe, it, browser, expect, element, by */

describe('angularjs homepage', function() {
  'use strict';

  it('should greet', function() {
    browser.get('/');

    expect(element(by.binding('ctrl.greeting')).getText()).toEqual('Hello world!');
  });
});
