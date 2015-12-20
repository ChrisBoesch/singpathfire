(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.setProfileCodeCombatId, {
        templateUrl: 'classmentors/components/profiles/profiles-view-codecombat-lookup-error.html',
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
          spfAlert.success('Your Code Combat user name and id have been saved.');
          return clmDataStore.currentUserProfile();
        }).then(function(profile) {
          clmDataStore.services.codeCombat.updateProfile(profile);
        }).then(function() {
          $location.path(routes.editProfile);
        }).catch(function(err) {
          return {
            err: err,
            userName: username
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
    'spfNavBarService',
    function SetCodeCombatUserIdCtrl(initialData, spfNavBarService) {
      this.err = initialData.err;
      this.userName = initialData.userName;

      spfNavBarService.update('Code Combat User Name');
    }
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
          '$log',
          'spfAuthData',
          'spfAlert',
          'clmDataStore',
          function ClmProfileCtrl($scope, $log, spfAuthData, spfAlert, clmDataStore) {
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

            this.canRemove = function() {
              return (
                $scope.profile &&
                $scope.currentUser &&
                $scope.profile.$id === $scope.currentUser.$id
              );
            };

            this.update = function() {
              return clmDataStore.services[$scope.serviceId].updateProfile(
                $scope.profile
              );
            };

            this.remove = function(serviceId, details) {
              if (
                !$scope.profile ||
                !details
              ) {
                return;
              }

              clmDataStore.services[serviceId].removeDetails($scope.profile.$id, details.id).catch(function(err) {
                $log.error(err);
                spfAlert.error('Failed to delete service data.');
              });
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

      this.loading = true;
      this.stats = {
        total: {},
        user: {}
      };
      this.singpathUrl = clmServicesUrl.singPath;

      // Count problems by language
      var total = clmDataStore.singPath.allProblems().then(function(paths) {
        return clmDataStore.singPath.countProblems(paths);
      });

      // Count solved problem by language
      var user = clmDataStore.singPath.profile(self.publicId).then(function(profile) {
        return clmDataStore.singPath.countSolvedSolutionPerLanguage(profile);
      });

      $q.all({total: total, user: user}).then(function(stats) {
        self.stats = stats;
        return stats;
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
