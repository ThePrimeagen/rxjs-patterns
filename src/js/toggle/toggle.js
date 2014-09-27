var Rx = require('rx');
var $ = require('jquery');

$(function() {
    var $highlighter = $('.highlighter');
    var $content = $('.content');
    var moves = Rx.Observable.fromEvent($content[0], 'mousemove');
    var presses = Rx.Observable.
        fromEvent($content[0], 'mousedown').
        doAction(function(e) {
            $highlighter.show();
            $highlighter.css({
                left: e.x + 'px',
                top: e.y + 'px'
            });
        });
    var releases = Rx.Observable.
        fromEvent($content[0], 'mouseup').
        doAction(function(e) {
            $highlighter.hide();
        });

    $highlighter.hide();

    presses.
        selectMany(function(e) {
            return moves.
                doAction(function(e) {
                    $highlighter.css({
                        left: e.x + 'px',
                        top: e.y + 'px'
                    });
                }).
                takeUntil(releases);
        }).
        subscribe(function() {}, function(err) {
            console.log("Err: " + err);
        }, function() {
            console.log("Finished");
        });

});
