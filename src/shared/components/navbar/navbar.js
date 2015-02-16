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

})();
