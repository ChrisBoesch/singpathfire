(function() {
  'use strict';

  angular.module('spf.shared').

  controller('SpfSignFormCtrl', [
    '$scope',
    'SPF_COUNTRIES',
    'SPF_SINGAPORE_SCHOOLS',
    function SpfSignFormCtrl($scope, SPF_COUNTRIES, SPF_SINGAPORE_SCHOOLS) {
      var year;

      this.publicIdIsReadOnly = Boolean($scope.currentUser.publicId);
      this.countries = SPF_COUNTRIES;
      this.schools = SPF_SINGAPORE_SCHOOLS;
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

      if ($scope.currentUser.school) {
        $scope.currentUser.school = this.schools.find(function(school) {
          return school.name === $scope.currentUser.school.name;
        });
      }
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
