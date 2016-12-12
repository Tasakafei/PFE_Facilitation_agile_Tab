'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopListCtrl', function($scope, WorkshopsProvider, $stateParams, $timeout, ionicMaterialInk, ionicMaterialMotion) {
    $scope.workshops = {};

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
    WorkshopsProvider.getWorkshops(function (workshopsResult) {
        $scope.workshops = workshopsResult;
        //$scope.workshopsGrouped = groupWorkshops(workshopsResult);
        $scope.workshopSlice1 = workshopsResult.data.slice(0, workshopsResult.data.length/2);
        $scope.workshopSlice2 = workshopsResult.data.slice(workshopsResult.data.length/2, workshopsResult.data.length);
    });

    function groupWorkshops(workshopsResult) {
        var result = [];
        for(var i = 0 ; i < workshopsResult.data.length; i+=2){
            var item = [];
            item.push(workshopsResult.data[i]);
            if(i+1 < workshopsResult.data.length){
                item.push(workshopsResult.data[i+1]);
            }
            result.push(item);
        }
        return result;
    }
});