;
/**
 * Allow create tables with fixed THead element
 * @Repository:     https://github.com/jeancarlo13/FixedTable
 * @Author:         jeancarlo13
 * @Lisense:        MIT Lisence (https://opensource.org/licenses/MIT)
 */
var fixedTable = fixedTable || (function () {
    'use strict';
    /**
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
    /**
     * Tables marked for fixed head, where each object contains:
     *      {Table}     table:  The table that you want fix the THead
     *      {Element}   parent: The parent element with scroll
     *      {bool}      headIsVisible:   The last visibility state registred    
     */
    var _tables = [],
        /**
         * is realy? Firefox not get real width of elements
         */
        _isFirefox = typeof InstallTrigger !== 'undefined';

    /**
     * Check if the element part is visible into the viewport
     * @param    {DOM element}   element:    Element use for check is is visible
     * @param    {int}           side:       Part of element to check, use _side enumeration
     * @param    {DOM element}   parent:     Element that contains the desired element; use undefined for use the viewport
     * @return   {bool}          True if the element part is visible; False another case 
     */
    function isElementVisibleInViewport(element, side, parent) {
        function between(value, min, max) {
            return value >= min && value <= max;
        }

        var elementPosition = getAbsolutePosition(element),
            viewportPosition = parent ? getAbsolutePosition(parent) : getViewportAbsolutePosition();

        // Element is more small that viewport
        var topVisible = between(elementPosition.top, viewportPosition.top, viewportPosition.buttom),
            rightVisible = between(elementPosition.right, viewportPosition.left, viewportPosition.right),
            buttomVisible = between(elementPosition.buttom, viewportPosition.top, viewportPosition.buttom),
            leftVisible = between(elementPosition.left, viewportPosition.left, viewportPosition.right);

        // Viewport is more small that the element
        var viewportTopVisible = between(viewportPosition.top, elementPosition.top, elementPosition.buttom),
            viewportRightVisible = between(viewportPosition.right, elementPosition.left, elementPosition.right),
            viewportButtomVisible = between(viewportPosition.buttom, elementPosition.top, elementPosition.buttom),
            viewportLeftVisible = between(viewportPosition.left, elementPosition.left, elementPosition.right);

        switch (side) {
            case _sides.all:
                return topVisible && rightVisible && buttomVisible && leftVisible;
            case _sides.Top:
                return topVisible;
            case _sides.Right:
                return rightVisible;
            case _sides.Left:
                return leftVisible;
            case _sides.Any:
                return topVisible || rightVisible || buttomVisible || leftVisible
                    || viewportTopVisible || viewportRightVisible || viewportButtomVisible || viewportLeftVisible;
            case _sides.AnyVerticalPart:
                return topVisible || buttomVisible
                    || viewportTopVisible || viewportButtomVisible;
            default:
                return false;
        }
    }
    /**
     * Return the absolute position of the viewport into the document
     * @return {Object}                  Object with the absolute coordinates          
     */
    function getViewportAbsolutePosition() {
        return getAbsolutePosition(undefined);
    }
    /**
     * Return the absolute position of an element into the document
     * @param {DOM Element}  element:    Element to use for determine your position
     * @return {Object}                  Object with the absolute coordinates, undefined for use viewport          
     */
    function getAbsolutePosition(element) {
        var rect = undefined,
            body = document.body,
            voidElement = element === undefined;

        if (voidElement) {
            // check viewport
            element = document.createElement('div');
            element.style.position = 'fixed';
            element.style.width = '100%';
            element.style.height = '100%';
            body.appendChild(element);
        }

        rect = element.getBoundingClientRect();

        if (voidElement) {
            body.removeChild(element);
        }

        return {
            top: rect.top + body.scrollTop,
            right: rect.left + rect.width + body.scrollLeft,
            buttom: rect.top + body.scrollTop + rect.height,
            left: rect.left + body.scrollLeft
        };
    }
    /**
     * Review the visibility of the table into the parent with scroll
     * @param {Object}  table:    Contains the elements of the table to modify, the properties are:
     *                          {Table}     table:  The table that you want fix the THead
     *                          {Element}   parent: The parent element with scroll
     *                          {bool}      headIsVisible:   The last visibility state registred          
     */
    function reviewScroll(table) {        
        var isVisible = isElementVisibleInViewport(table.parent, _sides.Any, undefined),
            thead = table.table.querySelector('thead');

        if (isVisible) {
            isVisible = isElementVisibleInViewport(table.table, _sides.Top, table.parent);

            if (isVisible != table.headIsVisible || this.type === "resize") {
                isVisible === true ? unSetFixedStyle(thead) : setFixedStyle(table.table, table.modelRowIndex);
                table.headIsVisible = isVisible;
            }
            
            thead.style.top = isVisible === true ? '' : table.parent.getBoundingClientRect().top + 'px';
        } 
        
        if (isVisible != table.parentIsVisible) {
            table.parentIsVisible = isVisible;
        }
    }
    /**
     * Clear the fixed style at the received thead element
     * @param    {thead element} thead:  Thead of html that will clear the fixed style
     */
    function unSetFixedStyle(thead){
        var ths = Array.prototype.slice.call(thead.querySelector('tr').querySelectorAll('th, td'));
        thead.style.position = '';
        ths.forEach(function (th, index) {
            th.style.width = '';
            th.style.minWidth = '';
        })
        thead.style.width = '';
    }
    /**
     * Set the style to thead of the received table in Fixed
     * @param    {Table element} table:  Table of html that will the fixed style
     */
    function setFixedStyle(table, rowIndex) {
        var thead = table.querySelector('thead'),
            tbodys = Array.prototype.slice.call(table.querySelectorAll('tbody')),
            visibleRows = rowIndex <= 1 ? Array.prototype.slice.call(tbodys[0].querySelectorAll('tr')).filter(function(tr) { return tr.style.display !== 'none'; }) : undefined,            
            fromVisibleRows = rowIndex <= 1 && visibleRows.length > 0,
            tds = fromVisibleRows === true 
                ? Array.prototype.slice.call(visibleRows[0].querySelectorAll('th, td'))
                : Array.prototype.slice.call(tbodys[0].querySelector('tr:nth-child(' + rowIndex + ')').querySelectorAll('th, td')),
            ths = Array.prototype.slice.call(thead.querySelector('tr').querySelectorAll('th, td'));
            
        if (fromVisibleRows === true){
            tds.forEach(function (td, index) {
                var th = ths[index]; 
                td.style.width = 
                    (_isFirefox 
                        ? (th.offsetWidth + th.scrollWidth + th.getBoundingClientRect().width) / 3 
                        : th.offsetWidth
                    ) + 'px';
                td.style.minWidth = td.style.width;
            });
        }

        thead.style.position = 'fixed';
        tds.forEach(function (td, index) {
            ths[index].style.width = 
                (_isFirefox 
                    ? (td.offsetWidth + td.scrollWidth + td.getBoundingClientRect().width) / 3 
                    : td.offsetWidth
                ) + 'px';
            ths[index].style.minWidth = ths[index].style.width;
        });
        thead.style.width = table.getBoundingClientRect().width + 'px';
    }
    /**
     * Fix the thead of the desired table if this is not visible
     * @param {DOM element} table:    The table of the you want fix the thead
     * @param {DOM element} parent:   The element that contains to the table and have scroll in y
     * @param {int}          modelRowIndex: Index based-zero of the row of the tbody to use for determinate the cell sizes
     */
    function fixedTable(table, parent, modelRowIndex) {
        var head = table.querySelector('thead'),
            tableObj = {
                table: table,
                parent: parent,
                headIsVisible: isElementVisibleInViewport(table, _sides.Top, parent),
                parentIsVisible: isElementVisibleInViewport(parent, _sides.Any, undefined),
                modelRowIndex: modelRowIndex ? modelRowIndex + 1 : 1
            };

        var elements = Array.prototype.slice.call( tableObj.parent.querySelectorAll('*'));
        elements.forEach(function(e) { e.style.boxSizing = 'border-box'; });
        tableObj.parent.scrollTop = 0;
        tableObj.parent.style.overflowX = 'hidden';
        tableObj.parent.style.paddingRight = '1px';
        tableObj.table.cellPadding = 0;
        tableObj.table.cellSpacing = 0;  
        tableObj.table.style.width = '100%';     

        _tables.push(tableObj);
    }
    /**
     * Add the event listeners to the parent of the table for set the fixed head
     * @param {DOM element}  element:    Element of the DOM to use for add the event listeners
     *        {function}     callback:   Function to call when occurs the event   
     */
    function addEventListeners(element, callback) {
        element.addEventListener('scroll', callback, true);
        element.addEventListener('resize', callback, true);
    }

    /**
     * Fix the thead of the desired table if this is not visible
     * @param {DOM element}  table:      The table of the you want fix the thead
     * @param {string}       maxWidth:   The max width of the container element, sample: 100px, 100%
     * @param {string}       maxHeight:  The max height of the container element, sample: 100px, 100%
     * @param {int}          modelRowIndex: Index based-zero of the row of the tbody to use for determinate the cell sizes
     */
    function fixedTableWithoutContainer(table, maxWidth, maxHeight, modelRowIndex) {
        var parent = document.createElement('div');
        parent.style.width = maxWidth;
        parent.style.height = maxHeight;
        parent.style.overflow = 'auto';
        table.parentNode.insertBefore(parent, table);
        parent.appendChild(table);
        fixedTable(table, parent, modelRowIndex);
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
    addEventListeners(window, function documentListener(e) {
        e.preventDefault();
        _tables.forEach(function (t) { reviewScroll.call(e, t); });
    });
    
    /**
     * Set the features of fixed table at the received table
     * @param    {object}    options:    Configuration to set at the table, where:
     *                               {Table element} table:      Html table to use (requiered)
     *                               {Element}       container:  Html element that contains the table, undefined for create a new container
     *                               {float}         maxWidth:   Max width of the container used when not exist an container for the table
     *                               {float}         maxHeight:  Max height of the container used when not exist an container for the table
     *                               {int}           modelRowIndex: Index based-zero (default = 0) of the row of the tbody to use for determinate the cell sizes, 
     *                                                              the row shuld match with the first row of the thead
     */
    return function (options) {
        var defaultOptions = {
            table: undefined,
            container: undefined,
            maxWidth: '100%',
            maxHeight: '300px',
            modelRowIndex: 0
        };

        var config = merge(defaultOptions, options);

        if (config.table === undefined) {
            throw "Table element not provided";
        } else if (config.container) {
            fixedTable(config.table, config.container, config.modelRowIndex);
        } else {
            fixedTableWithoutContainer(config.table, config.maxWidth, config.maxHeight, config.modelRowIndex);
        }
    };
})();
    
