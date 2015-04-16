/**
 * Defines the SingPath Fire angular app and its main services and controllers.
 *
 * If was to become too big, only config and contants should be kept here;
 * controllers could be sent off to a main/main-controllers.js and services
 * to mani/main-services.js.
 *
 */
(function() {
  'use strict';

  angular.module('clm', [
    'angular-loading-bar',
    'firebase',
    'ngAnimate',
    'ngMessages',
    'ngRoute',
    'spf.shared'
  ]).

  /**
   * Label paths - to be used by each component to configure their route.
   *
   * See src/app/components/events for example.
   *
   */
  constant('routes', {
    home: '/events',
    events: '/events',
    newEvent: '/new-event',
    oneEvent: '/events/:eventId',
    editEvent: '/events/:eventId/edit',
    editEventTask: '/events/:eventId/task/:taskId',
    addEventTask: '/events/:eventId/new-task',
    profile: '/profile/:publicId',
    editProfile: '/profile/'
  }).

  /**
   * Configure routes default route and cfpLoadingBar options.
   *
   */
  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.otherwise({
        redirectTo: routes.home
      });
    }
  ]).

  /**
   * Service to interact with singpath firebase db
   *
   */
  factory('clmDataStore', [
    '$q',
    '$log',
    '$http',
    'spfFirebase',
    'spfAuth',
    'spfAuthData',
    'spfCrypto',
    function clmDataStoreFactory($q, $log, $http, spfFirebase, spfAuth, spfAuthData, spfCrypto) {
      var clmDataStore;

      clmDataStore = {
        _profileFactory: spfFirebase.objFactory({}),

        profile: function(publicId) {
          return $q.when(publicId).then(function(id) {
            return clmDataStore._profileFactory(['classMentors/userProfiles', id]).$loaded();
          });
        },

        initProfile: function(userSync) {
          if (!userSync || !userSync.publicId) {
            return $q.reject(new Error('The user has not set a user public id.'));
          }

          return spfFirebase.set(
            ['classMentors/userProfiles', userSync.publicId, 'user'], {
              displayName: userSync.displayName,
              gravatar: userSync.gravatar
            }
          ).then(function() {
            return clmDataStore.profile(userSync.publicId);
          });
        },

        events: {
          errNoPublicId: new Error('You should have a public id to join an event'),

          list: function() {
            return spfFirebase.loadedArray(['classMentors/events'], {
              orderByChild: 'timestamp',
              limitToLast: 50
            });
          },

          create: function(event, password) {
            var hash, eventId;

            return spfFirebase.push(['classMentors/events'], event).then(function(ref) {
              eventId = ref.key();
              hash = spfCrypto.password.newHash(password);
              var opts = {
                hash: hash.value,
                options: hash.options
              };
              return spfFirebase.set(['classMentors/eventPasswords/' + eventId], opts);
            }).then(function() {
              return eventId;
            });
          },

          get: function(eventId) {
            return spfFirebase.loadedObj(['classMentors/events', eventId]);
          },

          addTask: function(eventId, task) {
            var priority = task.priority || 0;

            return spfFirebase.push(['classMentors/events', eventId, 'tasks'], task).then(function(ref) {
              ref.setPriority(priority);
              return ref;
            });
          },

          updateTask: function(eventId, taskId, task) {
            var priority = task.priority || 0;

            return spfFirebase.set(['classMentors/events', eventId, 'tasks', taskId], task).then(function(ref) {
              ref.setPriority(priority);
              return ref;
            });
          },

          participants: function(eventId) {
            return spfFirebase.loadedArray(['classMentors/eventParticipants', eventId]);
          },

          join: function(eventId, pw) {
            var paths, authData;

            return spfAuthData.user().then(function(_authData) {
              authData = _authData;

              if (!authData.publicId) {
                return $q.reject(clmDataStore.events.errNoPublicId);
              }

              paths = {
                hashOptions: ['classMentors/eventPasswords', eventId, 'options'],
                application: ['classMentors/eventApplications', eventId, spfAuth.user.uid],
                participation: ['classMentors/eventParticipants', eventId, authData.publicId, 'user'],
                profile: ['classMentors/userProfiles', authData.publicId, 'events', eventId]
              };
            }).then(function() {
              return spfFirebase.loadedObj(paths.hashOptions);
            }).then(function(options) {
              var hash = spfCrypto.password.fromSalt(pw, options.salt, options);
              return spfFirebase.set(paths.application, hash);
            }).then(function() {
              return spfFirebase.set(paths.participation, {
                displayName: authData.displayName,
                gravatar: authData.gravatar
              });
            }).then(function() {
              return spfFirebase.set(paths.profile, true);
            });
          },

          leave: function(eventId) {
            return spfAuthData.user().then(function(authData) {
              return spfFirebase.remove([
                'classMentors/userProfiles',
                authData.publicId,
                'events',
                eventId
              ]).then(function() {
                return authData;
              });
            }).then(function(authData) {
              return spfFirebase.remove([
                'classMentors/eventParticipants',
                eventId,
                authData.publicId
              ]);
            });
          },

          updateProgress: function(event) {
            spfAuthData.user().then(function(currentUser) {
              if (!currentUser.publicId) {
                return $q.reject(new Error('You should have a public id'));
              }

              return clmDataStore.profile(currentUser.publicId);
            }).then(function(profile) {
              var progress = Object.keys(event.tasks).reduce(function(results, taskId) {
                var task = event.tasks[taskId];
                var serviceId = task.serviceId;

                if (
                  !profile.services ||
                  !profile.services[serviceId] ||
                  !profile.services[serviceId].details ||
                  !profile.services[serviceId].details.id
                ) {
                  return results;
                }

                if (
                  task.badge &&
                  task.badge.id &&
                  (
                    !profile.services[serviceId].badges ||
                    !profile.services[serviceId].badges[task.badge.id]
                  )
                ) {
                  return results;
                }

                results[taskId] = {completed: true};
                return results;
              }, {});

              return spfFirebase.set(
                ['classMentors/eventParticipants', event.$id, profile.$id, 'tasks'],
                progress
              );
            }).catch(function(err) {
              $log.error(err);
            });
          }
        },

        services: {
          errNoPublicId: new Error('The user has not set a user public id.'),

          saveDetails: function(serviceId, userSync, details) {
            if (!userSync || !userSync.publicId) {
              return $q.reject(clmDataStore.services.errNoPublicId);
            }

            return spfFirebase.set(
              ['classMentors/servicesUserIds', serviceId, details.id],
              userSync.publicId
            ).then(function() {
              return spfFirebase.set(
                ['classMentors/userProfiles', userSync.publicId, 'services', serviceId, 'details'], {
                  id: details.id,
                  name: details.name,
                  registeredBefore: {
                    '.sv': 'timestamp'
                  }
                }
              );
            }).then(function(profile) {
              var url = '/api/badges/track/' + userSync.publicId + '/' + serviceId.toLowerCase();
              return $http.post(url).then(function() {
                return profile;
              });
            }).catch(function(err) {
              $log.error(err);
              return $q.reject(new Error('Failed to save user details for ' + serviceId));
            });
          },

          userIdTaken: function(serviceId, userId) {
            return spfFirebase.loadedObj(['classMentors/servicesUserIds', serviceId, userId]).then(function(sync) {
              return sync.$value !== null;
            });
          },

          codeCombat: {
            errServerError: new Error('Failed to get logged in user info from Code Combat.'),
            errLoggedOff: new Error('The user is not logged in to Code Combat.'),
            errNoName: new Error('The user hasn\'t set a name.'),

            currentUser: function() {
              return $http.jsonp('//codecombat.com/auth/whoami?callback=JSON_CALLBACK').then(function(resp) {
                if (resp.data.anonymous) {
                  return $q.reject(clmDataStore.services.codeCombat.errLoggedOff);
                }

                if (!resp.data.name) {
                  return $q.reject(clmDataStore.services.codeCombat.errNoName);
                }

                return {
                  id: resp.data._id,
                  name: resp.data.name,
                  points: resp.data.point,
                  levels: resp.data.earned.levels
                };
              }, function(e) {
                $log.error('Failed request to //codecombat.com/auth/whoami: ' + e.toString());
                return $q.reject(clmDataStore.services.codeCombat.errServerError);
              });
            },

            saveDetails: function(userSync, details) {
              return clmDataStore.services.saveDetails('codeCombat', userSync, details);
            },

            userIdTaken: function(userId) {
              return clmDataStore.services.userIdTaken('codeCombat', userId);
            }

          },

          codeSchool: {
            saveDetails: function(userSync, details) {
              return clmDataStore.services.saveDetails('codeSchool', userSync, details);
            },

            userIdTaken: function(userId) {
              return clmDataStore.services.userIdTaken('codeSchool', userId);
            },

            userIdExist: function(userId) {
              if (!userId) {
                return $q.when(false);
              }

              return $http.get('/api/services/codeschool/users/' + userId).then(function() {
                return true;
              }).catch(function() {
                return false;
              });
            }
          }
        }
      };

      return clmDataStore;
    }
  ])

  ;

})();
