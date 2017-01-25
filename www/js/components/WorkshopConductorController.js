'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopConductorCtrl', function($scope, $stateParams, $ionicLoading, $interval, socket, TimerService, WorkshopsProvider) {

    // Automatically retrieve the workshop instance when arriving in this controller
    WorkshopsProvider.getWorkshopById($stateParams.workshopId, function (workshopResult) {

        $scope.workshop = workshopResult.data;
        $scope.stepsLenght = workshopResult.data.steps.length;

        var timingArray = $scope.workshop.steps.map(function(step, index){
            var stepArray = $scope.workshop.steps.slice(0, index);
            return stepArray.reduce(function (accumulateur, currentStep) {
                if(currentStep.duration.theorical) return accumulateur + currentStep.duration.theorical;
                else return accumulateur;
            }, 0);
        });

        for(var i = 0; i<timingArray.length; i++) {
            var d = new Date(timingArray[i] * 60000); //en miniseconde
            var time = d.toUTCString().split(" ")
            time = time[4].split(":")

            timingArray[i] =  time[0]+":"+time[1];
        }
        $scope.timingArray = timingArray;

        //Add word "minutes" to duration
        for(var i=0; i < $scope.workshop.steps.length; i++) {
            if($scope.workshop.steps[i].duration.theorical) {
                $scope.workshop.steps[i].duration.theorical = $scope.workshop.steps[i].duration.theorical + " minutes";
            }
        }

    });

});
