/*
#####################################
#   Author: Fran Rives              #
#####################################
*/

$(document).ready(function () {

    ///////////////////////////////////////////////////////////////////////////
    /// 1. SCROLLBAR CONFIGURATION WHEN LOADING OR RESIZING THE DOCUMENT.   ///
    ///////////////////////////////////////////////////////////////////////////

    $(window).on('beforeunload', resetScroll); // To trick Chrome (because it loads the document from the last scrolled position).

    var $scrollable = $('.scrollable');
    addListeners();

    // Resets the scroll of all the elements.
    function resetScroll() {
        $scrollable.scrollTop(0);
    }

    setDims();
    $(window).resize(setDims);

    // Sets the height of the scrollbar, the frame, the content div, and the height and the width of the scrollable element.
    function setDims() {
        if ($scrollable.attr('class') == 'body scrollable') {
            $scrollable.css({
                height: $(window).outerHeight(),
                width: $(window).outerWidth() - 20
            });
        }

        $(".vscroll").css('height', $scrollable.outerHeight());
        $(".vscroll").hide().show(0); // To fix Chrome not rendering the bottom arrow container properly when pressing the maximize/restore button.
        $('.frame').css('height', $scrollable.outerHeight() - $('.top').outerHeight() * 2);
        $('.content').css('height', $scrollable.outerHeight() - $('.floating').outerHeight());
    }

    setScrollbarDisplay()
    $(window).resize(setScrollbarDisplay);

    // Sets the display property of the scrollbar when necessary.
    function setScrollbarDisplay() {
        if ($scrollable[0].scrollHeight > $scrollable.outerHeight()) {
            $(".vscroll").css('display', 'block'); // I have to use block because IE doesn't recognize initial.
            setBarHeight();
        } else
            $(".vscroll").css('display', 'none');
    }

    var ratio, // (Height of the scrollable element - height of the two arrow containers) / height of the body (to determine the bar height).
        barHeight,
        adjustedRatio; // The distance the bar moves it's not the distance the element moves * ratio because the bar can't move the whole height of the frame (we have to take into account its own height and subtract it from the frame height to know how much it can move).

    // Sets the bar height (and ratio).
    function setBarHeight() {
        ratio = ($scrollable.outerHeight() - $('.bottom').outerHeight() * 2) / $scrollable[0].scrollHeight;
        barHeight = ($scrollable.outerHeight() - $('.bottom').outerHeight() * 2) * ratio;
        if (barHeight > 14)
            $(".bar").css('height', barHeight);
        else
            $(".bar").css('height', 14);
    }

    ////////////////////////////////////
    /// 2. GENERAL SCROLLING ASSETS. ///
    ////////////////////////////////////

    // Helper function that returns the real scrollable distance (in case the desired distance is bigger than what can be scrolled).
    function calcScrollDistance(desiredDistance) {
        var scrollDistance = desiredDistance > 0 ? $scrollable[0].scrollHeight - $scrollable.scrollTop() - $scrollable.outerHeight() : -$scrollable.scrollTop();
        scrollDistance = Math.abs(scrollDistance) >= Math.abs(desiredDistance) ? desiredDistance : scrollDistance;

        return scrollDistance;
    }

    // Gets the exact width of the default vertical scrollbar (it depends on the specific browser or OS). The width is always the same as the height of the default horizontal scrollbar.
    function getScrollbarWidth() {
        var $outer = $('<div>').css({
                visibility: 'hidden',
                width: 100,
                overflow: 'scroll'
            }).appendTo('body'),
            widthWithScroll = $('<div>').css({
                width: '100%'
            }).appendTo($outer).outerWidth();
        $outer.remove();
        return 100 - widthWithScroll;
    }

    // Adds all the event listeners associated with the scrolling.
    function addListeners() {
        if ($scrollable.attr('class') == 'body scrollable') {
            $('body').on('keydown', filterKeys);
            $('body').on('keyup', stopScroll);
        } else {
            $scrollable.on('keydown', filterKeys);
            $scrollable.on('keyup', stopScroll);
        }
        $scrollable.on('mousedown', filterKeys);
        $('.vscroll .top, .vscroll .bottom').on('mousedown', filterKeys);
        $('.vscroll .top, .vscroll .bottom').on('mouseup', stopScroll);
        $('.vscroll .frame').on('mousedown', filterFrame);
        $('.vscroll .frame').on('mouseup', stopScroll);

        $scrollable.on('mouseover', function () {
            $scrollable.on('mousewheel DOMMouseScroll', filterMW); // DOMMouseScroll is for Firefox.
        });
        $scrollable.on('mouseout', function () {
            $scrollable.off('mousewheel DOMMouseScroll');
        });
    }

    // Removes all the event listeners associated with the scrolling.
    function removeListeners() {
        if ($scrollable.attr('class') == 'body scrollable') {
            $('body').off('keydown');
            $('body').off('keyup');
        } else {
            $scrollable.off('keydown');
            $scrollable.off('keyup');
        }

        $scrollable.off('mousedown');
        $('.vscroll .top, .vscroll .bottom').off('mousedown');
        $('.vscroll .top, .vscroll .bottom').off('mouseup');
        $('.vscroll .frame').off('mousedown');
        $('.vscroll .frame').off('mouseup');

        $scrollable.off('mouseover');
        $scrollable.off('mouseout');
    }

    // Sets various properties of the middle mouse button navigation div.
    function setMMNav(x, y) {
        if ($scrollable[0].scrollWidth <= $(window).outerWidth(true))
            $('.mscroll .left, .mscroll .right').css('display', 'none');
        if ($scrollable[0].scrollHeight <= $(window).outerHeight(true))
            $('.mscroll .top, .mscroll .bottom').css('display', 'none');

        if ($scrollable[0].scrollWidth <= $(window).outerWidth(true) && $scrollable[0].scrollHeight <= $(window).outerHeight(true))
            return;

        $('.mscroll').css({
            'left': x - $('.mscroll').outerWidth() / 2,
            'top': y - $('.mscroll').outerHeight() / 2
        });
        $('.mscroll').css('display', $('.mscroll').css('display') == 'none' ? 'inline-block' : 'none');
    }

    // Helper function that calculates if the pointer is above the bar or not.
    function calcIsAboveBar(e) {
        var $bar = $('.vscroll .bar');
        return (e.pageY >= $bar.position().top) && (e.pageY <= $bar.position().top + $bar.outerHeight()) ? true : false;
    }

    ///////////////////////////////////////
    /// 3. GENERAL SCROLLING BEHAVIOR.  ///
    ///////////////////////////////////////

    var currentKey = -1, // Stores the key code of the currently pressed key (it won't store any new key codes until the key is released).
        keyCodes = [38, 40, 34, 33, 35, 36, 1, 2], // Array with all the key codes of the keys that trigger any scrolling event.
        isStoppable = false, // Flag that checks if the current scroll animation is stoppable while it hasn't finished by cancelling the associated event.
        isRunning = false, // Flag that checks if the animation is running at a given moment.
        isPressed = false, // Flag that checks if there's some key associated with the current event pressed at a given moment.
        scrollTimeout,
        myAnimation;

    // Produces the regular scroll animation (when pressing the arrow keys or clicking on the arrow containers).
    function animateRegularScroll(e, direction, delay) {
        e.preventDefault();
        if (calcScrollDistance(direction == 'down' ? 100000 : -100000) == 0) // If there's no distance, don't call scrollV().
            return;

        isStoppable = false;
        scrollV(e, calcScrollDistance(direction == 'down' ? 57 : -57), 0.3, 'Power1.easeInOut');
        scrollTimeout = setTimeout(function () {
            isStoppable = true;
            if (isPressed) {
                // Giving it a big number, calcScrollDistance() will return the total distance to the end or beginning of the scrollable element.
                scrollV(e, calcScrollDistance(direction == 'down' ? 100000 : -100000), 0.9, 'Power1.easeInOut');
            }
        }, 57 / 0.3 + delay);
    }

    // Produces the page scroll animation (when pressing the PgDn or PgUp keys, or mousing down inside the frame).
    function animatePageScroll(e, direction, delay) {
        e.preventDefault();
        var pageDistance = calcScrollDistance(direction == 'down' ? $scrollable.outerHeight() : -$scrollable.outerHeight());
        if (pageDistance == 0)
            return;

        // If it's a mousing down on the frame event, and the mouse is above the bar, return without doing anything.
        if (e.target.className == 'frame' && calcIsAboveBar(e))
            return;

        isStoppable = false;
        scrollV(e, pageDistance, 0.9, 'Back.easeInOut');
        scrollTimeout = setTimeout(function () {
            if (isPressed)
                animatePageScroll(e, direction, delay);
        }, Math.abs(pageDistance) / 0.9 + delay);
    }

    // Produces the full scroll animation (when pressing the Home or End keys, or clicking the footer up arrow button).
    function animateFullScroll(e, direction) {
        e.preventDefault();
        isStoppable = false;

        scrollV(e, calcScrollDistance(direction == 'down' ? 100000 : -100000), 1.8, 'Bounce.easeOut');
    }

    // Produces the scroll animation used when triggering a single mouse wheel event.
    function animateMWScroll(e, direction) {
        e.preventDefault();
        if (calcScrollDistance(direction == 'down' ? 100000 : -100000) == 0)
            return;

        isStoppable = false;
        scrollV(e, calcScrollDistance(direction == 'down' ? 114 : -114), 0.3, 'Power1.easeInOut');
    }

    // Produces the scroll animation used when triggering a multiple mouse wheel event.
    function animateMWMultipleScroll(e, direction) {
        e.preventDefault();
        if (calcScrollDistance(direction == 'down' ? 100000 : -100000) == 0)
            return;

        isStoppable = true;
        stopScroll(e);

        scrollV(e, calcScrollDistance(direction == 'down' ? 342 : -342), 1.8, 'Power1.easeOut');
    }

    // Produces the scroll animation used when triggering a middle mouse button press.
    function animateMMScroll(e) {
        e.preventDefault();
        isStoppable = true;

        if ($('.mscroll').css('display') == 'none') {
            setMMNav(e.pageX, e.pageY);
            removeListeners();
            $scrollable.on('mousedown', function (e2) {
                e2.preventDefault();
                $('.mscroll').css('display', 'none');
                $scrollable.off('mousedown');
                $scrollable.off('mousemove');
                stopScroll(e);
                addListeners();
            });
        }

        var downThreshold = e.pageY + $('.mscroll').outerHeight() / 2,
            upThreshold = e.pageY - $('.mscroll').outerHeight() / 2;
        $scrollable.on('mousemove', function (e2) {
            if (e2.pageY > downThreshold) {
                $('.mscroll .bottom').css('fill', '#acf0f2');
                var distance = $(window).outerHeight() - e2.pageY;
                stopScroll(e2);
                scrollV(e2, calcScrollDistance(100000), (e2.pageY - downThreshold) / distance * 1.8, 'Power0');
            } else if (e2.pageY <= downThreshold && e2.pageY >= upThreshold) {
                $('.mscroll .bottom, .mscroll .top').css('fill', '#fcfff5');
                stopScroll(e2);
            } else if (e2.pageY < upThreshold) {
                $('.mscroll .top').css('fill', '#acf0f2');
                var distance = e2.pageY;
                stopScroll(e2);
                scrollV(e2, calcScrollDistance(-100000), (upThreshold - e2.pageY) / distance * 1.8, 'Power0');
            }
        });
    }

    // Produces the scroll animation used when holding the mouse primary button down and moving the mouse outside of the scrollable element.
    function animateSelectScroll(e, that) {
        isStoppable = true;

        var threshold = $scrollable.position().top + $scrollable.outerHeight() / 2;
        /*$(that).on('mouseout', function (e2) { // Mouseleave is not working correctly in Firefox.
            if ($(e2.target).hasClass('test') || $(e2.target).hasClass('scrollable'))
                scrollV(e, calcScrollDistance(e2.pageY > threshold ? 100000 : -100000), 0.6, 'Power0');
            $(that).on('mouseenter', function () {
                stopScroll(e);
            });
        });*/

        $(window).on('mouseup', function () {
            stopScroll(e);
            $('body').off('mouseout');
            $(that).off('mouseenter');
            $(window).off('mouseup');
        });
    }

    // Scrolls vertically any scrollable element, considering the arguments given.
    function scrollV(e, distance, speed, type) {
        // It won't calculate the outerHeight of the body correctly if assigned at the same time than ratio and barHeight.
        adjustedRatio = ($scrollable.outerHeight() - $('.bottom').outerHeight() * 2 - barHeight) / ($scrollable[0].scrollHeight - $scrollable.outerHeight());
        var time = Math.abs(distance) / speed / 1000;

        isPressed = true;
        isRunning = true;
        myAnimation = TweenLite.to($scrollable, time, {
            scrollTop: "+=" + distance,
            onComplete: function () {
                isStoppable = true;
                isRunning = false;
                // Putting the focus away from the browser while any key is pressed and releasing it outside of its focus, would not trigger stopScroll() so any later key presses wouldn't scroll (you would have to refresh the document for them to produce scroll animations again). This solves it.
                if (calcScrollDistance(distance > 0 ? 100000 : -100000) == 0)
                    stopScroll(e);
                // The mousewheel event doesn't have an opposite one to track, so at the end of the scroll triggered by it we have to set isPressed to false.
                if (e.type == 'mousewheel' || e.type == 'DOMMouseScroll')
                    isPressed = false;
            },
            ease: type
        });
    }

    // Stops any scroll animation beyond the minimum distance.
    function stopScroll(e) {
        // To avoid the release of other registered keys (while having the key associated with the event pressed) stopping or flagging the key as released.
        if (currentKey != e.which && e.type == 'keyup')
            return;

        isPressed = false;
        clearTimeout(scrollTimeout);
        if (isStoppable) {
            if (myAnimation != null)
                myAnimation.kill();
            isRunning = false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// 4. SCROLLING BEHAVIOR WHEN PRESSING KEYS, MOUSING DOWN ARROW CONTAINERS, OR PRESSING THE MIDDLE MOUSE BUTTON.   ///
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Determines what type of scroll will be done depending on the key pressed.
    function filterKeys(e) {
        // If there's already a key associated with a scrolling animation pressed, or there's an animation running: return without doing anything.
        if (isPressed || isRunning)
            return;

        var keyMatch = false; // It will only call any function if the key pressed matches one of the key codes in the array.
        $.each(keyCodes, function (index, value) {
            if (e.which == value) {
                keyMatch = true;
                return false; // It's tantamount to a break statement on a regular loop.
            }
        });

        if (keyMatch) {
            currentKey = e.which;

            switch (e.which) {
            case 40: // Down arrow key.
                animateRegularScroll(e, 'down', 190);
                break;
            case 38: // Up arrow key.
                animateRegularScroll(e, 'up', 190);
                break;
            case 34: // PgDn key.
                animatePageScroll(e, 'down', 190);
                break;
            case 33: // PgUp key.
                animatePageScroll(e, 'up', 190);
                break;
            case 35: // End key.
                animateFullScroll(e, 'down');
                break;
            case 36: // Home key.
                animateFullScroll(e, 'up');
                break;
            case 1: // Primary mouse button.
                if ($(this).hasClass('bottom') || $(this).hasClass('top'))
                    animateRegularScroll(e, $(this).hasClass('bottom') ? 'down' : 'up', 190);
                else if (!$(this).hasClass('frame')) {
                    currentScrollable = this;
                    e.stopPropagation();
                    testFunc();
                }
                break;
            case 2: // Middle mouse button.
                animateMMScroll(e);
                break;
            }
        }
    }

    ///////////////////////////////////////////////////////////
    /// 5. SCROLLING BEHAVIOR WHEN USING THE MOUSE WHEEL.   ///
    ///////////////////////////////////////////////////////////

    // Determines what time of scroll will be done depending on the type of mousewheel movement.
    function filterMW(e) {
        if (!isPressed) {
            if ((e.type == 'mousewheel' && e.originalEvent.wheelDelta / 120 < 1) || // Moving the mouse wheel down.
                (e.type == 'DOMMouseScroll' && e.originalEvent.detail > 0)) // The same but for Firefox.
                animateMWScroll(e, 'down');
            else // Moving the mouse wheel up.
                animateMWScroll(e, 'up');
        } else {
            if ((e.type == 'mousewheel' && e.originalEvent.wheelDelta / 120 < 1) ||
                (e.type == 'DOMMouseScroll' && e.originalEvent.detail > 0))
                animateMWMultipleScroll(e, 'down');
            else
                animateMWMultipleScroll(e, 'up');
        }
    }

    ///////////////////////
    /// 6. DRAGGABLE.   ///
    ///////////////////////

    var isDragged = false, // Flag that checks if the scrollbar is being dragged.
        myDraggable = Draggable.create($('.vscroll .bar'), {
            type: 'top', // This way, the drag is modifying the css property 'top' (with 'y' it would use some kind of translate).
            bounds: $('.vscroll .frame'),
            cursor: 'auto',
            minimumMovement: 0,
            onDrag: function () {
                isDragged = true;
                adjustedRatio = ($scrollable.outerHeight() - $('.bottom').outerHeight() * 2 - barHeight) / ($scrollable[0].scrollHeight - $scrollable.outerHeight());
                $scrollable.scrollTop($(this.target).position().top / adjustedRatio);
            },
            onDragEnd: function (e) {
                isDragged = false;
            }
        });

    $scrollable.on('scroll', function () {
        if (!isDragged) {
            $('.vscroll .bar').css({
                top: $scrollable.scrollTop() * adjustedRatio
            });
        }
    });

    ///////////////////////////////////////////////////////////////////
    /// 7. SCROLLING BEHAVIOR WHEN MOUSING DOWN INSIDE THE FRAME.   ///
    ///////////////////////////////////////////////////////////////////


    // Determines what type of scroll will be done depending on the position of the mouse while mousing down inside the frame.
    function filterFrame(e) {
        if (isPressed || isRunning)
            return;

        if (!calcIsAboveBar(e) && !isPressed) {
            animatePageScroll(e, (e.pageY < $('.vscroll .bar').position().top ? 'up' : 'down'), 190);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// 8. SCROLLING BEHAVIOR WHEN HOLDING DOWN THE MOUSE PRIMARY BUTTON AND LEAVING THE SCROLLABLE ELEMENT.    ///
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var currentScrollable,
        enteredElement;

    function testFunc() {
        $(currentScrollable).on('mouseup', function () {
            $(currentScrollable).off('mouseup');
            $(currentScrollable).off('mouseover');
            $(currentScrollable).off('mouseout');
        });

        /*$(currentScrollable).on('mouseover', function(e) {
            enteredElement = $(e.target);
            console.log('enteredElement at mouseover: ' + enteredElement);
        });*/

        $(currentScrollable).on('mouseout', function (e) {
            /*enteredElement = 'haha';
            abandonedElement = $(e.target);
            console.log('enteredElement at mouseout: ' + enteredElement);*/
            if (isRoot(e.target))
                animateRegularScroll(e, 'down', 190);
        });
    }

    function isRoot(currentElement) {
        if (currentElement == currentScrollable)
            return true;
        else
            return false;
    }

});

// FIXME: Make the AnimateSelectScroll work.
// TODO: Make the scrolling events available only when the scrollable element is on focus so that the keys can be used for their default purpose in some cases (i.e.: when focused on the search input, one might want to use the home and end keys to navigate through the text or select it).
// TODO: Configure the scrolling events for horizontal scrolling.
