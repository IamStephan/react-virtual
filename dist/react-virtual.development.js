(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = global || self, factory(global.ReactQuery = {}, global.React));
}(this, (function (exports, React) { 'use strict';

  React = React && Object.prototype.hasOwnProperty.call(React, 'default') ? React['default'] : React;

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  var props = ['bottom', 'height', 'left', 'right', 'top', 'width'];

  var rectChanged = function rectChanged(a, b) {
    if (a === void 0) {
      a = {};
    }

    if (b === void 0) {
      b = {};
    }

    return props.some(function (prop) {
      return a[prop] !== b[prop];
    });
  };

  var observedNodes = /*#__PURE__*/new Map();
  var rafId;

  var run = function run() {
    var changedStates = [];
    observedNodes.forEach(function (state, node) {
      var newRect = node.getBoundingClientRect();

      if (rectChanged(newRect, state.rect)) {
        state.rect = newRect;
        changedStates.push(state);
      }
    });
    changedStates.forEach(function (state) {
      state.callbacks.forEach(function (cb) {
        return cb(state.rect);
      });
    });
    rafId = window.requestAnimationFrame(run);
  };

  function observeRect(node, cb) {
    return {
      observe: function observe() {
        var wasEmpty = observedNodes.size === 0;

        if (observedNodes.has(node)) {
          observedNodes.get(node).callbacks.push(cb);
        } else {
          observedNodes.set(node, {
            rect: undefined,
            hasRectChanged: false,
            callbacks: [cb]
          });
        }

        if (wasEmpty) run();
      },
      unobserve: function unobserve() {
        var state = observedNodes.get(node);

        if (state) {
          // Remove the callback
          var index = state.callbacks.indexOf(cb);
          if (index >= 0) state.callbacks.splice(index, 1); // Remove the node reference

          if (!state.callbacks.length) observedNodes["delete"](node); // Stop the loop

          if (!observedNodes.size) cancelAnimationFrame(rafId);
        }
      }
    };
  }

  var useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

  function useRect(nodeRef) {
    var _React$useState = React.useState(nodeRef.current),
        element = _React$useState[0],
        setElement = _React$useState[1];

    var _React$useReducer = React.useReducer(rectReducer, null),
        rect = _React$useReducer[0],
        dispatch = _React$useReducer[1];

    var initialRectSet = React.useRef(false);
    useIsomorphicLayoutEffect(function () {
      if (nodeRef.current !== element) {
        setElement(nodeRef.current);
      }
    });
    useIsomorphicLayoutEffect(function () {
      if (element && !initialRectSet.current) {
        initialRectSet.current = true;

        var _rect = element.getBoundingClientRect();

        dispatch({
          rect: _rect
        });
      }
    }, [element]);
    React.useEffect(function () {
      if (!element) {
        return;
      }

      var observer = observeRect(element, function (rect) {
        dispatch({
          rect: rect
        });
      });
      observer.observe();
      return function () {
        observer.unobserve();
      };
    }, [element]);
    return rect;
  }

  function rectReducer(state, action) {
    var rect = action.rect;

    if (!state || state.height !== rect.height || state.width !== rect.width) {
      return rect;
    }

    return state;
  }

  var defaultEstimateSize = function defaultEstimateSize() {
    return 50;
  };

  function useVirtual(_ref) {
    var _ref3, _measurements;

    var _ref$size = _ref.size,
        size = _ref$size === void 0 ? 0 : _ref$size,
        _ref$estimateSize = _ref.estimateSize,
        estimateSize = _ref$estimateSize === void 0 ? defaultEstimateSize : _ref$estimateSize,
        _ref$overscan = _ref.overscan,
        overscan = _ref$overscan === void 0 ? 0 : _ref$overscan,
        _ref$paddingStart = _ref.paddingStart,
        paddingStart = _ref$paddingStart === void 0 ? 0 : _ref$paddingStart,
        _ref$paddingEnd = _ref.paddingEnd,
        paddingEnd = _ref$paddingEnd === void 0 ? 0 : _ref$paddingEnd,
        parentRef = _ref.parentRef,
        horizontal = _ref.horizontal,
        scrollToFn = _ref.scrollToFn,
        useObserver = _ref.useObserver,
        onScrollElement = _ref.onScrollElement,
        scrollOffsetFn = _ref.scrollOffsetFn;
    var sizeKey = horizontal ? 'width' : 'height';
    var scrollKey = horizontal ? 'scrollLeft' : 'scrollTop';
    var latestRef = React.useRef({});
    var useMeasureParent = useObserver || useRect;

    var _ref2 = useMeasureParent(parentRef) || (_ref3 = {}, _ref3[sizeKey] = 0, _ref3),
        outerSize = _ref2[sizeKey];

    var defaultScrollToFn = React.useCallback(function (offset) {
      if (parentRef.current) {
        parentRef.current[scrollKey] = offset;
      }
    }, [parentRef, scrollKey]);
    var resolvedScrollToFn = scrollToFn || defaultScrollToFn;
    scrollToFn = React.useCallback(function (offset) {
      resolvedScrollToFn(offset, defaultScrollToFn);
    }, [defaultScrollToFn, resolvedScrollToFn]);

    var _React$useState = React.useState({}),
        measuredCache = _React$useState[0],
        setMeasuredCache = _React$useState[1];

    var measurements = React.useMemo(function () {
      var measurements = [];

      for (var i = 0; i < size; i++) {
        var measuredSize = measuredCache[i];
        var start = measurements[i - 1] ? measurements[i - 1].end : paddingStart;

        var _size = typeof measuredSize === 'number' ? measuredSize : estimateSize(i);

        var end = start + _size;
        measurements[i] = {
          index: i,
          start: start,
          size: _size,
          end: end
        };
      }

      return measurements;
    }, [estimateSize, measuredCache, paddingStart, size]);
    var totalSize = (((_measurements = measurements[size - 1]) == null ? void 0 : _measurements.end) || 0) + paddingEnd;
    Object.assign(latestRef.current, {
      overscan: overscan,
      measurements: measurements,
      outerSize: outerSize,
      totalSize: totalSize
    });

    var _React$useState2 = React.useState({
      start: 0,
      end: 0
    }),
        range = _React$useState2[0],
        setRange = _React$useState2[1];

    var element = onScrollElement ? onScrollElement.current : parentRef.current;
    useIsomorphicLayoutEffect(function () {
      if (!element) {
        return;
      }

      var onScroll = function onScroll() {
        var scrollOffset = scrollOffsetFn ? scrollOffsetFn() : element[scrollKey];
        latestRef.current.scrollOffset = scrollOffset;
        setRange(function (prevRange) {
          return calculateRange(latestRef.current, prevRange);
        });
      }; // Determine initially visible range


      onScroll();
      element.addEventListener('scroll', onScroll, {
        capture: false,
        passive: true
      });
      return function () {
        element.removeEventListener('scroll', onScroll);
      };
    }, [element, scrollKey, size
    /* required */
    , outerSize
    /* required */
    ]);
    var virtualItems = React.useMemo(function () {
      var virtualItems = [];
      var end = Math.min(range.end, measurements.length - 1);

      var _loop = function _loop(i) {
        var measurement = measurements[i];

        var item = _extends(_extends({}, measurement), {}, {
          measureRef: function measureRef(el) {
            var scrollOffset = latestRef.current.scrollOffset;

            if (el) {
              var _el$getBoundingClient = el.getBoundingClientRect(),
                  measuredSize = _el$getBoundingClient[sizeKey];

              if (measuredSize !== item.size) {
                if (item.start < scrollOffset) {
                  defaultScrollToFn(scrollOffset + (measuredSize - item.size));
                }

                setMeasuredCache(function (old) {
                  var _extends2;

                  return _extends(_extends({}, old), {}, (_extends2 = {}, _extends2[i] = measuredSize, _extends2));
                });
              }
            }
          }
        });

        virtualItems.push(item);
      };

      for (var i = range.start; i <= end; i++) {
        _loop(i);
      }

      return virtualItems;
    }, [range.start, range.end, measurements, sizeKey, defaultScrollToFn]);
    var mountedRef = React.useRef();
    useIsomorphicLayoutEffect(function () {
      if (mountedRef.current) {
        if (estimateSize || size) setMeasuredCache({});
      }

      mountedRef.current = true;
    }, [estimateSize, size]);
    var scrollToOffset = React.useCallback(function (toOffset, _temp) {
      var _ref4 = _temp === void 0 ? {} : _temp,
          _ref4$align = _ref4.align,
          align = _ref4$align === void 0 ? 'start' : _ref4$align;

      var _latestRef$current = latestRef.current,
          scrollOffset = _latestRef$current.scrollOffset,
          outerSize = _latestRef$current.outerSize;

      if (align === 'auto') {
        if (toOffset <= scrollOffset) {
          align = 'start';
        } else if (scrollOffset >= scrollOffset + outerSize) {
          align = 'end';
        } else {
          align = 'start';
        }
      }

      if (align === 'start') {
        scrollToFn(toOffset);
      } else if (align === 'end') {
        scrollToFn(toOffset - outerSize);
      } else if (align === 'center') {
        scrollToFn(toOffset - outerSize / 2);
      }
    }, [scrollToFn]);
    var tryScrollToIndex = React.useCallback(function (index, _temp2) {
      var _ref5 = _temp2 === void 0 ? {} : _temp2,
          _ref5$align = _ref5.align,
          align = _ref5$align === void 0 ? 'auto' : _ref5$align,
          rest = _objectWithoutPropertiesLoose(_ref5, ["align"]);

      var _latestRef$current2 = latestRef.current,
          measurements = _latestRef$current2.measurements,
          scrollOffset = _latestRef$current2.scrollOffset,
          outerSize = _latestRef$current2.outerSize;
      var measurement = measurements[Math.max(0, Math.min(index, size - 1))];

      if (!measurement) {
        return;
      }

      if (align === 'auto') {
        if (measurement.end >= scrollOffset + outerSize) {
          align = 'end';
        } else if (measurement.start <= scrollOffset) {
          align = 'start';
        } else {
          return;
        }
      }

      var toOffset = align === 'center' ? measurement.start + measurement.size / 2 : align === 'end' ? measurement.end : measurement.start;
      scrollToOffset(toOffset, _extends({
        align: align
      }, rest));
    }, [scrollToOffset, size]);
    var scrollToIndex = React.useCallback(function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // We do a double request here because of
      // dynamic sizes which can cause offset shift
      // and end up in the wrong spot. Unfortunately,
      // we can't know about those dynamic sizes until
      // we try and render them. So double down!
      tryScrollToIndex.apply(void 0, args);
      requestAnimationFrame(function () {
        tryScrollToIndex.apply(void 0, args);
      });
    }, [tryScrollToIndex]);
    return {
      virtualItems: virtualItems,
      totalSize: totalSize,
      scrollToOffset: scrollToOffset,
      scrollToIndex: scrollToIndex
    };
  }

  function calculateRange(_ref6, prevRange) {
    var overscan = _ref6.overscan,
        measurements = _ref6.measurements,
        outerSize = _ref6.outerSize,
        scrollOffset = _ref6.scrollOffset;
    var total = measurements.length;
    var start = total - 1;

    while (start > 0 && measurements[start].end >= scrollOffset) {
      start -= 1;
    }

    var end = 0;

    while (end < total - 1 && measurements[end].start <= scrollOffset + outerSize) {
      end += 1;
    } // Always add at least one overscan item, so focus will work


    start = Math.max(start - overscan, 0);
    end = Math.min(end + overscan, total - 1);

    if (!prevRange || Math.abs(start - prevRange.start) > overscan - 1 || Math.abs(end - prevRange.end) > overscan - 1) {
      return {
        start: start,
        end: end
      };
    }

    return prevRange;
  }

  exports.useVirtual = useVirtual;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=react-virtual.development.js.map
