(function() {
  'use strict';

  angular.module('oep').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.

      when(routes.editProfile, {
        templateUrl: 'badgetracker/components/profiles/profiles-view-edit.html',
        controller: 'OepProfileCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'oepEditProfileInitialDataResolver',
            function(oepEditProfileInitialDataResolver) {
              return oepEditProfileInitialDataResolver();
            }
          ]
        }
      }).

      when(routes.profile, {
        templateUrl: 'badgetracker/components/profiles/profiles-view-show.html',
        controller: 'OepProfileCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'oepShowProfileInitialDataResolver',
            function(oepShowProfileInitialDataResolver) {
              return oepShowProfileInitialDataResolver();
            }
          ]
        }
      })

      ;

    }
  ]).

  /**
   * Used to resolve `initialData` of `OepProfileCtrl` the logged in user profile.
   *
   */
  factory('oepEditProfileInitialDataResolver', [
    '$q',
    '$route',
    'routes',
    'spfAuth',
    'spfAuthData',
    'oepDataStore',
    function oepEditProfileInitialDataResolverFactory($q, $route, routes, spfAuth, spfAuthData, oepDataStore) {
      return function oepEditProfileInitialDataResolver() {
        var userPromise = spfAuthData.user();
        var profilePromise;
        var errLoggedOff = new Error('The user should be logged in to edit her/his profile.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        // ... And the profile might not exist yet. We need to let the view
        // load in that case and let the user pick a public id and initiate
        // the profile.
        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return;
          }

          return oepDataStore.profile(userData.publicId).then(function(profile) {
            if (profile && profile.$value === null) {
              return oepDataStore.initProfile(userData);
            }

            return profile;
          });
        });

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * Used to resolve `initialData` of `OepProfileCtrl` for a public profile.
   *
   */
  factory('oepShowProfileInitialDataResolver', [
    '$q',
    '$route',
    'routes',
    'spfAuth',
    'spfAuthData',
    'oepDataStore',
    function oepShowProfileInitialDataResolverFactory($q, $route, routes, spfAuth, spfAuthData, oepDataStore) {
      return function oepShowProfileInitialDataResolver() {
        var publicId = $route.current.params.publicId;
        var userPromise = spfAuthData.user();
        var profilePromise;
        var errNoPublicId = new Error('Unexpected error: the public id is missing');
        var errNoProfile = new Error('Could not found the profile for ' + publicId);

        if (!publicId) {
          return $q.reject(errNoPublicId);
        }

        profilePromise = oepDataStore.profile(publicId).then(function(profile) {
          if (profile.$value === null) {
            return $q.reject(errNoProfile);
          }
          return profile;
        });

        return $q.all({
          auth: spfAuth,
          currentUser: userPromise,
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * OepProfileCtrl
   *
   */
  controller('OepProfileCtrl', [
    'spfAuthData',
    'initialData',
    'oepDataStore',
    'spfAlert',
    function OepProfileCtrl(spfAuthData, initialData, oepDataStore, spfAlert) {
      var self = this;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;

      this.settingPublicId = false;

      this.setPublicId = function(currentUser) {
        this.settingPublicId = true;
        spfAuthData.publicId(currentUser).then(function() {
          spfAlert.success('Public id set.');
          return oepDataStore.profileInit(currentUser);
        }).then(function(profile) {
          spfAlert.success('Profile setup.');
          self.profile = profile;
          return profile;
        }).catch(function(e) {
          spfAlert.error(e.toString());
        }).finally(function() {
          self.settingPublicId = false;
        });
      };

      this.lookUp = {
        codeCombat: {
          errors: {},
          id: undefined,
          name: undefined,

          find: function() {
            self.lookUp.codeCombat.errors.isLoggedToCodeCombat = undefined;
            self.lookUp.codeCombat.errors.hasACodeCombatName = undefined;

            oepDataStore.services.codeCombat.currentUser().then(function(details) {
              self.lookUp.codeCombat.id = details.id;
              self.lookUp.codeCombat.name = details.name;
            }).catch(function(err) {
              if (err === oepDataStore.services.codeCombat.errLoggedOff) {
                self.lookUp.codeCombat.errors.isLoggedToCodeCombat = true;
              } else if (err === oepDataStore.services.codeCombat.errNoName) {
                self.lookUp.codeCombat.errors.hasACodeCombatName = true;
              } else {
                spfAlert.error(err.toString());
              }
            });
          },

          save: function() {
            return oepDataStore.services.codeCombat.saveDetails(self.currentUser, {
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

  directive('oepProfile', [

    function oepProfileFactory() {
      return {
        templateUrl: 'badgetracker/components/profiles/profiles-view-oep-profile.html',
        restrict: 'A',
        scope: {
          serviceId: '@oepServiceId',
          profile: '=oepProfile'
        },
        controller: [
          function OepProfileCtrl() {
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
          }
        ],
        controllerAs: 'ctrl',
        // arguments: scope, iElement, iAttrs, controller
        link: function oepProfilePostLink() {}
      };
    }
  ])

  ;

})();
