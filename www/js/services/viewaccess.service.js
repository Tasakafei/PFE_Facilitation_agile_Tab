/**
 * Created by user on 29/01/17.
 */

'use strict';

var app = angular.module('facilitation');
app.service('ViewAccessService', function ($http, $rootScope) {

    var views = {};

    this.accessView = function (viewname) {
        if(views[viewname] == undefined){
            views[viewname] = 1;
        } else {
            views[viewname]++;
        }
    };

    this.getAccessTimes = function (viewname, callback) {
        callback(views[viewname]);
    };

    this.resetAccessTimes = function(viewname){
        delete  views[viewname];
    };
});