# Components

Components regroup controllers, services, directive and tests related
to a feature.


## Structure

For the landing page of the class-mentor site, we would store it at 
`app/components/class-mentors/home/`. We would include:

    home/home.js                # Implementation of any controllers, directives
                                  or services (service, factory, providers),
                                  and the configuration of the route to that 
                                  feature.
                                  Note: you should include that file in the 
                                  index.html list of script.
    home/home-view.html 		# Partial for that view
    home/home-scenario.e2e.js 	# Protractor scenario for e2e tests
    home/home.spec.js 			# Unit tests


If the content of the feature was to grow, we could split controllers, directives
and services:

    home/home-controllers.js
    home/home-controllers.spec.js
    home/home-directives.js
    home/home-directives.spec.js
    home/home-scenario.e2e.js
    home/home-services.js
    home/home-services.spec.js
    home/home-view.html 


If a feature defines more than one controller and require more than one 
partial, their file names should all starts with `<component-name>-view`:

    home/home-scenario.e2e.js
    home/home-view-index.html
    home/home-view-edit.html
    home/home-view-mentors.html
    home/home.js
    home/home.spec.js


## Templates


### Controller

```js
(function() {
  'use strict';

  // all features share the same module, `oep`
  // the `oep` module dependencies are defined in `src/app/app.js`
  angular.module('oep').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      // route paths are defined in the route constante in `src/app/app.js`
      $routeProvider.when(routes.someRouteName, {
        templateUrl: 'app/components/class-mentors/some-feature/some-feature-view.html',
        controller: 'ClsMentorSomeCtrl',
        // the controller will be added to the scope of the view as `ctrl`
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clsMentorSomeCtrlResolver',
            function(clsMentorSomeCtrlResolver){
              return clsMentorSomeCtrlResolver();
            }
          ]
        }
      });
    }
  ]).

  /**
   * Resolve async assets for our controller the controller.
   *
   * The router will wait for those async resources to resolve. The controller
   * will receive object and not a promises.
   *
   * It make writing and testing the controller easier.
   * 
   */
  factory('clsMentorSomeCtrlResolver', [
    '$q',
    'getUser',
    'getAssets',
    function clsMentorSomeCtrlResolverFactory($q, getUser, getAssets) {
      return function clsMentorSomeCtrlResolver() {
        // $q.all resolves when members have resolved.
        return $q.all({
          user: getUser(),
          assets: getAssets(),
        });
      };
    }
  ]).
  
  /**
   * clsMentorSomeCtrl
   *
   */
  controller('ClsMentorSomeCtrl', [
    'initialData',
    function SomeCtrl(initialData) {
      this.user = initialData.user;
      this.assets = initialData.assets;
    }
  ])

  ;

})();
```


### A view

A view going with the controller above:
```html
<p>hello {{ctrl.user.name}}</p>
<p>Your assets</p>
<ul>
	<li ng-repeat="item in ctrl.assets">item</li>
</ul>
```

### Tests

Tests the controller and its resolver.
```js
/* jshint camelcase: false*/
/* global describe, beforeEach, module, it, inject, expect, jasmine */

(function() {
  'use strict';

  describe('oep some feature of class mentors', function() {
    // load oep
    beforeEach(module('oep'));


    describe('ClsMentorSomeCtrl', function() {
      var $controller, $rootScope, $q, ctrl;

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));

      it('Should have a user attribute', function() {
        ctrl = $controller('HomeCtrl', {
          initData: {
            'user': {
              name: 'bob'
            },
            'assets': ['foo', 'bar']
          }
        });
        expect(ctrl.user.name).toBe('bob');
      });

      it('should have an assets attribute', function() {
        ctrl = $controller('HomeCtrl', {
          initData: {
            'user': {
              name: 'bob'
            },
            'assets': ['foo', 'bar']
          }
        });
        expect(ctrl.assets).toEqual(['foo', 'bar']);
      });

    });


    describe('clsMentorSomeCtrlResolver', function() {
      var getUser, getAssets;

      beforeEach(function() {
        module(function($provide) {
        	getUser = jasmine.createSpy('getUser');
    	    getAssets = jasmine.createSpy('getAssets');
          
          // Overwrite dependencies of clsMentorSomeCtrlResolver during the test.
          $provide.value('getUser', getUser);
          $provide.value('getAssets', getAssets);
        });
      });

      it(
        'Should resolve to an object with a user attribute',
        inject(function($rootScope, $q, clsMentorSomeCtrlResolver) {
          var data;

          getUser.and.returnValue($q.when({
            name: 'bob'
          }));
          getUser.and.returnValue($q.when(['foo']));

          clsMentorSomeCtrlResolver().then(function(result) {
            data = result;
          });

          // Make promise resolve
          $rootScope.$apply();
          expect(data.user.name).toBe('bob');
        })
      );

      it(
        'Should resolve to an object with an assets attribute',
        inject(function($rootScope, $q, clsMentorSomeCtrlResolver) {
          var data;

          getUser.and.returnValue($q.when({
            name: 'bob'
          }));
          getUser.and.returnValue($q.when(['foo']));

          clsMentorSomeCtrlResolver().then(function(result) {
            data = result;
          });

          // Make promise resolve
          $rootScope.$apply();
          expect(data.assets).toEqual(['foo']);
        })
      );

    });

  });

})();
```

### Directive

TODO


### E2E tests

TODO