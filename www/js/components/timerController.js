angular.module('facilitation.timer', ['ionic','angular-svg-round-progress', 'ion-datetime-picker', 'socketio.service'])

.controller('TimerCtrl', function($scope, $timeout, socket) {
    
    // Timer
    var mytimeout = null; // the current timeoutID
    var timerIsSync = null;

    // TODO : remove hardcoded time
    $scope.timeForTimer = 30;
    $scope.timer = 30;
    $scope.started = false;
    $scope.paused = false;
    $scope.done = false;

    $scope.synchronizeTimer = function(){
        socket.emit('join_room', "roomTest");
    };

    socket.on('new_user', function(msg){
        alert(msg);
        timerIsSync = true;
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
    // functions to control the timer
    // starts the timer
    $scope.startTimer = function() {
        if(timerIsSync) {
            socket.emit('launch_timer', "roomTest");
            mytimeout = $timeout($scope.onTimeout, 1000);
            $scope.started = true;
        } else {
            alert("Sync please !");
        }
    };

    // stops and resets the current timer
    $scope.stopTimer = function(closingModal) {
        if (closingModal != true) {
            $scope.$broadcast('timer-stopped', $scope.timer);
        }
        $scope.timer = $scope.timeForTimer;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
        $timeout.cancel(mytimeout);
    };
    // pauses the timer
    $scope.pauseTimer = function() {
        $scope.$broadcast('timer-stopped', $scope.timer);
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
    // UI
    // When you press a timer button this function is called
    $scope.selectTimer = function(val) {
        $scope.timeForTimer = val;
        $scope.timer = val;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
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
