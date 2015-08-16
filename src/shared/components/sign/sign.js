(function() {
  'use strict';

  angular.module('spf.shared').

  controller('SpfSignFormCtrl', [
    '$scope',
    'SPF_COUNTRIES',
    'spfSchools',
    function SpfSignFormCtrl($scope, SPF_COUNTRIES, spfSchools) {
      var self = this;
      var year;

      spfSchools().then(function(schools) {

        self.schools = Object.keys(schools).map(function(id) {
          return schools[id];
        });

        // Make sure the items in the profile attribute are in the list
        // of options; or ng-select will show empty select box
        if ($scope.currentUser.school) {
          $scope.currentUser.school = schools[$scope.currentUser.school.id];
        }

        self.loaded = true;
      });

      this.loaded = false;
      this.publicIdIsReadOnly = Boolean($scope.currentUser.publicId);
      this.countries = SPF_COUNTRIES;
      this.schools = [];
      this.ageGroups = [];

      year = 1990;
      while (year <= 2011) {
        this.ageGroups.push(year++);
      }

      // Make sure the items in the profile attribute are in the list
      // of options; or ng-select will show empty select box
      if ($scope.currentUser.country) {
        $scope.currentUser.country = this.countries.find(function(country) {
          return country.code === $scope.currentUser.country.code;
        });
      }

      // Current year used to calculate age
      $scope.currentYear = new Date().getFullYear();
    }
  ]).

  directive('spfSignForm', [

    function spfSignFormFactory() {
      return {
        templateUrl: 'shared/components/sign/sign-view.html',
        restrict: 'E',
        scope: {
          currentUser: '='
        },
        controller: 'SpfSignFormCtrl',
        controllerAs: 'ctrl'
      };
    }
  ]).

  directive('spfUniqPublicId', [
    '$q',
    'spfAuthData',
    function spfUniqPublicIdFactory($q, spfAuthData) {
      return {
        restrict: 'A',
        scope: false,
        require: 'ngModel',
        link: function spfUniqPublicIdPostLink(s, e, a, model) {
          model.$asyncValidators.spfUniqPublicId = function(modelValue, viewValue) {
            if (!viewValue) {
              return $q.when(true);
            }
            return spfAuthData.isPublicIdAvailable(viewValue).then(function(available) {
              if (!available) {
                return $q.reject(new Error(viewValue + ' is already taken.'));
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
