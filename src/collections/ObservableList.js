import { Symbol } from '@riim/symbol-polyfill';
import { is } from '@riim/is';
import { mixin } from '@riim/mixin';
import { EventEmitter } from '../EventEmitter';
import { FreezableCollectionMixin } from './FreezableCollectionMixin';
import { ObservableCollectionMixin } from './ObservableCollectionMixin';

var push = Array.prototype.push;
var splice = Array.prototype.splice;

/**
 * @typesign (a, b) -> -1 | 1 | 0;
 */
function defaultComparator(a, b) {
	return a < b ? -1 : (a > b ? 1 : 0);
}

/**
 * @class cellx.ObservableList
 * @extends {cellx.EventEmitter}
 * @implements {cellx.FreezableCollectionMixin}
 * @implements {cellx.ObservableCollectionMixin}
 *
 * @typesign new ObservableList(items?: Array | cellx.ObservableList, opts?: {
 *     adoptsValueChanges?: boolean,
 *     comparator?: (a, b) -> int,
 *     sorted?: boolean
 * });
 * @typesign new ObservableList(items?: Array | cellx.ObservableList, adoptsValueChanges?: boolean);
 */
export function ObservableList(items, opts) {
	EventEmitter.call(this);
	FreezableCollectionMixin.call(this);
	ObservableCollectionMixin.call(this);

	if (typeof opts == 'boolean') {
		opts = { adoptsValueChanges: opts };
	}

	this._items = [];

	this.length = 0;

	/**
	 * @type {boolean}
	 */
	this.adoptsValueChanges = !!(opts && opts.adoptsValueChanges);

	/**
	 * @type {?(a, b) -> int}
	 */
	this.comparator = null;

	this.sorted = false;

	if (opts && (opts.sorted || opts.comparator && opts.sorted !== false)) {
		this.comparator = opts.comparator || defaultComparator;
		this.sorted = true;
	}

	if (items) {
		this._addRange(items);
	}
}

ObservableList.prototype = mixin({ __proto__: EventEmitter.prototype }, [
		FreezableCollectionMixin.prototype,
		ObservableCollectionMixin.prototype, {
	constructor: ObservableList,

	/**
	 * @typesign (value) -> boolean;
	 */
	contains: function contains(value) {
		return this._valueCounts.has(value);
	},

	/**
	 * @typesign (value, fromIndex?: int) -> int;
	 */
	indexOf: function indexOf(value, fromIndex) {
		return this._items.indexOf(value, this._validateIndex(fromIndex, true));
	},

	/**
	 * @typesign (value, fromIndex?: int) -> int;
	 */
	lastIndexOf: function lastIndexOf(value, fromIndex) {
		return this._items.lastIndexOf(value, fromIndex === undefined ? -1 : this._validateIndex(fromIndex, true));
	},

	/**
	 * @typesign (index: int) -> *;
	 */
	get: function get(index) {
		return this._items[this._validateIndex(index, true)];
	},

	/**
	 * @typesign (index: int, count?: uint) -> Array;
	 */
	getRange: function getRange(index, count) {
		index = this._validateIndex(index, true);

		var items = this._items;

		if (count === undefined) {
			return items.slice(index);
		}

		if (index + count > items.length) {
			throw new RangeError('Sum of "index" and "count" out of valid range');
		}

		return items.slice(index, index + count);
	},

	/**
	 * @typesign (index: int, value) -> this;
	 */
	set: function set(index, value) {
		if (this.sorted) {
			throw new TypeError('Cannot set to sorted list');
		}

		index = this._validateIndex(index, true);

		var items = this._items;

		if (is(value, items[index])) {
			return this;
		}

		this._throwIfFrozen();

		this._unregisterValue(items[index]);
		this._registerValue(value);
		items[index] = value;

		this.emit('change');

		return this;
	},

	/**
	 * @typesign (index: int, values: Array | cellx.ObservableList) -> this;
	 */
	setRange: function setRange(index, values) {
		if (this.sorted) {
			throw new TypeError('Cannot set to sorted list');
		}

		index = this._validateIndex(index, true);

		var valueCount = values.length;

		if (!valueCount) {
			return this;
		}

		if (index + valueCount > this.length) {
			throw new RangeError('Sum of "index" and "values.length" out of valid range');
		}

		if (values instanceof ObservableList) {
			values = values._items.slice();
		}

		var items = this._items;
		var changed = false;

		for (var i = index + valueCount; i > index; ) {
			var value = values[--i - index];

			if (!is(value, items[i])) {
				if (!changed) {
					this._throwIfFrozen();
				}

				this._unregisterValue(items[i]);
				this._registerValue(value);
				items[i] = value;
				changed = true;
			}
		}

		if (changed) {
			this.emit('change');
		}

		return this;
	},

	/**
	 * @typesign (value) -> this;
	 */
	add: function add(value) {
		this._throwIfFrozen();

		if (this.sorted) {
			this._insertSortedValue(value);
		} else {
			this._registerValue(value);
			this._items.push(value);
		}

		this.length++;

		this.emit('change');

		return this;
	},

	/**
	 * @typesign (values: Array | cellx.ObservableList) -> this;
	 */
	addRange: function addRange(values) {
		if (values.length) {
			this._throwIfFrozen();

			this._addRange(values);
			this.emit('change');
		}

		return this;
	},

	/**
	 * @typesign (values: Array | cellx.ObservableList);
	 */
	_addRange: function _addRange(values) {
		if (values instanceof ObservableList) {
			values = values._items.slice();
		}

		if (this.sorted) {
			for (var i = 0, l = values.length; i < l; i++) {
				this._insertSortedValue(values[i]);
			}

			this.length += values.length;
		} else {
			for (var i = values.length; i; ) {
				this._registerValue(values[--i]);
			}

			this.length = push.apply(this._items, values);
		}
	},

	/**
	 * @typesign (index: int, value) -> this;
	 */
	insert: function insert(index, value) {
		if (this.sorted) {
			throw new TypeError('Cannot insert to sorted list');
		}

		index = this._validateIndex(index, true);

		this._throwIfFrozen();

		this._registerValue(value);
		this._items.splice(index, 0, value);
		this.length++;

		this.emit('change');

		return this;
	},

	/**
	 * @typesign (index: int, values: Array | cellx.ObservableList) -> this;
	 */
	insertRange: function insertRange(index, values) {
		if (this.sorted) {
			throw new TypeError('Cannot insert to sorted list');
		}

		index = this._validateIndex(index, true);

		var valueCount = values.length;

		if (!valueCount) {
			return this;
		}

		this._throwIfFrozen();

		if (values instanceof ObservableList) {
			values = values._items;
		}

		for (var i = valueCount; i; ) {
			this._registerValue(values[--i]);
		}

		splice.apply(this._items, [index, 0].concat(values));
		this.length += valueCount;

		this.emit('change');

		return this;
	},

	/**
	 * @typesign (value, fromIndex?: int) -> boolean;
	 */
	remove: function remove(value, fromIndex) {
		var index = this._items.indexOf(value, this._validateIndex(fromIndex, true));

		if (index == -1) {
			return false;
		}

		this._throwIfFrozen();

		this._unregisterValue(value);
		this._items.splice(index, 1);
		this.length--;

		this.emit('change');

		return true;
	},

	/**
	 * @typesign (value, fromIndex?: int) -> boolean;
	 */
	removeAll: function removeAll(value, fromIndex) {
		var index = this._validateIndex(fromIndex, true);
		var items = this._items;
		var changed = false;

		while ((index = items.indexOf(value, index)) != -1) {
			if (!changed) {
				this._throwIfFrozen();
			}

			this._unregisterValue(value);
			items.splice(index, 1);
			changed = true;
		}

		if (changed) {
			this.length = items.length;
			this.emit('change');
		}

		return changed;
	},

	/**
	 * @typesign (values: Array | cellx.ObservableList, fromIndex?: int) -> boolean;
	 */
	removeEach: function removeEach(values, fromIndex) {
		fromIndex = this._validateIndex(fromIndex, true);

		if (values instanceof ObservableList) {
			values = values._items.slice();
		}

		var items = this._items;
		var changed = false;

		for (var i = 0, l = values.length; i < l; i++) {
			var value = values[i];
			var index = items.indexOf(value, fromIndex);

			if (index != -1) {
				if (!changed) {
					this._throwIfFrozen();
				}

				this._unregisterValue(value);
				items.splice(index, 1);
				changed = true;
			}
		}

		if (changed) {
			this.length = items.length;
			this.emit('change');
		}

		return changed;
	},

	/**
	 * @typesign (values: Array | cellx.ObservableList, fromIndex?: int) -> boolean;
	 */
	removeAllEach: function removeAllEach(values, fromIndex) {
		fromIndex = this._validateIndex(fromIndex, true);

		if (values instanceof ObservableList) {
			values = values._items.slice();
		}

		var items = this._items;
		var changed = false;

		for (var i = 0, l = values.length; i < l; i++) {
			var value = values[i];

			for (var index = fromIndex; (index = items.indexOf(value, index)) != -1; ) {
				if (!changed) {
					this._throwIfFrozen();
				}

				this._unregisterValue(value);
				items.splice(index, 1);
				changed = true;
			}
		}

		if (changed) {
			this.length = items.length;
			this.emit('change');
		}

		return changed;
	},

	/**
	 * @typesign (index: int) -> *;
	 */
	removeAt: function removeAt(index) {
		var value = this._items.splice(this._validateIndex(index), 1)[0];

		this._throwIfFrozen();

		this._unregisterValue(value);
		this.length--;

		this.emit('change');

		return value;
	},

	/**
	 * @typesign (index: int, count?: uint) -> Array;
	 */
	removeRange: function removeRange(index, count) {
		index = this._validateIndex(index, true);

		var items = this._items;

		if (count === undefined) {
			count = items.length - index;
		} else if (index + count > items.length) {
			throw new RangeError('Sum of "index" and "count" out of valid range');
		}

		if (!count) {
			return [];
		}

		this._throwIfFrozen();

		for (var i = index + count; i > index; ) {
			this._unregisterValue(items[--i]);
		}
		var values = items.splice(index, count);
		this.length -= count;

		this.emit('change');

		return values;
	},

	/**
	 * @typesign () -> this;
	 */
	clear: function clear() {
		if (!this.length) {
			return this;
		}

		this._throwIfFrozen();

		if (this.adoptsValueChanges) {
			this._valueCounts.forEach(function(value) {
				if (value instanceof EventEmitter) {
					value.off('change', this._onItemChange, this);
				}
			}, this);
		}

		this._items.length = 0;
		this._valueCounts.clear();

		this.length = 0;

		this.emit({
			type: 'change',
			data: {
				subtype: 'clear'
			}
		});

		return this;
	},

	/**
	 * @typesign (separator?: string) -> string;
	 */
	join: function join(separator) {
		return this._items.join(separator);
	},

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList),
	 *     context?
	 * );
	 */
	forEach: null,

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList) -> *,
	 *     context?
	 * ) -> Array;
	 */
	map: null,

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList) -> ?boolean,
	 *     context?
	 * ) -> Array;
	 */
	filter: null,

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList) -> ?boolean,
	 *     context?
	 * ) -> *;
	 */
	find: function(callback, context) {
		var items = this._items;

		for (var i = 0, l = items.length; i < l; i++) {
			var item = items[i];

			if (callback.call(context, item, i, this)) {
				return item;
			}
		}
	},

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList) -> ?boolean,
	 *     context?
	 * ) -> int;
	 */
	findIndex: function(callback, context) {
		var items = this._items;

		for (var i = 0, l = items.length; i < l; i++) {
			if (callback.call(context, items[i], i, this)) {
				return i;
			}
		}

		return -1;
	},

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList) -> ?boolean,
	 *     context?
	 * ) -> boolean;
	 */
	every: null,

	/**
	 * @typesign (
	 *     callback: (item, index: uint, list: cellx.ObservableList) -> ?boolean,
	 *     context?
	 * ) -> boolean;
	 */
	some: null,

	/**
	 * @typesign (
	 *     callback: (accumulator, item, index: uint, list: cellx.ObservableList) -> *,
	 *     initialValue?
	 * ) -> *;
	 */
	reduce: null,

	/**
	 * @typesign (
	 *     callback: (accumulator, item, index: uint, list: cellx.ObservableList) -> *,
	 *     initialValue?
	 * ) -> *;
	 */
	reduceRight: null,

	/**
	 * @typesign () -> this;
	 */
	clone: function clone() {
		return new this.constructor(this, {
			adoptsValueChanges: this.adoptsValueChanges,
			comparator: this.comparator,
			sorted: this.sorted
		});
	},

	/**
	 * @typesign () -> Array;
	 */
	toArray: function toArray() {
		return this._items.slice();
	},

	/**
	 * @typesign () -> string;
	 */
	toString: function toString() {
		return this._items.join();
	},

	/**
	 * @typesign (index: ?int, allowEndIndex?: boolean) -> ?uint;
	 */
	_validateIndex: function _validateIndex(index, allowEndIndex) {
		if (index === undefined) {
			return index;
		}

		if (index < 0) {
			index += this.length;

			if (index < 0) {
				throw new RangeError('Index out of valid range');
			}
		} else if (index >= this.length + (allowEndIndex ? 1 : 0)) {
			throw new RangeError('Index out of valid range');
		}

		return index;
	},

	/**
	 * @typesign (value);
	 */
	_insertSortedValue: function _insertSortedValue(value) {
		this._registerValue(value);

		var items = this._items;
		var comparator = this.comparator;
		var low = 0;
		var high = items.length;

		while (low != high) {
			var mid = (low + high) >> 1;

			if (comparator(value, items[mid]) < 0) {
				high = mid;
			} else {
				low = mid + 1;
			}
		}

		items.splice(low, 0, value);
	}
}]);

['forEach', 'map', 'filter', 'every', 'some'].forEach(function(name) {
	ObservableList.prototype[name] = function(callback, context) {
		return this._items[name](function(item, index) {
			return callback.call(context, item, index, this);
		}, this);
	};
});

['reduce', 'reduceRight'].forEach(function(name) {
	ObservableList.prototype[name] = function(callback, initialValue) {
		var items = this._items;
		var list = this;

		function wrapper(accumulator, item, index) {
			return callback(accumulator, item, index, list);
		}

		return arguments.length >= 2 ? items[name](wrapper, initialValue) : items[name](wrapper);
	};
});

[
	['keys', function keys(index) {
		return index;
	}],
	['values', function values(index, item) {
		return item;
	}],
	['entries', function entries(index, item) {
		return [index, item];
	}]
].forEach(function(settings) {
	var getStepValue = settings[1];

	ObservableList.prototype[settings[0]] = function() {
		var items = this._items;
		var index = 0;
		var done = false;

		return {
			next: function() {
				if (!done) {
					if (index < items.length) {
						return {
							value: getStepValue(index, items[index++]),
							done: false
						};
					}

					done = true;
				}

				return {
					value: undefined,
					done: true
				};
			}
		};
	};
});

ObservableList.prototype[Symbol.iterator] = ObservableList.prototype.values;
