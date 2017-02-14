/**
 * Format Google Calendar JSON output into human readable list
 *
 * Copyright 2015, Milan Kacurak
 * For use on County Party site
 */
var formatGoogleCalendar = (function() {

    'use strict';

    //Gets JSON from Google Calendar and transfroms it into html list items and appends it to past or upcoming events list
    var init = function(settings) {
        var result;

        //Get JSON, parse it, transform into list items and append it to past or upcoming events list
        jQuery.getJSON(settings.calendarUrl, function(data) {
            result = data.items;
            result.sort(comp);

            var pastCounter = 0,
                upcomingCounter = 0,
                pastResult = [],
                upcomingResult = [],
                $upcomingElem = jQuery(settings.upcomingSelector),
                $pastElem = jQuery(settings.pastSelector),
                i;

            if (settings.pastTopN === -1) {
                settings.pastTopN = result.length;
            }

            if (settings.upcomingTopN === -1) {
                settings.upcomingTopN = result.length;
            }

            if (settings.past === false) {
                settings.pastTopN = 0;
            }

            if (settings.upcoming === false) {
                settings.upcomingTopN = 0;
            }

            for (i in result) {

                if (isPast(result[i].end.dateTime || result[i].end.date)) {
                    if (pastCounter < settings.pastTopN) {
                       pastResult.push(result[i]);
                       pastCounter++;
                    }
                } else {
                    if (upcomingCounter < settings.upcomingTopN) {
                        upcomingResult.push(result[i]);
                        upcomingCounter++;   
                    }
                }
            }

            upcomingResult;

            for (i in pastResult) {
                $pastElem.append(transformationList(pastResult[i], settings.itemsTagName, settings.format));
            }

            for (i in upcomingResult) {
                $upcomingElem.append(transformationList(upcomingResult[i], settings.itemsTagName, settings.format));
            }

            if ($upcomingElem.children().length !== 0) {
                jQuery(settings.upcomingHeading).insertBefore($upcomingElem);
            }

            if ($pastElem.children().length !== 0) {
                jQuery(settings.pastHeading).insertBefore($pastElem);
            }

        });
    };

    //Compare dates 
    var comp = function(a, b) {
        return new Date(a.start.dateTime || a.start.date).getTime() - new Date(b.start.dateTime || b.start.date).getTime();
    };

    //Overwrites defaultSettings values with overrideSettings and adds overrideSettings if non existent in defaultSettings
    var mergeOptions = function(defaultSettings, overrideSettings){
        var newObject = {},
            i;
        for (i in defaultSettings) {
            newObject[i] = defaultSettings[i]; 
        }
        for (i in overrideSettings) { 
            newObject[i] = overrideSettings[i]; 
        }
        return newObject;
    };

    //Get all necessary data (dates, location, summary, description) and creates a list item
    var transformationList = function(result, tagName, format) {
        var dateStart = getDateInfo(result.start.dateTime || result.start.date),
            dateEnd = getDateInfo(result.end.dateTime || result.end.date),
            dateFormatted = getFormattedDate(dateStart, dateEnd),
            output = '<' + tagName + '>',
            summary = result.summary || '',
            description = result.description || '',
            location = result.location || '',
            i;

        for (i = 0; i < format.length; i++) {

            format[i] = format[i].toString();

            if (format[i] === '*summary*') {
                output = output.concat('<span class="summary" style="font-weight:bold;font-size:22px;color:#002147;">' + summary + '</span>');
            } else if (format[i] === '*date*') {
                output = output.concat('<span class="date" style="font-size:18px;"><b>WHEN: </b>' + dateFormatted + '</span>');
            } else if (format[i] === '*description*') {
                output = output.concat('<span class="description">' + description + '</span>');
            } else if (format[i] === '*location*') {
                output = output.concat('<span class="location" style="font-size:18px;">' + location + '</span>');
            } else {
                if ((format[i + 1] === '*location*' && location !== '') ||
                    (format[i + 1] === '*summary*' && summary !== '') ||
                    (format[i + 1] === '*date*' && dateFormatted !== '') ||
                    (format[i + 1] === '*description*' && description !== '')) {

                    output = output.concat(format[i]);
                }
            }
        }

        return output + '</' + tagName + '>';
    };

    //Check if date is later then now
    var isPast = function(date) {
        var compareDate = new Date(date),
            now = new Date();
            now.setDate(now.getDate() - 1);


        if (now.getTime() > compareDate.getTime()) {
            return true;
        }
        
        return false;
    };

    //Get temp array with information abou day in followin format: [day number, month number, year]
    var getDateInfo = function(date) {
        date = new Date(date);

        return [date.getDate(), date.getMonth(), date.getFullYear(), date.getTime()];

    };


    //Transformations for formatting date into human readable format
    var formatDateSameDay = function(date) {
        //month day, year
        return moment(date[3]).format("llll");
    };

    var formatDateDifferentDay = function(dateStart, dateEnd) {
        //month day-day, year
        return moment(dateStart[3]).format("MMM D") + ' to ' + moment(dateEnd[3]).format("MMM D, YYYY");
    };



    

    //Check differences between dates and format them
    var getFormattedDate = function(dateStart, dateEnd) {
        var formattedDate = '';

        if (dateStart[0] === dateEnd[0]) {
            if (dateStart[1] === dateEnd[1]) {
                if (dateStart[2] === dateEnd[2]) {
                    //month day, year
                    formattedDate = formatDateSameDay(dateStart);
                } 
            } 
        } else {
            if (dateStart[1] === dateEnd[1]) {
                if (dateStart[2] === dateEnd[2]) {
                    //month day-day, year
                    formattedDate = formatDateDifferentDay(dateStart, dateEnd);
                } 
            } 
        }

        return formattedDate;
    };

    return {
        init: function (settingsOverride) {
            var settings = {
                calendarUrl: 'https://www.googleapis.com/calendar/v3/calendars/rkq3n5iq87scuilatmohir9htc@group.calendar.google.com/events?key=AIzaSyBUpTNASZCxgdT9Jmyg8Hi6XEWO4KyRRGc',
                past: true,
                upcoming: true,
                pastTopN: -1,
                upcomingTopN: -1,
                itemsTagName: 'li',
                upcomingSelector: '#events-upcoming',
                pastSelector: '#events-past',
                upcomingHeading: '<h2>Upcoming</h2>',
                pastHeading: '<h2>Past</h2>',
                format: ['*date*', '*summary*', '*description*', '*location*']
            };

            settings = mergeOptions(settings, settingsOverride);

            init(settings);
        }
    };
})();
