;
/*
 * Allow create tables with fixed THead element
 * @Repository:     https://github.com/jeancarlo13/FixedTable
 * @Author:         jeancarlo13
 * @Lisense:        MIT Lisence (https://opensource.org/licenses/MIT)
 */
var fixedTable = fixedTable || (function() {
    'use strict';
    /*
     * Represent the sides of an element    
     */
    var _sides = {
        All: 0,
        Top: 1,
        Right: 2,
        Bottom: 3,
        Left: 4,
        Any: 5,
        AnyVerticalPart: 6
    };
    /*
     * Tables marked for fixed head, where each object contains:
     *      {Table}     table:  The table that you want fix the THead
     *      {Element}   parent: The parent element with scroll
     *      {bool}      oldState:   The last visibility state registred    
     */
    var _tables = [];
    /*
     * Check if the client rectangle is visible on screen
     * @param {DOM element} element:    The DOM element you want to know the visibility
     * @param {int|_sides}  side:       The site you want desired know the visibility.
     * @param {DOM element} parent:   The element that contains to the table and have scroll in y    
     */
    function isElementInViewport(element, side, parent) {
        var rect = element.getBoundingClientRect();
        var parentRect = parent.getBoundingClientRect();
        var parentTop = 0 + parentRect.top;

        if (side === _sides.Top) {
            return rect.top >= parentTop;
        } else if (side === _sides.Right) {
            return rect.right <= (parent.innerWidth || parent.clientWidth); //or $(window).width()
        } else if (side === _sides.Bottom) {
            return rect.bottom <= (parent.innerHeight || parent.clientHeight); //or $(window).height() 
        } else if (side === _sides.Left) {
            return rect.left >= 0;
        } else if (side === _sides.Any) {
            return rect.top >= parentTop
                || rect.left >= 0
                || rect.bottom <= (parent.innerHeight || parent.clientHeight) /*or $(window).height() */
                || rect.right <= (parent.innerWidth || parent.clientWidth); /*or $(window).width() */
        } else if (side === _sides.AnyVerticalPart) {
            return rect.bottom >= 0
                || (
                    rect.top >= parentTop
                    && rect.top <= (parent.innerHeight || parent.clientHeight) //or $(window).height()
                );
        } else {
            // console.log('all', { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right});
            return rect.top >= parentTop
                && rect.left >= 0
                && rect.bottom <= (parent.innerHeight || parent.clientHeight) /*or $(window).height() */
                && rect.right <= (parent.innerWidth || parent.clientWidth); /*or $(window).width() */
        }
    }
    /*
     * Review the visibility of the table into the parent with scroll
     * @param {Object}  obj:    Contains the elements of the table to modify, the properties are:
     *                          {Table}     table:  The table that you want fix the THead
     *                          {Element}   parent: The parent element with scroll
     *                          {bool}      oldState:   The last visibility state registred          
     */
    function reviewScroll(obj) {
        var thead = obj.table.querySelector('thead');
        var tbodys = Array.prototype.slice.call(obj.table.querySelectorAll('tbody'));

        var isVisible =
            (
                (
                    isElementInViewport(obj.table, _sides.Top, obj.parent)
                    || !isElementInViewport(obj.table, _sides.AnyVerticalPart, obj.parent)
                )
                && isElementInViewport(thead, _sides.All, obj.parent)
            )
            || obj.parent.scrollTop <= 16
            ;
        var parentTop = obj.parent.getBoundingClientRect().top + 'px';
        if (obj.oldState !== isVisible) {
            thead.style.position = isVisible === true ? '' : 'fixed';
            
            var ths = Array.prototype.slice.call(thead.querySelector('tr').querySelectorAll('th, td'));

            var widths = [];
            if (isVisible !== true) {
                var tds = Array.prototype.slice.call(tbodys[0].querySelector('tr').querySelectorAll('th, td'));
                tds.forEach(function(td, index) {
                     widths.push(td.offsetWidth);
                });
            }
            
            ths.forEach(function(th, index) {
                th.style.width = isVisible === true ? '' : widths[index] + 'px';
            })

            tbodys.forEach(function(body) {
                var tds = Array.prototype.slice.call(body.querySelector('tr').querySelectorAll('th, td'));
                tds.forEach(function(td, index) {
                    td.style.width = isVisible === true ? '' : widths[index] + 'px';
                });
            });

            thead.style.width = isVisible === true ? '' : obj.table.offsetWidth + 'px';
            thead.style.top = isVisible === true ? '' : parentTop;
        } else if (!isVisible && thead.style.top !== parentTop) {
            thead.style.top = parentTop
        }

        obj.oldState = isVisible;
    }
    /*
    * Fix the thead of the desired table if this is not visible
    * @param {DOM element} table:    The table of the you want fix the thead
    * @param {DOM element} parent:   The element that contains to the table and have scroll in y
    */
    function fixedTable(table, parent) {
        var tableObj = {
            table: table,
            parent: parent,
            oldState: true
        };
        _tables.push(tableObj);

        tableObj.parent.addEventListener(
            'scroll',
            function() {
                reviewScroll(tableObj);
            },
            true);

        tableObj.parent.scrollTop = 0;
    }

    /*
    * Fix the thead of the desired table if this is not visible
    * @param {DOM element}  table:      The table of the you want fix the thead
    * @param {string}         maxWidth:   The max width of the container element, sample: 100px, 100%
    * @param {string}         maxHeight:  The max height of the container element, sample: 100px, 100%
    */
    function fixedTableWithoutContainer(table, maxWidth, maxHeight) {
        var parent = document.createElement('div');
        parent.style.width = maxWidth;
        parent.style.height = maxHeight;
        parent.style.overflow = 'auto';
        table.parentNode.insertBefore(parent, table);
        parent.appendChild(table);
        fixedTable(table, parent);
    }
    /**
     * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
     * @param   {object}    obj1
     * @param   {object}    obj2
     * @returns {object}    A new object based on obj1 and obj2
     */
    function merge(obj1, obj2) {
        var obj3 = {};
        for (var attrname in obj1) {
            obj3[attrname] = obj1[attrname];
        }
        for (var attrname in obj2) {
            obj3[attrname] = obj2[attrname];
        }
        return obj3;
    }

    // add an event handler to the document scroll for adjust the position of the fixed THead
    document.addEventListener(
        'scroll',
        function() {
            _tables.forEach(reviewScroll);
        },
        true);

    // return {
    //     simple: fixedTable,
    //     WithoutContainer: fixedTableWithoutContainer
    // };
    return function(options) {
        var config = {
            table: undefined,
            container: undefined,
            maxWidth: '100%',
            maxHeight: '300px'
        };

        config = merge(config, options);

        if (config.table === undefined) {
            throw "Table element not provided";
        } else if (config.container) {
            fixedTable(config.table, config.container);
        } else {
            fixedTableWithoutContainer(config.table, config.maxWidth, config.maxHeight);
        }
    };
})();