 (function() {
  'use strict';

  angular.module('spf.shared').

  /**
   * Controler for the header novigation bar.
   *
   * Set an auth property bound to spfAuth. Its user property can used
   * to display the state of the authentication and the user display name
   * when the user is logged in.
   *
   * The ctrl set a login and logout property to autenticate/unauthenticate
   * the current user.
   *
   */
  controller('SpfSharedNavBarCtrl', [
    '$q',
    '$aside',
    'spfAlert',
    'spfAuth',
    function SpfSharedNavBarCtrl($q, $aside, spfAlert, spfAuth) {
      this.auth = spfAuth;

      this.login = function() {
        return spfAuth.login().catch(function(e) {
          spfAlert.warning('You failed to authenticate with Google');
          return $q.reject(e);
        });
      };

      this.logout = function() {
        return spfAuth.logout();
      };

      this.openSideMenu = function(conf) {
        var aside = $aside({
          contentTemplate: conf.contentTemplate,
          title: 'Menu',
          animation: 'am-fade-and-slide-left',
          placement: 'left',
          container: 'body'
        });
        aside.$promise.then(function() {
          aside.show();
        });
      };

    }
  ])

  ;


angular.module('spf.shared.material').

  /**
   * NavBarService
   *
   * Registery to set section name and menu items
   */
  factory('SpfNavBarService', [
    function SpfNavBarServiceFactory() {
      return {
        title: 'Singpath',
        section: undefined,
        parent: undefined,
        menuItems: [],

        update: function(section, parent, menuItems) {
          this.section = section;
          this.parent = parent;
          this.menuItems = menuItems || [];
        }
      };
    }
  ]).

  /**
   * Controler for the header novigation bar.
   *
   * Set an auth property bound to spfAuth. Its user property can used
   * to display the state of the authentication and the user display name
   * when the user is logged in.
   *
   * The ctrl set a login and logout property to autenticate/unauthenticate
   * the current user.
   *
   */
  controller('SpfSharedMaterialNavBarCtrl', [
    '$q',
    '$mdSidenav',
    'spfAlert',
    'spfAuth',
    'SpfNavBarService',
    function SpfSharedMaterialNavBarCtrl($q, $mdSidenav, spfAlert, spfAuth, SpfNavBarService) {
      this.auth = spfAuth;
      this.currentPage = SpfNavBarService;

      this.login = function() {
        return spfAuth.login().catch(function(e) {
          spfAlert.warning('You failed to authenticate with Google');
          return $q.reject(e);
        });
      };

      this.logout = function() {
        return spfAuth.logout();
      };

      this.openSideMenu = function(name) {
        $mdSidenav(name).toggle();
      };
    }
  ])

  ;

})();
