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

  function Carousel($elem, opts) {

    // Allow `Carousel` to be called without `new`.
    var self = this;
    if (!(self instanceof Carousel)) {
      return new Carousel($elem, opts);
    }

    // Exit if no items.
    var $items = $(opts.itemSelector, $elem);
    if (!$items || $items.length === 0) {
      return;
    }

    self._opts = opts;

    // Containers.
    var $activeContainer = $(opts.activeSelector, $elem);
    var $disabledContainer = $(opts.disabledSelector, $elem);
    var $navContainer = $(opts.navSelector, $elem);
    var $menuContainer = $(opts.menuSelector, $elem);
    var $contentContainers = map(opts.content, function(contentSpec) {
      return $(contentSpec.containerSelector, $elem);
    });

    // Carousel nav.
    self.$navItems = [
      createElement(opts.navItemClassName + ' ' + opts.navPreviousClassName),
      createElement(opts.navItemClassName + ' ' + opts.navNextClassName)
    ];

    // Carousel items.
    self._items = map($items, function($item) {
      return {
        $menuItem: createElement(opts.menuItemClassName, $(opts.itemMenuSelector, $item).innerHTML),
        $contentItems: map(opts.content, function(contentSpec) {
          return createElement(contentSpec.itemClassName, $(contentSpec.itemSelector, $item).innerHTML);
        })
      }
    });

    var resizeHandler = function() {
      var isActive = window.innerWidth >= opts.minWidth;
      raf(function() {
        $disabledContainer.style.display = isActive ? 'none' : 'block';
        $activeContainer.style.display = isActive ? 'block' : 'none';
      });
    };

    self._currentIndex = -1;

    raf(function() {

      each(self.$navItems, function($navItem, i) {
        $navContainer.appendChild($navItem);
        $navItem.addEventListener('click', function() {
          self[i === 0 ? 'previous' : 'next']();
        });
      });

      each(self._items, function(carouselItem, i) {
        $menuContainer.appendChild(carouselItem.$menuItem);
        each(carouselItem.$contentItems, function($contentItem, i) {
          $contentContainers[i].appendChild($contentItem);
        });
        carouselItem.$menuItem.addEventListener('click', function() {
          self.goto(i);
        });
      });

      self.goto(opts.initialIndex);

      window.addEventListener('resize', resizeHandler);
      resizeHandler();

    });

  }

  Carousel.prototype = {

    _setItem: function(index, isVisible) {
      var self = this;
      var classListMethod = isVisible ? 'add' : 'remove';
      self._items[index].$menuItem.classList[classListMethod](self._opts.menuActiveItemClassName);
      each(self._items[index].$contentItems, function($contentItem, i) {
        $contentItem.classList[classListMethod](self._opts.content[i].activeItemClassName);
      });
    },

    _setNav: function(index, isDisabled) {
      var classListMethod = isDisabled ? 'add' : 'remove';
      this.$navItems[index].classList[classListMethod](this._opts.navDisabledItemClassName);
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

    goto: function(i) {
      var self = this;
      var len = self._items.length;
      if (i === self._currentIndex || i < 0 || i >= len) {
        return;
      }
      if (self._currentIndex !== -1) {
        self._setItem(self._currentIndex, false);
      }
      // FIXME: Simplify the below logic!
      self._setItem(i, true);
      if (len === 1) {
        self._setNav(0, true);
        self._setNav(1, true);
      } else {
        if (i === 0) {
          self._setNav(0, true);
          self._setNav(1, false);
        } else if (i === self._items.length - 1) {
          self._setNav(0, false);
          self._setNav(1, true);
        } else {
          self._setNav(0, false);
          self._setNav(1, false);
        }
      }
      self._currentIndex = i;
    }

  };

  if (typeof module == 'object') {
    module.exports = Carousel;
  } else {
    window.carousel = Carousel;
  }

})();
