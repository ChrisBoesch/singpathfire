/* eslint-env jasmine */
/* global module, inject, angular */

(function() {
  'use strict';

  describe('spf problems components', function() {

    // describe('directives', function() {

    //   var compile, scope, elem;

    //   beforeEach(module('spf'));

    //   beforeEach(inject(function(_$compile_, _$rootScope_) {
    //     compile = _$compile_;
    //     scope = _$rootScope_;
    //   }));

    //   describe('someDirective', function() {

    //     beforeEach(function() {
    //       elem = compile('')(scope);
    //     });

    //     it('Should fail', function() {
    //       expect(false).toBe(true);
    //     });

    //   });

    // });

    describe('controllers', function() {
      // var $controller;

      beforeEach(module('spf'));

      describe('PlayProblemCtrl', function() {
        // var deps, ctrl;

        // beforeEach(function() {
        //   deps = {};
        // });

        describe('playProblemCtrlInitialData', function() {
          var $rootScope, $q, $route, urlFor, spfAuth, spfAuthData, spfDataStore, init;

          beforeEach(function() {
            $route = jasmine.createSpyObj('$route', ['reload']);
            urlFor = jasmine.createSpy('urlFor');
            spfAuth = jasmine.createSpyObj('spfAuth', ['login', 'logout', 'onAuth']);
            spfAuthData = jasmine.createSpyObj('spfAuth', ['user']);
            spfDataStore = jasmine.createSpyObj('spfDataStore', ['profile', 'initProfile']);
            spfDataStore.paths = jasmine.createSpyObj('spfDataStore.paths', ['get']);
            spfDataStore.levels = jasmine.createSpyObj('spfDataStore.levels', ['get']);
            spfDataStore.problems = jasmine.createSpyObj('spfDataStore.problems', ['get']);
            spfDataStore.resolutions = jasmine.createSpyObj('spfDataStore.resolutions', ['get']);
            spfDataStore.solutions = jasmine.createSpyObj('spfDataStore.solutions', ['get']);

            $route.current = {
              params: {pathId: 'pathId', levelId: 'levelId', problemId: 'problemId'}
            };

            module(function($provide) {
              $provide.value('$route', $route);
              $provide.value('urlFor', urlFor);
              $provide.value('spfAuth', spfAuth);
              $provide.value('spfAuthData', spfAuthData);
              $provide.value('spfDataStore', spfDataStore);
            });
          });

          beforeEach(inject(function(_$rootScope_, _$q_, playProblemCtrlInitialData) {
            $rootScope = _$rootScope_;
            $q = _$q_;
            init = playProblemCtrlInitialData;
          }));

          it('should resolve to an empty object if the user is not logged in', function() {
            var actual;

            spfAuth.user = null;

            init().then(function(resp) {
              actual = resp;
            });

            $rootScope.$apply();
            expect(actual).toEqual({});
          });

          it('should resolve to only the auth details and auth data if the user has no public Id', function() {
            var authData = {displayName: 'bob'};
            var actual;

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));

            init().then(function(resp) {
              actual = resp;
            });

            $rootScope.$apply();
            expect(actual).toEqual({auth: spfAuth, currentUser: authData});
          });

          it('should query the profile for the user', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue($q.reject()); // stop the chain here

            init();

            $rootScope.$apply();
            expect(spfDataStore.profile).toHaveBeenCalledWith('bob');
          });

          it('should initiate the profile if it does not exist yet', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob', $value: null});

            init();

            $rootScope.$apply();
            expect(spfDataStore.initProfile).toHaveBeenCalled();
          });

          it('should query the problem data', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob', $value: null});

            init();

            $rootScope.$apply();
            expect(spfDataStore.paths.get).toHaveBeenCalledWith('pathId');
            expect(spfDataStore.levels.get).toHaveBeenCalledWith('pathId', 'levelId');
            expect(spfDataStore.problems.get).toHaveBeenCalledWith('pathId', 'levelId', 'problemId');
            expect(spfDataStore.resolutions.get).toHaveBeenCalledWith('pathId', 'levelId', 'problemId', 'bob');
          });

          it('should reject if the problem is missing', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);
            var err;

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob', $value: null});
            spfDataStore.problems.get.and.returnValue({$id: 'problemId', $value: null});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.$init.and.returnValue($q.when());

            init().catch(function(e) {
              err = e;
            });

            $rootScope.$apply();
            expect(err).toEqual(jasmine.any(Error));
            expect(err).toEqual(new Error('Problem not found.'));
          });

          it('should start new resolution if one is not started', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob'});
            spfDataStore.problems.get.and.returnValue({$id: 'problemId'});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.$init.and.returnValue($q.when());

            init();

            $rootScope.$apply();
            expect(resolution.$init).toHaveBeenCalled();
          });

          it('should not start the resolution if it is started already', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob'});
            spfDataStore.problems.get.and.returnValue({$id: 'problemId'});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.startedAt = 1234;

            init();

            $rootScope.$apply();
            expect(resolution.$init).not.toHaveBeenCalled();
          });

          it('should query the user solution if the problem is not solved', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob'});
            spfDataStore.problems.get.and.returnValue({$id: 'problemId'});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.startedAt = 1234;
            resolution.$solved.and.returnValue(false);

            init();

            $rootScope.$apply();
            expect(
              spfDataStore.solutions.get
            ).toHaveBeenCalledWith(
              'pathId', 'levelId', 'problemId', 'bob'
            );
          });

          it('should not query the user solution if the problem is solved', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob'});
            spfDataStore.problems.get.and.returnValue({$id: 'problemId'});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.startedAt = 1234;
            resolution.$solved.and.returnValue(true);

            init();

            $rootScope.$apply();
            expect(spfDataStore.solutions.get).not.toHaveBeenCalled();
          });

          it('should resolved to the problem data', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);
            var actual;
            var path = {};
            var level = {};
            var problem = {};

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob'});
            spfDataStore.paths.get.and.returnValue(path);
            spfDataStore.levels.get.and.returnValue(level);
            spfDataStore.problems.get.and.returnValue(problem);
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.startedAt = 1234;
            resolution.$solved.and.returnValue(true);

            init().then(function(data) {
              actual = data;
            });

            $rootScope.$apply();
            expect(actual.path).toBe(path);
            expect(actual.level).toBe(level);
            expect(actual.problem).toBe(problem);
            expect(actual.resolution).toBe(resolution);
          });

          it('should resolve to the solution if the problem is not solved', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);
            var actual;
            var solution = {};

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue({$id: 'bob'});
            spfDataStore.problems.get.and.returnValue({});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            spfDataStore.solutions.get.and.returnValue(solution);
            resolution.startedAt = 1234;
            resolution.$solved.and.returnValue(false);

            init().then(function(data) {
              actual = data;
            });

            $rootScope.$apply();
            expect(actual.solution).toBe(solution);
          });

          it('should resolve to user profile', function() {
            var authData = {displayName: 'bob smith', publicId: 'bob'};
            var resolution = jasmine.createSpyObj('resolution', ['$init', '$solved']);
            var actual;
            var profile = {$id: 'bob'};

            spfAuth.user = {uid: 'google:1234'};
            spfAuthData.user.and.returnValue($q.when(authData));
            spfDataStore.profile.and.returnValue(profile);
            spfDataStore.problems.get.and.returnValue({});
            spfDataStore.resolutions.get.and.returnValue(resolution);
            resolution.startedAt = 1234;
            resolution.$solved.and.returnValue(true);

            init().then(function(data) {
              actual = data;
            });

            $rootScope.$apply();
            expect(actual.profile).toBe(profile);
          });

        });

      });

    });

  });

})();
