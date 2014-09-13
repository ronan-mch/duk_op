var activeFilters = [];
var categoryHash;

$(document).ready(function() {
    hideEventDetails();
    $('span.event-topbar_js').click(toggleContent);
    $('a.filter-link').click(filterCategory);
    //we need to handle the click on the ul level,
    // because the li elements aren't generated  yet
    $('.show-long-description_js').click(toggleLongDescription);
    $('a[data-target]').on("ajax:success", showAjaxResponse);
    $('[data-toggle="popover"]').popover();
    createCategoryHash();
    $('.combobox').combobox();
    $('.combobox').click(function(){
        $(this).siblings('.dropdown-toggle').click();
    });
    $('input.category-combobox').keyup(function(){
       var numSuggestions = $('ul.typeahead li').length;
       var menuHidden = $('.event_categories ul.typeahead').is(':hidden');
       if (numSuggestions == 1 && menuHidden) {
           var create_link = 'No suggestions left; create category ' + $(this).val() + ' instead?';
           $('#new-category-box').text(create_link);
           $('#new-category-box').removeClass('hidden');
       }

    });
    $('.category-combobox').change(function(){
        addToTarget('selected-categories', this.value);
         $(this).val('');
    });

});

/**
 * Build a hash of categories with their ids as
 * keys and their names as values.
 */
function createCategoryHash(){
    categoryHash = {};
    $('select#event-category-dummy option').map(function() {
        categoryHash[$(this).val()] = $(this).text();
    });
}

/**
 * Append the selected value to the correct target.
 * Ensure that the value is not already present and that
 * it is not an array or a number.
 * @param target
 * @param val
 */
function addToTarget(target, val) {
    if (val in categoryHash) {
        var data_target = $('[data-role="' + target + '"]');
        data_target.append('<span class="label label-primary">' + categoryHash[val] + '</span> ');
        // we put the numbers in a specially created input
        // to enable multiple values
        // and clear the default one to prevent duplicates
        data_target.append('<input name="event[category_ids][]" ' +
            'class="hidden" value="' + val + '"/>');
        $('#event-category-dummy').val('')
     }


}

/**
 *  Because of a jQuery bug, we need to inform
 *  jQuery of the event-detail's height so that
 *  the slideToggle doesn't "jump".
 *  See https://coderwall.com/p/r855xw for details.
 */
function hideEventDetails() {
    $('.event-details').each(function(){
        $height = $(this).height();
        $(this).css('height', $height);
        $(this).hide();
    })
}

/**
 * Upon completing an AJAX request
 * show the result in an element based
 * on the calling object's data-target attribute
 * @param event
 * @param xhr
 */
function showAjaxResponse(event, xhr){
    //target div has id equal to the clicked link's data target attr
    var target = $('#' + $(this).attr('data-target'));
    target.html(xhr);
    $(this).parents('div.comment-container_js').hide();
    target.removeClass('hidden');
}

/**
 * When a user clicks on a filter-link
 * hide all events that do not have that category
 * and show filter as active in DOM
 * @returns {boolean}
 */
function filterCategory(){
    var filter = $(this).attr('data-toggle');
    if (activeFilters.indexOf(filter) == -1) {
        activeFilters.push(filter);
    } else if ($(this).hasClass('active')){
        activeFilters.remove(filter);
    }
    refreshFilterView();
    evaluateShown();
    return false;
}

function evaluateShown(){
    /**
     * if there is at least one active filter
     * hide all events that do not have a category matching our filters
     * else show all events
     */
    function evaluateEventVisibility() {
        var events = $('[data-role="event"]');

        if (activeFilters.length == 0) {
            events.show();
            $('[data-role="day"]').show();
        } else {
            events.each(function (i) {
                var attributes = $(this).attr('data-toggle').split(' ');
                var parentId = '#' + $(this).attr('data-parent');
                if ($(this).is(':hidden')) {
                    if (attributesMatchFilters(attributes)) {
                        $(this).show();
                        $(parentId).show();
                    }
                } else if ($(this).is(':visible')) {
                    if (!attributesMatchFilters(attributes)) {
                        $(this).hide();
                    }
                }
            });
        }
    }

    /**
     * If a date has no visible child events, hide it
     * Otherwise, show it.
     */
    function evaluateDateVisibility() {
        $('[data-role="day"]').each(function (i) {
            var childEvents = $(this).find('[data-role="event"]');
            var numVisible = numVisibleChildEvents(childEvents);
            if (numVisible > 0) {
                $(this).show();
                // update the number contained within the header
                $(this).find('[data-role="day-event-count"]').text('(' + numVisible + ')');
            } else {
                $(this).hide();
            }
        });
    }

    evaluateEventVisibility();
    evaluateDateVisibility();
}

/**
 * Search all given events and returns
 * the number that are visible.
 * @param childEvents
 * @returns {Integer}
 */
function numVisibleChildEvents(childEvents) {
    var visible = 0;
    $(childEvents).each(function(i) {
        if ($(this).is(':visible')) {
            visible += 1;
            //return false; //return false to break out of the each loop
        }
    });
    return visible;
}

/**
 * This function checks if an event
 * has any of the specified categories
 *
 * @param eventCategories
 * @returns {boolean}
 */
function attributesMatchFilters(eventCategories) {
    for (var i = 0; i < activeFilters.length; i++) {
        if (eventCategories.indexOf(activeFilters[i]) >= 0) {
            return true;
        }
    }
    return false;
}

/**
* Given a change in filter state
* Run through the list of active filters
* and insert html elements to represent them.
*/
function updateActiveFilters(){
    refreshFilterView();
    var filterHTML = '';
    for (var i = 0; i < activeFilters.length; i++) {
        var filterName = activeFilters[i];
        var removeLink = ' <a href="" class="remove-filter" data-toggle="' + filterName + '"> [X] </a>';
        filterHTML += '<li>' + filterName.titleize() + removeLink + '</li>';
    }
    $('ul.active-filters_js').html(filterHTML);
}
/**
 * Given a change in filter state
 * add or remove active class from filters
 * to change display of active filters in the view.
 */
function refreshFilterView(){
    $('a.filter-link').each(function(){
        var filter = $(this).attr('data-toggle');
        if (activeFilters.indexOf(filter) >= 0) {
            $(this).addClass('active');
        } else if ($(this).hasClass('active')) {
            $(this).removeClass('active')
        }
    })
}

/**
 *   If this container's details div is exposed, hide it
 *   otherwise, hide any exposed details div and show the
 *   current container's details div.
 */
function toggleContent() {
    if  ($(this).siblings('.event-details').hasClass('revealed')) {
        $(this).siblings('.event-details').removeClass('revealed').slideToggle('fast');
    } else {
        $('.revealed').removeClass('revealed').slideToggle();
        $(this).siblings('.event-details').addClass('revealed').slideToggle('fast');
    }
}


function toggleLongDescription() {
    $(this).hide();
    $(this).siblings('.long-description').slideToggle();
    return false;
}