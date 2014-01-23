function removeChildren(a) { // "a" is reference to an object
    //while (a.hasChildNodes()) a.removeChild(a.lastChild);
}

// quickElement(tagType, parentReference, textInChildNode, [, attribute, attributeValue ...]);
function quickElement() {
    var obj = new Element(arguments[0]);
    if (arguments[2] != '' && arguments[2] != null) {
        var textNode = document.createTextNode(arguments[2]);
        obj.appendChild(textNode);
    }
    var len = arguments.length;
    for (var i = 3; i < len; i += 2) {
        obj.setAttribute(arguments[i], arguments[i+1]);
    }
    arguments[1].appendChild(obj);
    return obj;
}

// Calendar -- A calendar instance
Calendar = new Class({
    initialize: function(callback, default_date) {
        // callback (string) is the name of a JavaScript function that will be
        //     called with the parameters (year, month, day) when a day in the
        //     calendar is clicked
        this.div = new Element('div');
        this.callback = callback;
        this.today = new Date();
        if(default_date){
            this.currentMonth = default_date.month || this.today.getMonth() + 1;
            this.currentYear = default_date.year || this.today.getFullYear();
        }else{
            this.currentMonth = this.today.getMonth() + 1;
            this.currentYear = this.today.getFullYear();
        }
        this.drawCurrent();
    },


    monthsOfYear: ['January', 'February', 'March', 'April', 'May',
        'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    daysOfWeek: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    isLeapYear: function(year) {
        return (((year % 4)==0) && ((year % 100)!=0) || ((year % 400)==0));
    },
    getDaysInMonth: function(month,year) {
        var days;
        if (month==1 || month==3 || month==5 || month==7 || month==8 || month==10 || month==12) {
            days = 31;
        }
        else if (month==4 || month==6 || month==9 || month==11) {
            days = 30;
        }
        else if (month==2 && this.isLeapYear(year)) {
            days = 29;
        }
        else {
            days = 28;
        }
        return days;
    },

    draw: function(month, year, callback) { // month = 1-12, year = 1-9999
        month = parseInt(month);
        year = parseInt(year);
        var calDiv = this.div;

        var calTable = new Element('table', {'class':'js_calendar_main'});
        quickElement('caption', calTable, this.monthsOfYear[month-1] + ' ' + year);
        link_table = new Element('table', {'class': 'js_calendar_advance'});
        var row = link_table.insertRow(0);
        var td = row.insertCell(0);
        new Element('a', {
            'events': {
                'click': this.drawPreviousYear.bind(this)
            }
        }).setText('<<').injectInside(td);
        var td = row.insertCell(1);
        new Element('a', {
            'events': {
                'click': this.drawPreviousMonth.bind(this)
            }
        }).setText('<').injectInside(td);
        var td = row.insertCell(2);
        new Element('a', {
            'events': {
                'click': this.drawNextMonth.bind(this)
            }
        }).setText('>').injectInside(td);
        var td = row.insertCell(3);
        new Element('a', {
            'events': {
                'click': this.drawNextYear.bind(this)
            }
        }).setText('>>').injectInside(td);
        
        calDiv.empty();
        calDiv.adopt(link_table);
        
        var tableBody = quickElement('tbody', calTable);

        // Draw days-of-week header
        var tableRow = quickElement('tr', tableBody);
        for (var i = 0; i < 7; i++) {
            quickElement('th', tableRow, this.daysOfWeek[i]);
        }

        var startingPos = new Date(year, month-1, 1).getDay();
        var days = this.getDaysInMonth(month, year);

        // Draw blanks before first of month
        tableRow = quickElement('tr', tableBody);
        for (var i = 0; i < startingPos; i++) {
            var _cell = quickElement('td', tableRow, ' ');
            _cell.style.backgroundColor = '#f3f3f3';
        }

        // Draw days of month
        var currentDay = 1;
        for (var i = startingPos; currentDay <= days; i++) {
            if (i%7 == 0 && currentDay != 1) {
                tableRow = quickElement('tr', tableBody);
            }
            var cell = quickElement('td', tableRow, '');
            link = new Element("a", {
                'events': {
                    'click':this.callback.pass([year, month, currentDay], this)
                }
            }).setText(currentDay);
            cell.appendChild(link);
            currentDay++;
        }

        // Draw blanks after end of month (optional, but makes for valid code)
        while (tableRow.childNodes.length < 7) {
            var _cell = quickElement('td', tableRow, ' ');
            _cell.style.backgroundColor = '#f3f3f3';
        }
        calDiv.adopt(calTable);
        //alert(calDiv.innerHTML);
        return calDiv;
    },

    getElement: function() {
        return this.div;
    },

    drawCurrent: function() {
        return this.draw(this.currentMonth, this.currentYear, this.div, this.callback);
    },
    drawDate: function(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        this.drawCurrent();
    },
    drawPreviousMonth: function() {
        if (this.currentMonth == 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }
        else {
            this.currentMonth--;
        }
        this.drawCurrent();
    },
    drawNextMonth: function() {
        if (this.currentMonth == 12) {
            this.currentMonth = 1;
            this.currentYear++;
        }
        else {
            this.currentMonth++;
        }
        this.drawCurrent();
    },
    drawPreviousYear: function() {
        this.currentYear--;
        this.drawCurrent();
    },
    drawNextYear: function() {
        this.currentYear++;
        this.drawCurrent();
    }
});

window.addEvent('domready', function() {
    /* grab all the date elements, either select_date_time widgets, select_date widgets or plain date widgets */
    function select_date_time_callback(el, y, m, d){
        el.childNodes[0].value = m,
        el.childNodes[2].value = d,
        el.childNodes[4].value = y,
        ModalDialog.close();
    }
    function select_date_callback(el, y, m, d){
        el.childNodes[0].value = d,
        el.childNodes[2].value = m,
        el.childNodes[4].value = y,
        ModalDialog.close();
    }

    function calendar_link(el, default_date, callback){
         var link = new Element('a', {
            'class': 'js_calendar',
            'events': {
                'click': (function(event) {
                    cal_el = new Calendar(callback, default_date()).getElement();

                	return new ModalDialog({
                		buttons: [
                			['Cancel', Class.empty]
                			],

                        content: cal_el,
                		height: 'auto',
                		width: 200
                	});

                    event.stop();
                }).bindWithEvent()
             }
        });
        var media_url = $('admin_media_url').href;
        link.setHTML('<img src="' + media_url + 'img/admin_calendar.png" alt="Calendar" />');
        link.injectInside(el);
    }

    var elements = $$('.select_date_time_widget');
    elements.each(function(el) {
        var callback = function(y, m, d) {
            select_date_time_callback(el, y, m, d);
        };
        default_date = function(){
            var year = el.childNodes[4].value;
            if(!(year.toString()).match(/\d{4}/))
                year = (new Date()).getFullYear();
            return {
                'day': el.childNodes[2].value,
                'month': el.childNodes[0].value,
                'year': year
            }
        };
        calendar_link(el, default_date, callback);
    });

    var elements = $$('.select_date_widget');
    elements.each(function(el) {
        var callback = function(y, m, d) {
            select_date_callback(el, y, m, d);
        };
        default_date = function(){
            return {
                'day': el.childNodes[0].value,
                'month': el.childNodes[2].value,
                'year': el.childNodes[4].value
            }
        };
        calendar_link(el, default_date, callback);
    });

});
