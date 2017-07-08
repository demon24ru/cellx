import Cell from './Cell';
import ObservableCollectionMixin from './Collections/ObservableCollectionMixin';
import ObservableList from './Collections/ObservableList';
import ObservableMap from './Collections/ObservableMap';
import ErrorLogger from './ErrorLogger';
import EventEmitter from './EventEmitter';
import global from './JS/global';
import Map from './JS/Map';
import { is } from './JS/Object';
import Symbol from './JS/Symbol';
import { CELLS as KEY_CELLS, UID as KEY_UID } from './keys';
import logError from './Utils/logError';
import mixin from './Utils/mixin';
import nextTick from './Utils/nextTick';
import nextUID from './Utils/nextUID';
import noop from './Utils/noop';

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

ErrorLogger.setHandler(logError);

var assign = Object.assign || function(target, source) {
	for (var name in source) {
		target[name] = source[name];
	}

	return target;
};

/**
 * @typesign (value?, opts?: {
 *     debugKey?: string,
 *     owner?: Object,
 *     validate?: (value, oldValue),
 *     merge: (value, oldValue) -> *,
 *     put?: (cell: Cell, value, oldValue),
 *     reap?: (),
 *     onChange?: (evt: cellx~Event) -> ?boolean,
 *     onError?: (evt: cellx~Event) -> ?boolean
 * }) -> cellx;
 *
 * @typesign (pull: (cell: Cell, next) -> *, opts?: {
 *     debugKey?: string,
 *     owner?: Object,
 *     validate?: (value, oldValue),
 *     merge: (value, oldValue) -> *,
 *     put?: (cell: Cell, value, oldValue),
 *     reap?: (),
 *     onChange?: (evt: cellx~Event) -> ?boolean,
 *     onError?: (evt: cellx~Event) -> ?boolean
 * }) -> cellx;
 */
function cellx(value, opts) {
	if (!opts) {
		opts = {};
	}

	var initialValue = value;

	function cx(value) {
		var owner = this;

		if (!owner || owner == global) {
			owner = cx;
		}

		if (!hasOwn.call(owner, KEY_CELLS)) {
			Object.defineProperty(owner, KEY_CELLS, { value: new Map() });
		}

		var cell = owner[KEY_CELLS].get(cx);

		if (!cell) {
			if (value === 'dispose' && arguments.length >= 2) {
				return;
			}

			cell = new Cell(initialValue, assign({ owner }, opts));

			owner[KEY_CELLS].set(cx, cell);
		}

		switch (arguments.length) {
			case 0: {
				return cell.get();
			}
			case 1: {
				cell.set(value);
				return value;
			}
			default: {
				var method = value;

				switch (method) {
					case 'bind': {
						cx = cx.bind(owner);
						cx.constructor = cellx;
						return cx;
					}
					case 'unwrap': {
						return cell;
					}
					default: {
						var result = Cell.prototype[method].apply(cell, slice.call(arguments, 1));
						return result === cell ? cx : result;
					}
				}
			}
		}
	}
	cx.constructor = cellx;

	if (opts.onChange || opts.onError) {
		cx.call(opts.owner || global);
	}

	return cx;
}

cellx.configure = function(config) {
	Cell.configure(config);
};

cellx.ErrorLogger = ErrorLogger;
cellx.EventEmitter = EventEmitter;
cellx.ObservableCollectionMixin = ObservableCollectionMixin;
cellx.ObservableMap = ObservableMap;
cellx.ObservableList = ObservableList;
cellx.Cell = Cell;
cellx.autorun = Cell.autorun;
cellx.transact = cellx.transaction = Cell.transaction;
cellx.KEY_UID = KEY_UID;
cellx.KEY_CELLS = KEY_CELLS;

/**
 * @typesign (
 *     entries?: Object | Array<{ 0, 1 }> | cellx.ObservableMap,
 *     opts?: { adoptsValueChanges?: boolean }
 * ) -> cellx.ObservableMap;
 *
 * @typesign (
 *     entries?: Object | Array<{ 0, 1 }> | cellx.ObservableMap,
 *     adoptsValueChanges?: boolean
 * ) -> cellx.ObservableMap;
 */
function map(entries, opts) {
	return new ObservableMap(entries, opts);
}

cellx.map = map;

/**
 * @typesign (items?: Array | cellx.ObservableList, opts?: {
 *     adoptsValueChanges?: boolean,
 *     comparator?: (a, b) -> int,
 *     sorted?: boolean
 * }) -> cellx.ObservableList;
 *
 * @typesign (items?: Array | cellx.ObservableList, adoptsValueChanges?: boolean) -> cellx.ObservableList;
 */
function list(items, opts) {
	return new ObservableList(items, opts);
}

cellx.list = list;

/**
 * @typesign (obj: cellx.EventEmitter, name: string, value) -> cellx.EventEmitter;
 */
function defineObservableProperty(obj, name, value) {
	var cellName = name + 'Cell';

	obj[cellName] = value instanceof Cell ? value : new Cell(value, { owner: obj });

	Object.defineProperty(obj, name, {
		configurable: true,
		enumerable: true,

		get: function() {
			return this[cellName].get();
		},

		set: function(value) {
			this[cellName].set(value);
		}
	});

	return obj;
}

cellx.defineObservableProperty = defineObservableProperty;

/**
 * @typesign (obj: cellx.EventEmitter, props: Object) -> cellx.EventEmitter;
 */
function defineObservableProperties(obj, props) {
	Object.keys(props).forEach(function(name) {
		defineObservableProperty(obj, name, props[name]);
	});

	return obj;
}

cellx.defineObservableProperties = defineObservableProperties;

/**
 * @typesign (obj: cellx.EventEmitter, name: string, value) -> cellx.EventEmitter;
 * @typesign (obj: cellx.EventEmitter, props: Object) -> cellx.EventEmitter;
 */
function define(obj, name, value) {
	if (arguments.length == 3) {
		defineObservableProperty(obj, name, value);
	} else {
		defineObservableProperties(obj, name);
	}

	return obj;
}

cellx.define = define;

cellx.JS = {
	is,
	Symbol,
	Map
};

cellx.Utils = {
	logError,
	nextUID,
	mixin,
	nextTick,
	noop
};

cellx.cellx = cellx;

cellx.__esModule = true;
cellx.default = cellx;

export default cellx;
