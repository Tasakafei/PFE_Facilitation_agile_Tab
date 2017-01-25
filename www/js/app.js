// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('facilitation',
    [
      'ionic',
      'ionic-material',
      'socketio.service',
      'angular-svg-round-progress',
      'ngCookies',
      'ngResource',
      'ngSanitize',
      'http-auth-interceptor',
    ])

.run(function($ionicPlatform, socket, $rootScope, $location, Auth) {
  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });

    //watching the value of the currentUser variable.
    $rootScope.$watch('currentUser', function(currentUser) {
        // if no currentUser and on a page that requires authorization then try to update it
        // will trigger 401s if user does not have a valid session
        if (!currentUser && (['/'].indexOf($location.path()) == -1 )) {
            Auth.currentUser();
        }
    });

    // On catching 401 errors, redirect to the login page.
    $rootScope.$on('event:auth-loginRequired', function() {
        $location.path('/');
        return false;
    });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  .state('tab.login', {
      url: '/login',
      views: {
          'tab-workshop': {
              templateUrl: 'templates/login.html',
              controller: 'LoginCtrl'
          }
      }
  })

  .state('tab.workshopList', {
    url: '/workshops',
    views: {
      'tab-workshop': {
        templateUrl: 'templates/workshopList.html',
        controller: 'WorkshopListCtrl'
      }
    }
  })

  .state('tab.workshop', {
    url: '/workshops/:workshopId',
    views: {
      'tab-workshop': {
        templateUrl: 'templates/workshop.html',
        controller: 'WorkshopCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/login');

});
