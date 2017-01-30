'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopCtrl', function($scope, $stateParams, $ionicLoading, $interval, $ionicModal, socket, TimerService, WorkshopsProvider, ViewAccessService) {
    $scope.workshop = {};
    $scope.timerIsSync = null;
    $scope.iterationRunning = false;
    $scope.workshopRunning = false;
    $scope.doneWorkshop = false;
    $scope.isLate = false;

    $ionicModal.fromTemplateUrl('../../templates/workshopConductor.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function() {
        $scope.modal.show();
    };
    $scope.closeModal = function() {
        $scope.modal.hide();
    };


    var timerInterval, globalTimerInterval, ispaused = false;
    var audio;


    // Automatically retrieve the workshop instance when arriving in this controller
    WorkshopsProvider.getWorkshopById($stateParams.workshopId, function (workshopResult) {
        $scope.workshop = workshopResult.data;

        /* ***** Initializing data for the iteration view ***** */
        $scope.workshopStepsDuration = filterWorkshopDurationSteps(workshopResult.data);//.filter(function (duration) {return duration > -1;});
        $scope.overallTime = $scope.workshopStepsDuration.reduce(
            function (a, b) {
                if(b != -1) return a+b;
                else return a;
            });
        $scope.roundNum = 0; // first iteration
        $scope.currentStep = $scope.workshop.steps[$scope.roundNum];
        if($scope.workshop.steps[$scope.roundNum+1] != undefined)
            $scope.nextStep = $scope.workshop.steps[$scope.roundNum+1];
        else
            $scope.nextStep = "";
        initializeIterationTimer($scope.workshopStepsDuration[$scope.roundNum]);
        initializeGlobalTimer($scope.overallTime);

        /* ***** Initializing data for the conductor view ***** */
        $scope.stepsLength = $scope.workshop.steps.length;

        var timingArray = $scope.workshop.steps.map(function (step, index) {
            var stepArray = $scope.workshop.steps.slice(0, index);
            return stepArray.reduce(function (accumulateur, currentStep) {
                if (currentStep.duration.theorical) return accumulateur + currentStep.duration.theorical;
                else return accumulateur;
            }, 0);
        });

        for (var i = 0; i < timingArray.length; i++) {
            var d = new Date(timingArray[i] * 60000); //en miniseconde
            var time = d.toUTCString().split(" ");
            time = time[4].split(":");

            timingArray[i] = time[0] + ":" + time[1];
        }
        $scope.timingArray = timingArray;

        //Add word "minutes" to duration
        for (var i = 0; i < $scope.workshop.steps.length; i++) {
            if ($scope.workshop.steps[i].duration.theorical) {
                $scope.workshop.steps[i].duration.theoricalMinutes =
                    $scope.workshop.steps[i].duration.theorical + " minutes";
            }
        }

    });

    $scope.initializeConductor = function () {
        ViewAccessService.accessView("conductor");
        ViewAccessService.getAccessTimes("conductor",function (nbAccess) {
           if(nbAccess == 1){

           }
        });
    };

    /**
     * Conductor : change the time of the selected iteration and propagate the changes to the others
     *
     * @param iterationNb  The round number selected
     * @param value         The amount of time to add (can be negative)
     */
    $scope.updateIterationsTimes = function (iterationNb, value) {
        // If previous iteration selected, do nothing
        if(iterationNb >= $scope.roundNum){
            // TODO : Condition to remove in the future to accept empty iterations
            if($scope.workshopStepsDuration[iterationNb] != -1){
                // Modifying current iteration data
                if(iterationNb == $scope.roundNum) {
                    if (value < 0) {
                        // If the iteration is running, using the functions designed to change the timer
                        if($scope.iterationRunning == true){
                            $scope.decreaseTimer(-(value));
                        } else {
                            handleTimersDecrease(-(value));
                        }
                    } else {
                        if($scope.iterationRunning == true){
                            $scope.increaseTimer(value);
                        } else {
                            handleTimersIncrease(value);
                        }
                    }
                } else {
                    // Updating actual global timer (if not handled before with the current iteration)
                    if($scope.workshopStepsDuration[iterationNb] != 0) {
                        $scope.actualGlobalTimer += value;
                        if ($scope.actualGlobalTimer < 0) {
                            $scope.actualGlobalTimer = 0;
                        }
                        updateTimersInConductor(iterationNb, value);
                    }
                }
            }

        }
    };

    /**
     * Simply updates the values showed in the conductor view
     *
     * @param iterationNb   The iteration timer to update
     * @param value         The value to add to the timer (can be negative)
     */
    function updateTimersInConductor(iterationNb, value){
        $scope.workshopStepsDuration[iterationNb] += value;
        if($scope.workshopStepsDuration[iterationNb] < 0) {
            $scope.workshopStepsDuration[iterationNb] = 0;
        }
        $scope.workshop.steps[iterationNb].duration.theoricalMinutes =
            $scope.workshopStepsDuration[iterationNb]/60 + " minutes";
    }

    // Filter the steps to retrieve only the durations
    function filterWorkshopDurationSteps(workshop){
        return workshop.steps.map(function (step) {
            if(step.duration != undefined && step.duration.theorical != undefined) return step.duration.theorical * 60;
            else return -1;
        });
    };

    // Used to join the wanted instance
    $scope.synchronizeTimer = function(){
        console.log("Join room : "+$scope.workshop._id);
        socket.emit('join_room', $scope.workshop._id);
    };

    // Ensure that the timer is synchronized
    socket.on('join_success', function(msg){
        $scope.timerIsSync = true;
        $ionicLoading.show({ template: msg, noBackdrop: true, duration: 2000 });
    });

    // Used to leave the instance when destroying (leaving) this controller
    $scope.$on("$destroy", function(){
        console.log("Leave room : "+$scope.workshop._id);
        socket.emit('leave_room', $scope.workshop._id);
        endOfWorkshop();
    });

    // TODO : MOVE TO SERVICE ?

    // Initialize the values for the iteration timer (plugin dependent)
    function initializeIterationTimer(val) {
        $scope.timeForTimer = val;
        $scope.timer = val;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
    };

    // Initialize the value(s) for the global timer
    function initializeGlobalTimer(val) {
        $scope.theoreticalGlobalTimer = val;
        $scope.actualGlobalTimer = val;
        $scope.isLate = false;
    }

    function endOfWorkshop() {
        $scope.doneWorkshop = true;
        $scope.workshopRunning = false;
        $scope.iterationRunning = false;
        $scope.roundNum = 0;
        stopGlobalTimer();
        initializeIterationTimer(0);
    }

    // Launch the instance
    $scope.startIteration = function () {
        if($scope.timerIsSync) {
            var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
            socket.emit('launch_timer', timerInfo);
            $scope.startTimer();
            if($scope.workshopRunning == false) {
                runGlobalTimer();
                $scope.workshopRunning = true;
            }
            $scope.iterationRunning = true;
        } else {
            alert("Sync please !");
        }
    };

    $scope.startTimer = function () {
        ispaused = false;
        $scope.started = true;
        if(angular.isDefined(timerInterval)) return;
        runIterationTimer();
    };

    $scope.pauseTimer = function () {
        ispaused = true;
        $scope.started = false;
        $scope.paused = true;
        stopIterationTimer(false);
    };

    $scope.resumeTimer = function(){
        if(!ispaused) return;
        ispaused = false;
        runIterationTimer();
    };

    $scope.resetTimer = function(){
        ispaused = false;
        stopIterationTimer(false);
        $scope.timer = $scope.timeForTimer;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
    };

    /**
     * Increase the timers according to the amount in parameters
     * Used for the +30 button
     * Stops and rerun the timers to stay synchronized so must be used when the timers are running
     * TODO : Change the bad names of theses 4 methods
     * @param amount
     */
    $scope.increaseTimer = function (amount) {
        stopIterationTimer(false);
        handleTimersIncrease(amount);
        var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
        socket.emit('restart_timer', timerInfo);
        runIterationTimer();
    };

    /**
     * Increase the timers according to the amount in parameters without synchronizing
     * TODO : Change the bad names of theses 4 methods
     * @param amount
     */
    function handleTimersIncrease(amount){
        $scope.timer += amount;
        $scope.actualGlobalTimer += amount;
        $scope.timeForTimer = $scope.timer;
        updateTimersInConductor($scope.roundNum, amount);
    }

    /**
     * Decrease the timers according to the amount in parameters
     * Used for the -30 button
     * Stops and rerun the timers to stay synchronized so must be used when the timers are running
     * TODO : Change the bad names of theses 4 methods
     * @param amount
     */
    $scope.decreaseTimer = function (amount) {
        stopIterationTimer(false);
        handleTimersDecrease(amount);
        var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
        socket.emit('restart_timer', timerInfo);
        runIterationTimer();
    };

    /**
     * Decrease the timers according to the amount in parameters without synchronizing
     * TODO : Change the bad names of theses 4 methods
     * @param amount
     */
    function handleTimersDecrease(amount){
        $scope.actualGlobalTimer -= $scope.timer;
        var timerVal = $scope.timer - amount;
        if(timerVal < 0) timerVal = 0;
        $scope.timer = timerVal;
        $scope.actualGlobalTimer += $scope.timer;
        $scope.timeForTimer = $scope.timer;
        updateTimersInConductor($scope.roundNum, -(amount));
    }

    function runIterationTimer(){
        timerInterval = $interval(function(){
            $scope.timer--;
            $scope.actualGlobalTimer--;
            // TODO : Check if that fix is not totally shitty
            if($scope.timer == -1) {
                $scope.timer = 0;
                stopIterationTimer(true);
            }
        }, 1000);
    };

    function stopIterationTimer(continueToNextIteration) {
        if (angular.isDefined(timerInterval)) {
            $interval.cancel(timerInterval);
            timerInterval = undefined;
            if(continueToNextIteration) {
                $scope.timerIsSync = false;
                $scope.iterationRunning = false;
                $scope.continueToNextIteration = true;
                audio = new Audio('../../sound/ALARM-DANGER-WARNING_Sound_Effect.mp3');
                audio.play();
                console.log("emit start sound");
                socket.emit('start_sound', $scope.workshop._id);
                // Just a fix for the global timer
                $scope.actualGlobalTimer += 1;
            }
        }
    };

    $scope.stopSound = function() {
        audio.pause();
        socket.emit('stop_sound', $scope.workshop._id);
        nextIteration();
        $scope.continueToNextIteration = false;
        $scope.timerIsSync = true;
    };

    function nextIteration(){
        $scope.roundNum++;
        // Avoid empty iterations
        while($scope.workshopStepsDuration[$scope.roundNum] == -1
                && $scope.roundNum < $scope.workshopStepsDuration.length){
            $scope.roundNum++;
        }
        // Go to the next iteration or ends the workshop
        if($scope.roundNum < $scope.workshopStepsDuration.length){
            initializeIterationTimer($scope.workshopStepsDuration[$scope.roundNum]);
            $scope.currentStep = $scope.workshop.steps[$scope.roundNum];
            if($scope.workshop.steps[$scope.roundNum+1] != undefined)
                $scope.nextStep = $scope.workshop.steps[$scope.roundNum+1];
            else
                $scope.nextStep = "";
            putNextStepMaxHeight();
        } else {
            endOfWorkshop();
        }
    }

    function runGlobalTimer() {
        globalTimerInterval = $interval(function(){
            if($scope.isLate){
                $scope.theoreticalGlobalTimer++;
            } else {
                $scope.theoreticalGlobalTimer--;
                if($scope.theoreticalGlobalTimer == -1) {
                    $scope.isLate = true;
                    $scope.theoreticalGlobalTimer = 1;
                }
            }


        }, 1000);
    }

    function stopGlobalTimer() {
        if (angular.isDefined(globalTimerInterval)) {
            $interval.cancel(globalTimerInterval);
            globalTimerInterval = undefined;
        }
    }

    // This function helps to display the time in a correct way in the center of the timer
    $scope.humanizeDurationTimer = function(input, units) {
        return TimerService.humanizeDurationTimer(input, units);
    };


    //Calc the height of the next step dynamically
    function putNextStepMaxHeight() {

        //TODO Manage to do it without this
        var delay=500; //0.5sec
        setTimeout(function() {

            //Get elem #actual-iteration
            var actualIteration = document.getElementById("actual-iteration");

            //Get height of it
            var hauteurIteration = actualIteration.offsetHeight;

            //Get margins height
            var offSet = window.getComputedStyle(actualIteration).getPropertyValue('margin-top').split("px");
            hauteurIteration += parseInt(offSet[0]);
            offSet = window.getComputedStyle(actualIteration).getPropertyValue('margin-bottom').split("px");
            hauteurIteration += parseInt(offSet[0]);

            //Get height of #first-row
            var hauteurTotale = document.getElementById("first-row").offsetHeight;

            //Calc the height we can give to #first-row-in
            var heightNextIteration = hauteurTotale - hauteurIteration;
            document.getElementById("first-row-in").style.height = heightNextIteration + "px";
        }, delay);

    }
    putNextStepMaxHeight();

});