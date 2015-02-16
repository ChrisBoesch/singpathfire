(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.events, {
        templateUrl: 'classmentors/components/events/events-view.html',
        controller: 'ClassMentorsEventList',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'classMentorsEventListRsolver',
            function(classMentorsEventListRsolver) {
              return classMentorsEventListRsolver();
            }
          ]
        }
      });
    }
  ]).

  /**
   * Use to resolve `initialData` of `SomeCtrl`.
   *
   */
  factory('classMentorsEventListRsolver', [
    '$q',
    'spfAuth',
    'clmDataStore',
    function classMentorsEventListRsolverFactory($q, spfAuth, clmDataStore) {
      return function classMentorsEventRsolver() {
        return $q.all({
          events: clmDataStore.events.list().$loaded(),
          auth: spfAuth
        });
      };
    }
  ]).

  /**
   * SomeCtrl
   *
   */
  controller('ClassMentorsEventList', [
    '$q',
    'spfAuthData',
    'initialData',
    'clmDataStore',
    'spfAlert',
    function ClassMentorsEventList($q, spfAuthData, initialData, clmDataStore, spfAlert) {
      var self = this;

      this.events = initialData.events;
      this.auth = initialData.auth;

      self.creatingEvent = false;

      this.save = function(eventCollection, newEvent, password, eventForm) {
        self.creatingEvent = false;
        spfAuthData.user().then(function(userData) {
          var data = Object.assign({
            ownerId: self.auth.user.uid,
            ownerName: userData.displayName,
            createdAt: {
              '.sv': 'timestamp'
            }
          }, newEvent);

          return clmDataStore.events.create(eventCollection, data, password);
        }).then(function() {
          spfAlert.success('New event created.');
          self.reset(eventForm);
        }).catch(function(e) {
          spfAlert.error(e.toString());
        }).finally(function() {
          self.creatingEvent = false;
        });
      };

      this.reset = function(eventForm) {
        this.newEvent = {
          data: {},
          password: ''
        };

        if (eventForm && eventForm.$setPristine) {
          eventForm.$setPristine();
        }
      };

      this.reset();
    }
  ])

  ;

})();
