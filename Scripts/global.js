/*
#####################################
#   Author: Fran Rives              #
#####################################
*/

$(document).ready(function () {

    $(window).resize(setHeaderWidth);

    // Sets the width of the header to be always the same as the .body.scrollable element.
    function setHeaderWidth() {
        $('.mainNav').parent().css('width', $('.body.scrollable').outerWidth());
    }

    var myAnimation,
        isFixed = false,
        isVisible = false;

    $('.mainNav').parent().css({
        zIndex: 1,
        position: 'fixed',
        left: 0,
        width: $('.body.scrollable').outerWidth(),
    });

    $('.MiniLogo').css({
        left: "-=" + $('.MiniLogo').outerWidth()
    });

    $('.body.scrollable').css('visibility', 'visible');

    $('.body.scrollable').on('scroll', function () {

        if ($('.body.scrollable').scrollTop() >= 157) {
            if (!isVisible) {
                myAnimation = TweenLite.to($('.MiniLogo'), 0.5, {
                    left: -15,
                    rotation: 360,
                    onComplete: function () {
                        isVisible = true;
                    },
                    ease: Power1.easeInOut
                });
            }
        } else {
            myAnimation = TweenLite.to($('.MiniLogo'), 0.5, {
                left: "-=" + $('.MiniLogo').outerWidth(),
                rotation: 0,
                onComplete: function () {
                    isVisible = false;
                },
                ease: Power1.easeInOut
            });
        }

    });

    // Sets the search input style when focusing in.
    $('.search > input').focusin(function (e) {
        $('.search > button').css('background-color', 'rgba(25, 52, 65, 0)');
    });

    // Sets the search input style when focusing out.
    $('.search > input').focusout(function () {
        $('.search > button').css('background-color', 'rgba(25, 52, 65, 1)');
    });

});
