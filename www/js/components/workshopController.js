'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopCtrl', function($scope, $stateParams, $ionicLoading, $interval, $ionicModal,
                                        socket, TimerService, WorkshopsProvider, $ionicPlatform) {
    $scope.workshop = {};
    $scope.timerIsSync = null;
    $scope.iterationRunning = false;
    $scope.workshopRunning = false;
    $scope.doneWorkshop = false;
    $scope.isLate = false;

    $ionicModal.fromTemplateUrl('templates/workshopConductor.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    },function (error) {
        alert(JSON.stringify(error));
    });

    $scope.openModal = function() {
        $scope.modal.show();
    };
    $scope.closeModal = function() {
        $scope.modal.hide();
    };


    var timerInterval, globalTimerInterval, ispaused = false;
    var isServe = (!(ionic.Platform.isAndroid() || ionic.Platform.isIOS() || ionic.Platform.isWindowsPhone()));
    var alarmUrl = "sound/ALARM-DANGER-WARNING_Sound_Effect.mp3";
    var media;

    // Initialize the media which plays the alarm sound, used to develop using as well ionic serve as ionic run [platform]
    function initMediaAudio() {
        if(isServe){
            if(media == undefined) media = new Audio("../../"+alarmUrl)
        } else {
            if(media == undefined) media = new Media("/android_asset/www/"+alarmUrl);
        }
    }
    // Calling the init media function
    initMediaAudio();

    // Automatically retrieve the workshop instance when arriving in this controller
    WorkshopsProvider.getEventsByDay($stateParams.dayNumber,function (eventsResult) {
        $scope.workshop = eventsResult.find(function (event) {
            return event._id == $stateParams.workshopId;
        });

        /* ***** Initializing data for the iteration view ***** */
        $scope.workshopStepsDuration = filterWorkshopDurationSteps($scope.workshop);
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

        //Formatting time
        for (var i = 0; i < $scope.workshop.steps.length; i++) {
            if ($scope.workshop.steps[i].duration.theorical) {
                //Output format
                var theoricalMinutes = [];
                theoricalMinutes[i] = formatTime($scope.workshopStepsDuration[i]/60 * 60000);

                $scope.workshop.steps[i].duration.theoricalMinutes = theoricalMinutes[i];
            }
        }

    });

    /*********************************************** CONDUCTOR ********************************************************/

    /**
     * Conductor : change the time of the selected iteration and propagate the changes to the others
     *
     * @param iterationNb  The round number selected
     * @param value         The amount of time to add (can be negative)
     */
    $scope.updateIterationsTimes = function (iterationNb, value) {
        // If previous iteration selected, do nothing
        if(iterationNb >= $scope.roundNum) {
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
                    if($scope.workshopStepsDuration[iterationNb] >= 0 && value >= 0) {
                        $scope.actualGlobalTimer += value;
                        if ($scope.actualGlobalTimer < 0) {
                            $scope.actualGlobalTimer = 0;
                        }
                        updateTimersInConductor(iterationNb, value);
                    } else if ($scope.workshopStepsDuration[iterationNb] != 0){
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

        //Check if the user double the time allowed or if he reduce it too much
        if($scope.workshopStepsDuration[iterationNb] == ($scope.workshop.steps[iterationNb].duration.theorical * 60 * 2) && (value > 0)) {
            $scope.showAlert("Vous avez doublé le temps alloué à cette itération.");
        } else if ($scope.workshopStepsDuration[iterationNb] == ($scope.workshop.steps[iterationNb].duration.theorical * 60 / 2) && (value < 0)) {
            $scope.showAlert("Vous avez divisé par 2 le temps alloué à cette itération.");
        }

        //Output format
        var theoricalMinutes = [];
        theoricalMinutes[iterationNb] =  formatTime($scope.workshopStepsDuration[iterationNb]/60 * 60000);

        var timeVariationDuration = $scope.workshopStepsDuration[iterationNb]/60 * 60000
            - parseInt($scope.workshop.steps[iterationNb].duration.theorical) * 60000;
        var timeVariationPresentation;

        if(timeVariationDuration > 0) {
            timeVariationPresentation = "(+"+TimerService.humanizeDurationTimer(timeVariationDuration, "ms")+")";
        } else if(timeVariationDuration < 0) {
            timeVariationDuration = parseInt($scope.workshop.steps[iterationNb].duration.theorical) * 60000
                - $scope.workshopStepsDuration[iterationNb]/60 * 60000;
            timeVariationPresentation = "(-"+TimerService.humanizeDurationTimer(timeVariationDuration, "ms")+")";
        } else {
            timeVariationPresentation = "";
        }

        timeVariationPresentation = timeVariationPresentation.replace(/\s+/g, '');
        $scope.workshop.steps[iterationNb].duration.theoricalMinutes =
            theoricalMinutes[iterationNb] + " " + timeVariationPresentation;
    }

    $scope.showAlert = function(content) {
        $ionicPopup.alert({
            title: 'Attention !',
            template: content
        });
    };

    // Filter the steps to retrieve only the durations
    function filterWorkshopDurationSteps(workshop){
        return workshop.steps.map(function (step) {
            if(step.duration != undefined && step.duration.theorical != undefined) return step.duration.theorical * 60;
            else return -1;
        });
    };

    function moveChevron() {
        //We are late
        if($scope.actualGlobalTimer > $scope.theoreticalGlobalTimer) {

            var accumulatorReal = 0;
            for (var i = 0; i < $scope.workshop.steps.length; i++) {

                //Real time steps accumulation
                if($scope.workshopStepsDuration[i] != undefined)
                    accumulatorReal += $scope.workshopStepsDuration[i];

                if( accumulatorReal > $scope.theoreticalGlobalTimer ) {
                    var modalActive = document.getElementsByClassName("modal-backdrop active")[0];
                    // If the modal IS opened (if closed, issue can happen where deactivated modal is selected)
                    if(modalActive != undefined) {
                        var elem = modalActive.getElementsByClassName("step-" + (i))[0];

                        //Clean other chevron
                        for (var y = 0; y < document.getElementsByClassName("chevron").length; y++) {
                            document.getElementsByClassName("chevron")[y].style.display = "none";
                        }

                        //Add chevron
                        elem.getElementsByClassName("chevron")[0].style.display = "block";

                        //TODO something wrong here :/
                        //Calcul chevron position
                        var length = $scope.timingArray.length;
                        var timeTab = $scope.timingArray[length - 1].split(":");
                        var time = (timeTab[0] * 60 + timeTab[1]) * 60;
                        var chevronImgHeight = elem.getElementsByClassName("img-chevron")[0].offsetHeight;

                        //Add chevron position
                        var chevronHeight = 100 * ( accumulatorReal - time) / $scope.workshopStepsDuration[i];
                        elem.getElementsByClassName("img-chevron")[0].style.top =
                            (elem.offsetHeight - (chevronHeight / 100 * elem.offsetHeight)) - (chevronImgHeight / 2) + "px";

                        break;
                    }
                }
            }
        } //We are in time
        else  {

            var modalActive = document.getElementsByClassName("modal-backdrop active")[0];
            // If the modal IS opened (if closed, issue can happen where deactivated modal is selected)
            if(modalActive != undefined) {
                //Clean other chevron
                for (var y = 0; y < document.getElementsByClassName("chevron").length; y++) {
                    document.getElementsByClassName("chevron")[y].style.display = "none";
                }

                //Add chevron at the end
                var elem = modalActive.getElementsByClassName("step-" + ($scope.workshop.steps.length - 1))[0];
                elem.getElementsByClassName("chevron")[0].style.display = "block";
            }
        }
    }

    /*********************************************** TIMER SYNC *******************************************************/

    // Used to join the wanted instance
    $scope.synchronizeTimer = function(){
        console.log("Join room : "+$scope.workshop._id);
        socket.emit('join_room', $scope.workshop._id);
    };

    //Delete an iteration on swipe
    var tmpCurrentTime;
    var tmpIterationRunning;
    $scope.swipeToDelete = function(elem) {

        var elems = document.getElementsByClassName("step-" + elem);
        var buttons = elems[5].getElementsByClassName("button-positive");

        //Check if the step is not already over
        if (!elems[0].getElementsByClassName('stepDoneFirst')[0]) {
            for (var i = 0; i < elems.length; i++) {
                elems[i].classList.toggle("stepSwipe");
            }

            for (i = 0; i < buttons.length; i++) {
                buttons[i].classList.toggle("hideButton30");
            }

            //If not already skiped
            if(!$scope.workshop.steps[elem].skiped) {
                if (elem == $scope.roundNum) {
                    tmpCurrentTime = $scope.timer;

                    $scope.decreaseTimer($scope.timer);
                    $scope.workshop.steps[elem].skiped = true;
                    tmpIterationRunning = $scope.iterationRunning;
                } else {
                    console.log($scope.workshopStepsDuration[elem]);
                    console.log($scope.workshop.steps[elem].duration.theorical * 60);
                    $scope.updateIterationsTimes(elem, -$scope.workshopStepsDuration[elem]);
                    $scope.workshop.steps[elem].skiped = true;

                    //Display the right text
                    for( var i =0; $scope.nextStep.skiped; i++) {
                        $scope.nextStep = $scope.workshop.steps[elem + i];
                    }
                }
            } else {
                //Current iteration
                if (elem == $scope.roundNum) {
                    $scope.increaseTimer(tmpCurrentTime);
                    $scope.workshop.steps[elem].skiped = false;

                    media.pause();
                    socket.emit('stop_sound', $scope.workshop._id);
                    $scope.continueToNextIteration = false;
                    $scope.iterationRunning = tmpIterationRunning;
                    $scope.timerIsSync = true;

                    if(!tmpIterationRunning) {
                        stopIterationTimer(false);
                    }
                } else {
                    $scope.updateIterationsTimes(elem, $scope.workshop.steps[elem].duration.theorical * 60);
                    $scope.workshop.steps[elem].skiped = false;

                    //Display the right text if( $scope.nextStep._id !=  $scope.workshop.steps[elem]._id)
                    var i = 1;
                    //Next iteration
                    if($scope.roundNum + 1 == elem) {
                        $scope.nextStep = $scope.workshop.steps[elem];
                    } else { //Other iteration
                        while ($scope.workshop.steps[$scope.roundNum + i].skiped) {
                            i++;
                        }
                        if ($scope.roundNum + i == elem) {
                            $scope.nextStep = $scope.workshop.steps[elem];
                        }
                    }
                }
            }

        }
    };

    // Ensure that the timer is synchronized
    socket.on('join_success', function(msg){
        $scope.timerIsSync = true;
        $ionicLoading.show({ template: msg, noBackdrop: true, duration: 2000 });
    });

    // Used to leave the instance when destroying (leaving) this controller
    $scope.$on("$destroy", function(){
        console.log("Leave room : "+$scope.workshop._id);
        if(isServe) media.pause();
        else media.stop();
        $scope.modal.remove();
        socket.emit('stop_sound', $scope.workshop._id);
        socket.emit('leave_room', $scope.workshop._id);
        endOfWorkshop();
    });

    /******************************************** TIMERS AND ITERATIONS ***********************************************/

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
        stopIterationTimer(false);
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
                media.play();
                console.log("emit start sound");
                socket.emit('start_sound', $scope.workshop._id);
                // Just a fix for the global timer
                $scope.actualGlobalTimer += 1;
            }
        }
    };

    $scope.stopSound = function() {
        media.pause();
        socket.emit('stop_sound', $scope.workshop._id);
        nextIteration();
        $scope.continueToNextIteration = false;
        $scope.timerIsSync = true;
    };

    function nextIteration() {
        $scope.roundNum++;
        // Avoid empty iterations
        while ($scope.workshopStepsDuration[$scope.roundNum] == -1
        && $scope.roundNum < $scope.workshopStepsDuration.length) {
            $scope.roundNum++;
        }

        //Avoid skiped iterations
        if ($scope.roundNum < $scope.workshopStepsDuration.length) {
            while ($scope.workshop.steps[$scope.roundNum].skiped) {
                $scope.roundNum++;

                //If we are already at the end
                if($scope.roundNum == $scope.workshopStepsDuration.length - 1) {
                    endOfWorkshop();
                }
            }
        }

        // Go to the next iteration or ends the workshop
        if($scope.roundNum < $scope.workshopStepsDuration.length){
            initializeIterationTimer($scope.workshopStepsDuration[$scope.roundNum]);
            $scope.currentStep = $scope.workshop.steps[$scope.roundNum];
            if($scope.workshop.steps[$scope.roundNum+1] != undefined) {

                var i = 1;
                //Avoid skiped iterations
                while($scope.workshop.steps[$scope.roundNum+i].skiped) {
                    i++;
                }
                $scope.nextStep = $scope.workshop.steps[$scope.roundNum + i];
            }
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

            //Check if we need to move the chevron
            moveChevron();

        }, 1000);
    }

    function stopGlobalTimer() {
        if (angular.isDefined(globalTimerInterval)) {
            $interval.cancel(globalTimerInterval);
            globalTimerInterval = undefined;
        }
    }

    /************************************************* OTHERS *********************************************************/


    // This function helps to display the time in a correct way in the center of the timer (with "m" & "s" format)
    $scope.humanizeDurationTimer = function(input, units) {
        return TimerService.humanizeDurationTimer(input, units);
    };

    function formatTime(millis) {
        var d = new Date(millis);
        var time = d.toUTCString().split(" ");
        time = time[4].split(":");
        var formattedTime =  time[1] +":" + time[2];
        return formattedTime;
    }


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