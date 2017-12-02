/*
#####################################
#   Author: Fran Rives              #
#####################################
*/

// It can't be on document ready cause I'm using embedded fonts and have to wait till the browser loads them to get the width with the embedded fonts instead of with the default, browser fonts.
$(window).on('load', function () {

    var $productCategories = $('.productCategories button');

    $('.underline').css({
        left: $productCategories.first().position().left,
        width: $productCategories.first().width()
    });

    $('.productCategories button').on('click', moveUnderline);

    // Moves the underline just below the corresponding category.
    function moveUnderline(e) {
        var $that = $(this);
        /*$('.productCategories button').css('font-weight', 'normal');*/
        TweenLite.to($('.underline'), 0.5, {
            left: $(this).position().left + parseInt($(this).css('margin-left'), 10),
            width: $(this).width(),
            ease: 'Power1.easeInOut'
        });
    }

    // Sets the cursor of the clicked category to the arrow one.
    $('.productCategories button').on('click', function() {
        $('.productCategories button').css('cursor', 'pointer');
        $(this).css('cursor', 'default');
    });

});

// IE11 won't accept CSS transitions on SVGs, so I have to make them through GSAP.
$(document).ready(function () {

    $('.video > .playButton').on('mouseover', function () {
        TweenLite.to($(this).children('svg'), 0.5, {
            fill: '#fcfff5'
        });

    });

    $('.video > .playButton').on('mouseout', function () {
        TweenLite.to($(this).children('svg'), 0.5, {
            fill: '#1695a3'
        });
    });

});
