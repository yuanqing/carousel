(function() {

  'use strict';

  var raf = window.requestAnimationFrame;

  function each(arr, fn) {
    var i = -1;
    var len = arr.length;
    while (++i < len) {
      fn(arr[i], i);
    }
  }

  function map(arr, fn) {
    var result = [];
    each(arr, function(item, i) {
      result.push(fn(item, i));
    });
    return result;
  }

  function $(selector, context) {
    var result = [].slice.call((context || document).querySelectorAll(selector));
    return result && result.length === 1 ? result[0] : result;
  }

  function createElement(className, innerHTML) {
    var elem = document.createElement('div');
    elem.innerHTML = innerHTML || '';
    if (className) {
      elem.className = className;
    }
    return elem;
  }

  function Carousel(elem, opts) {

    // Allow `Carousel` to be called without `new`.
    var self = this;
    if (!(self instanceof Carousel)) {
      return new Carousel(elem, opts);
    }

    // Exit if no items.
    var items = $(opts.itemSelector, elem);
    if (!items || items.length === 0) {
      return;
    }

    self._opts = opts;
    self._currentIndex = -1;

    var activeContainer = $(opts.activeSelector, elem);
    var disabledContainer = $(opts.disabledSelector, elem);
    function resizeHandler() {
      var isActive = window.innerWidth >= opts.minWidth;
      raf(function() {
        disabledContainer.style.display = isActive ? 'none' : 'block';
        activeContainer.style.display = isActive ? 'block' : 'none';
      });
    }
    raf(function() {
      window.addEventListener('resize', resizeHandler);
      resizeHandler();
    });

    // `_navElems`
    var navContainer = $(opts.navSelector, elem);
    raf(function() {
      self._navElems = [
        createElement(opts.navItemClassName + ' ' + opts.navPreviousClassName),
        createElement(opts.navItemClassName + ' ' + opts.navNextClassName)
      ];
      each(self._navElems, function(navElem, i) {
        navContainer.appendChild(navElem);
        navElem.addEventListener('click', function() {
          self[i === 0 ? 'previous' : 'next']();
        });
      });
    });

    // `_items`
    var menuContainer = $(opts.menuSelector, elem);
    var contentContainers = map(opts.content, function(contentSpec) {
      return $(contentSpec.containerSelector, elem);
    });
    raf(function() {
      self._items = map(items, function(item) {
        return {
          menuElem: createElement(opts.menuItemClassName, $(opts.itemMenuSelector, item).innerHTML),
          contentElems: map(opts.content, function(contentSpec) {
            return createElement(contentSpec.itemClassName, $(contentSpec.itemSelector, item).innerHTML);
          })
        }
      });
      each(self._items, function(item, i) {
        each(item.contentElems, function(contentElem, i) {
          contentContainers[i].appendChild(contentElem);
        });
        menuContainer.appendChild(item.menuElem);
        item.menuElem.addEventListener('click', function() {
          self.goto(i);
        });
      });
      self.goto(opts.initialIndex);
    });

  }

  Carousel.prototype = {

    _showItem: function(index, isVisible) {
      var self = this;
      var classListMethod = isVisible ? 'add' : 'remove';
      self._items[index].menuElem.classList[classListMethod](self._opts.menuActiveItemClassName);
      each(self._items[index].contentElems, function(contentElem, i) {
        contentElem.classList[classListMethod](self._opts.content[i].activeItemClassName);
      });
    },

    _disableNav: function(index, isDisabled) {
      this._navElems[index].classList[isDisabled ? 'add' : 'remove'](this._opts.navDisabledItemClassName);
    },

    getCurrentIndex: function() {
      return this._currentIndex;
    },

    previous: function() {
      this.goto(this._currentIndex - 1);
    },

    next: function() {
      this.goto(this._currentIndex + 1);
    },

    goto: function(index) {
      var self = this;
      var len = self._items.length;
      if (index === self._currentIndex || index < 0 || index >= len) {
        return;
      }
      if (self._currentIndex !== -1) {
        self._showItem(self._currentIndex, false);
      }
      self._showItem(index, true);
      self._disableNav(0, len === 1 || index === 0);
      self._disableNav(1, len === 1 || index === self._items.length - 1);
      self._currentIndex = index;
    }

  };

  if (typeof module == 'object') {
    module.exports = Carousel;
  } else {
    window.carousel = Carousel;
  }

})();
