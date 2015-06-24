(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.setProfileCodeCombatId, {
        template: '<md-content flex class="md-padding" layout="row">Something went wrong...</md-content>',
        controller: 'SetCodeCombatUserIdCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'setCodeCombatUserIdCtrlInitialData',
            function(setCodeCombatUserIdCtrlInitialData) {
              return setCodeCombatUserIdCtrlInitialData();
            }
          ]
        }
      }).

      when(routes.editProfile, {
        templateUrl: 'classmentors/components/profiles/profiles-view-edit.html',
        controller: 'ClmProfileCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmEditProfileInitialDataResolver',
            function(clmEditProfileInitialDataResolver) {
              return clmEditProfileInitialDataResolver();
            }
          ]
        }
      }).

      when(routes.profile, {
        templateUrl: 'classmentors/components/profiles/profiles-view-show.html',
        controller: 'ClmProfileCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'clmShowProfileInitialDataResolver',
            function(clmShowProfileInitialDataResolver) {
              return clmShowProfileInitialDataResolver();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Used to resolve `initialData` of `ClmProfileCtrl` the logged in user profile.
   *
   */
  factory('clmEditProfileInitialDataResolver', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'clmDataStore',
    function clmEditProfileInitialDataResolverFactory($q, spfAuth, spfAuthData, clmDataStore) {
      return function clmEditProfileInitialDataResolver() {
        var profilePromise;
        var errLoggedOff = new Error('You need to be logged to edit her/his profile.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = clmDataStore.currentUserProfile().then(function(profile) {
          if (profile && profile.$value === null) {
            return clmDataStore.initProfile();
          }

          return profile;
        });

        return $q.all({
          auth: spfAuth,
          currentUser: spfAuthData.user(),
          profile: profilePromise,
          currentUserProfile: profilePromise
        });
      };
    }
  ]).

  /**
   * Used to resolve `initialData` of `ClmProfileCtrl` for a public profile.
   *
   */
  factory('clmShowProfileInitialDataResolver', [
    '$q',
    '$route',
    'spfAuth',
    'spfAuthData',
    'clmDataStore',
    function clmShowProfileInitialDataResolverFactory($q, $route, spfAuth, spfAuthData, clmDataStore) {
      return function clmShowProfileInitialDataResolver() {
        var publicId = $route.current.params.publicId;
        var profilePromise;
        var errNoPublicId = new Error('Unexpected error: the public id is missing');
        var errNoProfile = new Error('Could not found the profile for ' + publicId);

        if (!publicId) {
          return $q.reject(errNoPublicId);
        }

        profilePromise = clmDataStore.profile(publicId).then(function(profile) {
          if (profile.$value === null) {
            return $q.reject(errNoProfile);
          }
          return profile;
        });

        return $q.all({
          auth: spfAuth,
          currentUser: spfAuthData.user().catch(angular.noop),
          currentUserProfile: clmDataStore.currentUserProfile(),
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * ClmProfileCtrl
   *
   */
  controller('ClmProfileCtrl', [
    '$q',
    '$route',
    'spfFirebase',
    'spfAuthData',
    'spfNavBarService',
    'initialData',
    'clmDataStore',
    'spfAlert',
    function ClmProfileCtrl(
      $q, $route, spfFirebase, spfAuthData, spfNavBarService, initialData, clmDataStore, spfAlert
    ) {
      var self = this;
      var menu = [];

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.currentUserProfile = initialData.currentUserProfile;
      this.profile = initialData.profile;

      if (
        this.profile &&
        this.profile.$id &&
        this.currentUser &&
        this.currentUser.publicId === this.profile.$id
      ) {
        menu = [{
          title: 'Edit',
          onClick: function() {
            self.profileNeedsUpdate = true;
          },
          icon: 'create'
        }];
      }

      spfNavBarService.update('Profile', undefined, menu);

      this.settingPublicId = false;
      this.profileNeedsUpdate = this.currentUser && !this.currentUser.$completed();

      function cleanProfile(currentUser) {
        currentUser.country = spfFirebase.cleanObj(currentUser.country);
        currentUser.school = spfFirebase.cleanObj(currentUser.school);
      }

      this.setPublicId = function(currentUser) {
        var saved;

        this.settingPublicId = true;
        cleanProfile(currentUser);

        if (!self.profile) {
          saved = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return clmDataStore.initProfile();
          });
        } else {
          saved = currentUser.$save().then(function() {
            return clmDataStore.updateProfile(currentUser);
          });
        }

        return saved.then(function() {
          spfAlert.success('Profile setup.');
          return $route.reload();
        }).catch(function(err) {
          spfAlert.error('Failed to ');
          return $q.reject(err);
        }).finally(function() {
          self.settingPublicId = false;
        });
      };

      this.lookUp = {
        codeSchool: {
          id: undefined,

          save: function() {
            return clmDataStore.services.codeSchool.saveDetails(self.profile.$id, {
              id: self.lookUp.codeSchool.id,
              name: self.lookUp.codeSchool.id
            }).then(function() {
              spfAlert.success('Code School user name saved.');
              return clmDataStore.currentUserProfile();
            }).catch(function(err) {
              spfAlert.error('Failed to save Code School user name.');
              return $q.reject(err);
            }).then(function(profile) {
              self.profile = profile;
              return clmDataStore.services.codeSchool.updateProfile(profile);
            });
          }
        },

        codeCombat: {
          find: function() {
            clmDataStore.services.codeCombat.requestUserName();
          },

          save: function() {
            return $q.reject(new Error('Not implemented'));
          }
        }
      };
    }
  ]).

  /**
   * Use to resolve `initialData` of `SetCodeCombatUserIdCtrl`.
   *
   */
  factory('setCodeCombatUserIdCtrlInitialData', [
    '$q',
    '$location',
    'routes',
    'spfAlert',
    'clmDataStore',
    function setCodeCombatUserIdCtrlInitialDataFactory($q, $location, routes, spfAlert, clmDataStore) {
      return function setCodeCombatUserIdCtrlInitialData() {
        var search = $location.search();
        var verificationKey = search.id;
        var username = search.username;

        return clmDataStore.services.codeCombat.setUser(username, verificationKey).then(function() {
          spfAlert.success('Your Code School user name and id have been saved.');
          return clmDataStore.currentUserProfile();
        }, function(err) {
          spfAlert.error('Failed to set user name and id');
          return $q.reject(err);
        }).then(function(profile) {
          clmDataStore.services.codeCombat.updateProfile(profile);
        }).then(function() {
          $location.path(routes.editProfile);
        }).catch(function(err) {
          return {
            err: err
          };
        });
      };
    }
  ]).

  /**
   * SetCodeCombatUserIdCtrl
   *
   */
  controller('SetCodeCombatUserIdCtrl', [
    'initialData',
    function SetCodeCombatUserIdCtrl() {}
  ]).

  directive('clmProfile', [

    function clmProfileFactory() {
      return {
        templateUrl: 'classmentors/components/profiles/profiles-view-clm-profile.html',
        restrict: 'A',
        scope: {
          serviceId: '@clmServiceId',
          profile: '=clmProfile',
          currentUser: '=clmCurrentUser'
        },
        controller: [
          '$scope',
          'spfAuthData',
          'clmDataStore',
          function ClmProfileCtrl($scope, spfAuthData, clmDataStore) {
            this.services = {
              codeCombat: {
                name: 'Code Combat',
                url: 'http://codecombat.com/'
              },

              codeSchool: {
                name: 'Code School',
                url: 'https://www.codeschool.com/'
              },

              treehouse: {
                name: 'Treehouse',
                url: 'http://www.teamtreehouse.com/signup_code/singapore'
              }
            };

            this.canUpdate = function() {
              if (
                $scope.profile &&
                $scope.currentUser &&
                $scope.profile.$id === $scope.currentUser.$id
              ) {
                return true;
              }

              return (
                $scope.currentUser &&
                $scope.currentUser.user &&
                $scope.currentUser.user.isAdmin
              );
            };

            this.update = function() {
              return clmDataStore.services[$scope.serviceId].updateProfile(
                $scope.profile
              );
            };
          }
        ],
        controllerAs: 'ctrl',
        // arguments: scope, iElement, iAttrs, controller
        link: function clmProfilePostLink() {}
      };
    }
  ]).

  /**
   * Controller for clmSpfProfile
   *
   * Expect publicId to be bound to ctrl using directive's `bindToController`
   * property.
   *
   */
  controller('ClmSpfProfileCtrl', [
    '$q',
    '$log',
    'clmDataStore',
    'clmServicesUrl',
    function ClmSpfProfileCtrl($q, $log, clmDataStore, clmServicesUrl) {
      var self = this;
      var lookUpPromise;

      this.loading = true;
      this.stats = {
        total: {},
        user: {}
      };
      this.singpathUrl = clmServicesUrl.singPath;

      // Count problems by language
      // and resolve to a map of problemPath -> problem.
      //
      // TODO: each solution record in the user profile should include
      // the problem language.
      lookUpPromise = clmDataStore.singPath.allProblems().then(function(paths) {
        return Object.keys(paths || {}).reduce(function(result, pathKey) {
          var levels = paths[pathKey] || {};

          Object.keys(levels).forEach(function(levelKey) {
            var problems = levels[levelKey] || {};

            Object.keys(problems).forEach(function(problemKey) {
              var path = [pathKey, levelKey, problemKey].join('/');
              var language = problems[problemKey].language;

              result.lookUp[path] = language;
              result.count[language] = (result.count[language] || 0) + 1;
            });
          });

          return result;
        }, {lookUp: {}, count: {}});
      }).then(function(languageStats) {
        self.stats.total = languageStats.count;
        return languageStats.lookUp;
      });

      // Count the number of problem the user solved
      // by language.
      $q.all({
        lookUp: lookUpPromise,
        profile: clmDataStore.singPath.profile(self.publicId)
      }).then(function(data) {
        var paths = data.profile.solutions || {};

        return Object.keys(paths).reduce(function(result, pathKey) {
          var levels = paths[pathKey] || {};

          Object.keys(levels).forEach(function(levelKey) {
            var problems = levels[levelKey] || {};

            Object.keys(problems).forEach(function(problemKey) {
              var path = [pathKey, levelKey, problemKey].join('/');
              var language = data.lookUp[path];

              if (problems[problemKey].solved) {
                result[language] = (result[language] || 0) + 1;
              }
            });
          });

          return result;
        }, {});
      }).then(function(languageStats) {
        self.stats.user = languageStats;
        return languageStats;
      }).catch(function(err) {
        $log.error(err);
      }).finally(function() {
        self.loading = false;
      });
    }
  ]).

  directive('clmSpfProfile', [

    function() {
      return {
        templateUrl: 'classmentors/components/profiles/profiles-view-spf-profile.html',
        restrict: 'A',
        scope: {
          publicId: '=clmSpfProfile'
        },
        bindToController: true,
        controller: 'ClmSpfProfileCtrl',
        controllerAs: 'ctrl'
      };
    }
  ]).

  directive('clmServiceUserIdExists', [
    '$q',
    'clmDataStore',
    function clmServiceUserIdExistsFactory($q, clmDataStore) {
      return {
        restrict: 'A',
        scope: false,
        require: 'ngModel',
        // arguments: scope, iElement, iAttrs, controller
        link: function clmServiceUserIdExistsPostLink(s, e, iAttrs, model) {
          var serviceId = iAttrs.clmServiceUserIdExists;

          if (!serviceId || !clmDataStore.services[serviceId]) {
            return;
          }

          model.$asyncValidators.clmServiceUserIdExists = function(modelValue, viewValue) {
            if (!viewValue) {
              return $q.when(true);
            }
            return clmDataStore.services[serviceId].userIdExist(viewValue).then(function(exists) {
              if (!exists) {
                return $q.reject(new Error(viewValue + 'does not exist or is not public'));
              }
              return true;
            });
          };
        }
      };
    }
  ])

  ;

})();
