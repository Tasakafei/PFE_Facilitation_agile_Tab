var app = angular.module('facilitation');

app.service('TimerService', function ($rootScope, $timeout, $interval) {
    var mytimeout = null;

    // initialize the timer for time value and workshop id (for socket.io)
    this.initializeTimer = function(val) {
        $rootScope.timeForTimer = val;
        $rootScope.timer = val;
        $rootScope.started = false;
        $rootScope.paused = false;
        $rootScope.done = false;
    };

    // starts the timer
    this.startTimer = function(){
        mytimeout = $timeout(onTimeout, 1000);
        $rootScope.started = true;
    };

    // stops and resets the current timer
    this.stopTimer = function(){
        $rootScope.timer = $rootScope.timeForTimer;
        $rootScope.started = false;
        $rootScope.paused = false;
        $rootScope.done = false;
        $timeout.cancel(mytimeout);
    };

    // pauses the timer
    this.pauseTimer = function(){
        $rootScope.started = false;
        $rootScope.paused = true;
        $timeout.cancel(mytimeout);
    };

    // This function helps to display the time in a correct way in the center of the timer
    this.humanizeDurationTimer = function(input, units) {
        // units is a string with possible values of y, M, w, d, h, m, s, ms
        if (input == 0) {
            return 0;
        } else {
            var duration = moment().startOf('day').add(input, units);
            var format = "";
            if (duration.hour() > 0) {
                format += "H[h] ";
            }
            if (duration.minute() > 0) {
                format += "m[m] ";
            }
            if (duration.second() > 0) {
                format += "s[s] ";
            }
            return duration.format(format);
        }
    };

    // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
    /*$rootScope.$on('timer-stopped', function(event, remaining) {
        if (remaining === 0) {
            $rootScope.done = true;
        }
    });*/

    // actual timer method, counts down every second, stops on zero
    function onTimeout() {
        if ($rootScope.timer === 0) {
            $rootScope.$broadcast('timer-stopped', 0);
            $timeout.cancel(mytimeout);
        } else {
            $rootScope.timer--;
        }
        mytimeout = $timeout(onTimeout, 1000);
    };



    /********************** OTHER VERSION ***********************/
    var timer, ispaused = false;
    this.startTimerV2 = function (timeAmount) {
        ispaused = false;
        if(angular.isDefined(timer)) return;
        $rootScope.countDown = timeAmount;
        $rootScope.lastTimeAmount = timeAmount;
        runTimer();
    };

    this.pauseTimerV2 = function () {
        ispaused = true;
        stopTimer();
    };

    this.resumeTimerV2 = function(){
        if(!ispaused) return;
        ispaused = false;
        runTimer();
    };

    this.resetTimerV2 = function(){
        ispaused = false
        stopTimer();
        $rootScope.countDown = $rootScope.lastTimeAmount;
        $rootScope.$apply();
    };

    function runTimer(){
        timer = $interval(function(){
            $rootScope.countDown--;
            if($rootScope.countDown == 0) stopTimer();
            $rootScope.$apply();
        }, 1000);
    };

    function stopTimer() {
        if (angular.isDefined(timer)) {
            $interval.cancel(timer);
            timer = undefined;
        }
    };
});