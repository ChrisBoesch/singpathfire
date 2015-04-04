(function() {
  'use strict';

  angular.module('clm').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.events, {
        templateUrl: 'classmentors/components/events/events-view-list.html',
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
      }).

      when(routes.newEvent, {
        templateUrl: 'classmentors/components/events/events-view-new.html',
        controller: 'NewEventCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'newEventCtrlInitialData',
            function(newEventCtrlInitialData) {
              return newEventCtrlInitialData();
            }
          ]
        }
      })

      ;
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
    'initialData',
    'spfNavBarService',
    'urlFor',
    function ClassMentorsEventList(initialData, spfNavBarService, urlFor) {
      this.events = initialData.events;
      this.auth = initialData.auth;

      spfNavBarService.update(
        'Events',
        undefined, [{
          title: 'New event',
          url: '#' + urlFor('newEvent'),
          icon: 'add-circle-outline'
        }]
      );
    }
  ]).

  /**
   * Use to resolve `initialData` of `NewEventCtrl`.
   *
   */
  factory('newEventCtrlInitialData', [
    '$q',
    'spfAuth',
    'spfAuthData',
    'clmDataStore',
    function newEventCtrlInitialDataFactory($q, spfAuth, spfAuthData, clmDataStore) {
      return function newEventCtrlInitialData() {
        var userPromise = spfAuthData.user();
        var profilePromise;
        var errLoggedOff = new Error('The user should be logged in to create an event.');

        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(errLoggedOff);
        }

        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return;
          }

          return clmDataStore.profile(userData.publicId).then(function(profile) {
            if (profile && profile.$value === null) {
              return clmDataStore.initProfile(userData);
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
   * NewEventCtrl
   *
   */
  controller('NewEventCtrl', [
    '$q',
    '$location',
    'initialData',
    'urlFor',
    'spfAuthData',
    'spfAlert',
    'spfNavBarService',
    'clmDataStore',
    function NewEventCtrl(
      $q, $location, initialData, urlFor, spfAuthData, spfAlert, spfNavBarService, clmDataStore
    ) {
      var self = this;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;

      this.creatingEvent = false;

      spfNavBarService.update(
        'New Events',
        {
          title: 'Events',
          url: '#' + urlFor('events')
        }, []
      );

      this.save = function(currentUser, newEvent, password) {
        var next;

        self.creatingEvent = true;

        if (!self.profile) {
          next = spfAuthData.publicId(currentUser).then(function() {
            spfAlert.success('Public id and display name saved');
            return clmDataStore.initProfile(currentUser);
          }).then(function(profile) {
            self.profile = profile;
            return profile;
          });
        } else {
          next = $q.when();
        }

        next.then(function() {
          var data = Object.assign({
            owner: {
              publicId: currentUser.publicId,
              displayName: currentUser.displayName,
              gravatar: currentUser.gravatar
            },
            createdAt: {
              '.sv': 'timestamp'
            }
          }, newEvent);

          return clmDataStore.events.create(data, password);
        }).then(function() {
          spfAlert.success('New event created.');
          $location.path(urlFor('events'));
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
