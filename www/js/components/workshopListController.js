'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopListCtrl', function($scope, WorkshopsProvider, $stateParams, $timeout, ionicMaterialInk, ionicMaterialMotion) {
    $scope.workshops = {};

    console.log(JSON.stringify($scope.currentUser));

    //$scope.$parent.showHeader();
    //$scope.$parent.clearFabs();
    $scope.isExpanded = true;
    //$scope.$parent.setExpanded(true);
    //$scope.$parent.setHeaderFab(false);

    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    ionicMaterialMotion.pushDown({
        selector: '.push-down'
    });
    ionicMaterialMotion.fadeSlideInRight({
        selector: '.animate-fade-slide-in .item'
    });
    WorkshopsProvider.getEventsByDay($stateParams.dayNumber,function (dayEvents) {
        $scope.workshops = dayEvents;
    });
});