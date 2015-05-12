(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

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
          currentUser: spfAuthData.user(),
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
    'spfFirebase',
    'spfAuthData',
    'spfNavBarService',
    'initialData',
    'clmDataStore',
    'spfAlert',
    function ClmProfileCtrl(
      $q, spfFirebase, spfAuthData, spfNavBarService, initialData, clmDataStore, spfAlert
    ) {
      var self = this;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.currentUserProfile = initialData.currentUserProfile;
      this.profile = initialData.profile;

      spfNavBarService.update('Profile');

      this.settingPublicId = false;
      this.profileNeedsUpdate = !this.currentUser.$completed();

      function cleanProfile() {
        self.currentUser.country = spfFirebase.cleanObj(self.currentUser.country);
        self.currentUser.school = spfFirebase.cleanObj(self.currentUser.school);
      }

      this.setPublicId = function(currentUser) {
        var saved;
        this.settingPublicId = true;

        if (!self.profile) {
          cleanProfile();
          saved = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return clmDataStore.initProfile();
          });
        } else if (self.profileNeedsUpdate) {
          cleanProfile();
          saved = self.currentUser.$save().then(function() {
            return clmDataStore.currentUserProfile();
          });
        } else {
          spfAlert.error('The profile does not need to be saved.');
          return $q.when(self.profile);
        }

        return saved.then(function(profile) {
          spfAlert.success('Profile setup.');
          self.profile = profile;
          self.profileNeedsUpdate = !self.currentUser.$completed();
        }).catch(function(e) {
          spfAlert.error(e.toString());
        }).finally(function() {
          self.settingPublicId = false;
        });
      };

      this.lookUp = {
        codeSchool: {
          id: undefined,

          save: function() {
            return clmDataStore.services.codeSchool.saveDetails(self.profile, {
              id: self.lookUp.codeSchool.id,
              name: self.lookUp.codeSchool.id
            }).then(function() {
              spfAlert.success('Code School user name saved.');
            }).catch(function(err) {
              spfAlert.error(err.toString());
            });
          }
        },

        codeCombat: {
          errors: {},
          id: undefined,
          name: undefined,

          find: function() {
            self.lookUp.codeCombat.errors.isLoggedToCodeCombat = undefined;
            self.lookUp.codeCombat.errors.hasACodeCombatName = undefined;

            clmDataStore.services.codeCombat.auth().then(function(details) {
              self.lookUp.codeCombat.id = details.id;
              self.lookUp.codeCombat.name = details.name;
            }).catch(function(err) {
              if (err === clmDataStore.services.codeCombat.errLoggedOff) {
                self.lookUp.codeCombat.errors.isLoggedToCodeCombat = true;
              } else if (err === clmDataStore.services.codeCombat.errNoName) {
                self.lookUp.codeCombat.errors.hasACodeCombatName = true;
              } else {
                spfAlert.error(err.toString());
              }
            });
          },

          save: function() {
            return clmDataStore.services.codeCombat.saveDetails(self.profile, {
              id: self.lookUp.codeCombat.id,
              name: self.lookUp.codeCombat.name
            }).then(function() {
              spfAlert.success('Code Combat user name saved.');
            }).catch(function(err) {
              spfAlert.error(err.toString());
            });
          },

          reset: function() {
            self.lookUp.codeCombat.id = undefined;
            self.lookUp.codeCombat.name = undefined;
          }
        }
      };
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
