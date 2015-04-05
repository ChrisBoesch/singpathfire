(function() {
  'use strict';

  angular.module('spf.shared').

  /**
   * Service to show notification m.
   *
   * It takes as arguments the type of notification and the content
   * of the nofication.
   *
   * The type is used as title of the notification and is user to set
   * the class of the notication block: for type set `info`,
   * the block class will be set `alert` and `alert-info` (always lowercase).
   *
   * `spfAlert.success`, `spfAlert.info`, `spfAlert.warning`, `spfAlert.error`
   * and `spfAlert.danger` are shortcut for the spfAlert function.
   *
   */
  factory('spfAlert', [
    '$q',
    '$mdToast',
    function spfAlertFactory($q, $mdToast) {
      var notifications = [];
      var options = {
        hideDelay: 5000,
        controller: 'SpfAlertCtrl',
        controllerAs: 'ctrl',
        parent: '.main-view',
        position: 'top left right',
        templateUrl: 'shared/components/alert/alert-view-toaster.html',
        locals: {
          notifications: notifications
        }
      };
      options.locals.toastOptions = options;

      function newNotification(nType, message) {
        return {
          notificationType: nType || 'success',
          message: message
        };
      }

      var spfAlert = function(nType, message) {
        notifications.splice(0, 0, newNotification(nType, message));
        $mdToast.show(options);
      };

      spfAlert.success = spfAlert.bind(null, 'success');
      spfAlert.info = spfAlert.bind(null, 'info');
      spfAlert.warning = spfAlert.bind(null, 'warning');
      spfAlert.danger = spfAlert.bind(null, 'danger');
      spfAlert.error = spfAlert.bind(null, 'error');

      return spfAlert;
    }
  ]).

  controller('SpfAlertCtrl', [
    '$mdToast',
    'notifications',
    'toastOptions',
    function SpfAlertCtrl($mdToast, notifications, toastOptions) {
      var self = this;

      this.notifications = notifications;

      this.prev = function() {
        if (self.notifications && self.notifications.length > 0) {
          self.notifications.splice(0, 1);
          $mdToast.show(toastOptions);
        }
      };

      this.close = function() {
        if (self.notifications && self.notifications.length > 0) {
          self.notifications.splice(0);
          $mdToast.hide();
        }
      };
    }
  ])

  ;

})();
