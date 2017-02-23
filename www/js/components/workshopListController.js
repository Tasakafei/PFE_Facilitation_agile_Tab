'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopListCtrl', function($scope, WorkshopsProvider, $stateParams, $timeout, ionicMaterialInk, ionicMaterialMotion, $ionicPopup) {
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
        $scope.dayNumber = $stateParams.dayNumber;
        $scope.workshops = dayEvents;

        for (var i = 0; i < $scope.workshops.length; i++) {
            var d = new Date ($scope.workshops[i].begin_at),
                dformat =  [d.getHours().padLeft(), d.getMinutes().padLeft()].join(':') +' '+ [(d.getMonth()+1).padLeft(), d.getDate().padLeft(), d.getFullYear()].join('/');

            $scope.workshops[i].dateAndTime = dformat;
            if(typeof $scope.workshops[i].photo == 'undefined') {
                $scope.workshops[i].photo = "/android_asset/www/img/default.jpg";
            }
        }
    });

    Number.prototype.padLeft = function(base,chr) {
        var len = (String(base || 10).length - String(this).length) + 1;
        return len > 0 ? new Array(len).join(chr || '0') + this : this;
    };

    //Display the equipment
    $scope.showAlert = function(workshop) {
        if(workshop.equipment) {
            $ionicPopup.alert({
                title: 'Vérifiez le matériel',
                template: workshop.equipment,
                cssClass: 'materiel'
            });
        }
    };

});