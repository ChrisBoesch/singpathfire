(function() {
  'use strict';

  angular.module('spf').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.classMentor.events, {
        templateUrl: 'app/components/class-mentors/events/events-view.html',
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
    'spfDataStore',
    function classMentorsEventListRsolverFactory($q, $spfAuth, spfDataStore) {
      return function classMentorsEventRsolver() {
        return $q.all({
          events: spfDataStore.classMentor.events.list().$loaded(),
          auth: $spfAuth
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
    'initialData',
    'spfDataStore',
    'spfAlert',
    function ClassMentorsEventList($q, initialData, spfDataStore, spfAlert) {
      var self = this;

      this.events = initialData.events;
      this.auth = initialData.auth;

      self.creatingEvent = false;

      this.save = function(eventCollection, newEvent, password, eventForm) {
        self.creatingEvent = false;
        spfDataStore.auth.user().then(function(userData) {
          var data = Object.assign({
            ownerId: self.auth.user.uid,
            ownerName: userData.nickName,
            createdAt: {
              '.sv': 'timestamp'
            }
          }, newEvent);

          return spfDataStore.classMentor.events.create(eventCollection, data, password);
        }).then(function() {
          spfAlert.success('New event created.');
          self.reset(eventForm);
        }).catch(function(e) {
          spfAlert(e.toString());
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
