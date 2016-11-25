angular.module('facilitation.timer', ['ionic','angular-svg-round-progress', 'ion-datetime-picker', 'socketio.service'])

.controller('TimerCtrl', function($scope, $timeout, socket) {
    
    // Timer
    var mytimeout = null; // the current timeoutID
    var timerIsSync = null;

    // Used to join the wanted room
    $scope.synchronizeTimer = function(){
        socket.emit('join_room', $scope.roomId);
    };

    // TODO : testing only, to remove
    socket.on('new_user', function(msg){
        alert(msg);
        timerIsSync = true;
    });

    // initialize the timer for time value and workshop id (for socket.io)
    $scope.initializeTimer = function(val, workshop) {
        $scope.timeForTimer = val;
        $scope.timer = val;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
        $scope.roomId = workshop;
    };

    // TODO : remove hardcoded time
    $scope.initializeTimer(60, "roomTest");

    // wrap the start function for syncing
    $scope.startSyncTimer = function() {
        if(timerIsSync) {
            var timerInfo = {"workshop":$scope.roomId,"duration":$scope.timeForTimer};
            socket.emit('launch_timer', timerInfo);
            startTimer();
        } else {
            alert("Sync please !");
        }
    };

    // wrap the resume function for syncing
    $scope.resumeSyncTimer = function() {
        socket.emit('resume_timer', $scope.roomId);
        startTimer();
    };

    // wrap the stop and reset function for syncing
    $scope.stopSyncTimer = function(closingModal) {
        socket.emit('stop_timer', $scope.roomId);
        stopTimer(closingModal);
    };

    // wrap the pause function for syncing
    $scope.pauseSyncTimer = function() {
        socket.emit('pause_timer', $scope.roomId);
        pauseTimer();
    };

    // functions to control the timer
    // starts the timer
    function startTimer(){
        mytimeout = $timeout($scope.onTimeout, 1000);
        $scope.started = true;
    };

    // stops and resets the current timer
    function stopTimer(){
        $scope.timer = $scope.timeForTimer;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
        $timeout.cancel(mytimeout);
    };

    // pauses the timer
    function pauseTimer(){
        $scope.started = false;
        $scope.paused = true;
        $timeout.cancel(mytimeout);
    };

    // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
    $scope.$on('timer-stopped', function(event, remaining) {
        if (remaining === 0) {
            $scope.done = true;
        }
    });

    // actual timer method, counts down every second, stops on zero
    $scope.onTimeout = function() {
        if ($scope.timer === 0) {
            $scope.$broadcast('timer-stopped', 0);
            $timeout.cancel(mytimeout);
            return;
        }
        $scope.timer--;
        mytimeout = $timeout($scope.onTimeout, 1000);
    };

    // This function helps to display the time in a correct way in the center of the timer
    $scope.humanizeDurationTimer = function(input, units) {
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
});