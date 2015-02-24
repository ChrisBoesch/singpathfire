(function() {
  'use strict';

  angular.module('spf').

  directive('spfEditor', [
    '$window',
    '$log',
    function($window, $log) {
      var editorIds = 1;

      if (angular.isUndefined($window.ace)) {
        throw new Error('ace editor is not loaded.');
      }

      var languageToMode = {
        'angularjs': 'html',
        'python': 'python'
      };

      return {
        restrict: 'A',
        require: 'ngModel',
        link: function spfAceLink(scope, elm, attrs, ngModel) {
          var editorId = 'spf-editor-' + editorIds++;
          var editor;
          var session;
          var render = ngModel.$render || angular.noop;
          var container = elm.parent();
          var label = container.find('label');
          var watchers = [];

          // Setup DOM
          elm.after('<div class="spf-ace-editor" id="' + editorId + '"/>');
          editor = $window.ace.edit(elm.next()[0]);
          session = editor.getSession();
          elm.css('display', 'none');


          // Link editor and model
          ngModel.$formatters.push(function(value) {
            if (angular.isUndefined(value) || value === null) {
              return '';
            } else if (angular.isObject(value) || angular.isArray(value)) {
              throw new Error('ui-ace cannot use an object or an array as a model');
            }
            return value;
          });

          ngModel.$render = function() {
            render();
            session.setValue(ngModel.$viewValue);
          };

          session.on('change', function() {
            ngModel.$setViewValue(session.getValue(), 'change');
            render();
          });

          editor.on('focus', function() {
            container.addClass('has-focus');
          });

          editor.on('blur', function() {
            ngModel.$setViewValue(session.getValue(), 'blur');
            render();
            container.removeClass('has-focus');
            container.addClass('had-focus');
          });

          // Make label behave like a label
          label.on('click', clickHandler);

          function clickHandler () {
            editor.focus();
          }


          // Observed attributes
          watchers.push(attrs.$observe('spfEditor', function(value) {
            var mode;

            if (!value) {
              return;
            }

            mode = languageToMode[value];
            if (!mode) {
              $log.error('No mode for ' + value);
              return;
            }

            session.setMode('ace/mode/' + mode);
          }));

          // Other options
          editor.setTheme('ace/theme/twilight');
          editor.renderer.setShowGutter(true);
          editor.renderer.setShowInvisibles(true);
          session.setUseWrapMode(true);
          session.setUseSoftTabs(true);

          // Watch for resize
          watchers.push(scope.$watch(function() {
            return [elm[0].offsetWidth, elm[0].offsetHeight];
          }, function() {
            editor.resize();
            editor.renderer.updateFull();
          }, true));

          // Decorate container with input state
          ['pristine', 'valid', 'invalid'].map(function(state) {
            var attrName = '$' + state;
            var className = 'is-' + state;

            watchers.push(scope.$watch(function() {
              return ngModel[attrName];
            }, function() {
              if (ngModel[attrName]) {
                container.addClass(className);
              } else {
                container.removeClass(className);
              }
            }));
          });

          watchers.push(scope.$watch(function() {
            return ngModel.$viewValue;
          }, function() {
            if (ngModel.$viewValue.length === 0) {
              container.addClass('is-empty');
            } else {
              container.removeClass('is-empty');
            }
          }));

          // clean up
          elm.on('$destroy', function() {
            editor.session.$stopWorker();
            editor.destroy();
            watchers.map(function(deregistrationFn) {
              deregistrationFn();
            });
            label.off('click', clickHandler);
          });

        }
      };
    }
  ]);

})();
