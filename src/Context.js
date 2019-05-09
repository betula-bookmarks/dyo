import * as Utility from './Utility.js'
import * as Component from './Component.js'
import * as Lifecycle from './Lifecycle.js'
import * as Schedule from './Schedule.js'

/**
 * @param {object} element
 * @param {object} context
 * @param {any?} type
 * @param {any?} value
 * @return {[any, function]}
 */
export function consume (element, context, type, value) {
	if (Utility.callable(value)) {
		if (Utility.isArray(type = value.prototype)) {
			return context[type[0]]
		} else {
			value = Lifecycle.resolve(element, value)
		}
	}

	return provide(element, element.context = Utility.create(context), element.type.prototype = [Utility.symbol()], value)
}

/**
 * @param {object} element
 * @param {object} context
 * @param {object} type
 * @param {any?} value
 * @return {[any, function]}
 */
export function provide (element, context, type, value) {
	return context[type[0]] = context = [value, function (value) {
		if (!Utility.is(context[0], context[0] = Utility.callable(value) ? value(context[0]) : value)) {
			Component.enqueue(element, null, forward)
		}
	}]
}

/**
 * @param {object} element
 */
export function forward (element) {
	try {
		Schedule.root()
	} finally {
		Component.dequeue(element)
	}
}
