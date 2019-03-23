import * as Enum from './Enum.js'
import * as Utility from './Utility.js'

/**
 * @constructor
 */
export var struct = Utility.extend(function document () {
	this.nodeValue  = ''
	this.textContent = null
	this.ownerDocument = null
	this.documentElement = this
}, {
	createElement: {value: self},
	createElementNS: {value: self},
	createTextNode: {value: self},
	createDocumentFragment: {value: self},
	removeChild: {value: self},
	appendChild: {value: self},
	insertBefore: {value: self},
	addEventListener: {value: self},
	setAttribute: {value: self},
	removeAttribute: {value: self},
	style: {value: {setProperty: self}}
})

/**
 * @type {object}
 */
export var frame = new struct()

/**
 * @return {object}
 */
export function self () {
	return this
}

/**
 * @param {object} handler
 * @return {boolean}
 */
export function noop (handler) {
	return frame === handler.owner
}

/**
 * @param {number} identity
 * @param {(string|number|object)} type
 * @param {object} children
 * @param {string?} context
 * @param {object} owner
 * @return {object}
 */
export function create (identity, type, children, context, owner) {
	switch (identity) {
		case Enum.element:
			return context ? owner.createElementNS(context, type) : owner.createElement(type)
		case Enum.text:
			return owner.createTextNode(children)
		case Enum.portal: case Enum.empty:
			return owner.createTextNode('')
		case Enum.target:
			return target(type, owner)
	}

	return owner.createDocumentFragment()
}

/**
 * @param {object} value
 * @param {object?} owner
 * @return {object}
 */
export function target (value, owner) {
	if (value) {
		if (typeof value === 'object') {
			switch (value.ownerDocument) {
				case undefined:
					return owner === undefined ? value : frame
				case null:
					return value.documentElement
			}

			return value
		} else if (owner) {
			return target(owner.querySelector(value), owner)
		} else if (typeof document === 'object') {
			return target(value, document)
		} else {
			return frame
		}
	}

	Utility.throws(Utility.error('Invalid target'))
}

/**
 * @param {object} value
 * @return {object}
 */
export function owner (value) {
	return value.ownerDocument || value
}

/**
 * @param {object} parent
 * @return {void}
 */
export function clear (parent) {
	return parent.textContent = null
}

/**
 * @param {object} parent
 * @param {*} value
 */
export function content (parent, value) {
	parent.nodeValue = value
}

/**
 * @param {object} parent
 * @param {object} element
 */
export function remove (parent, element) {
	parent.removeChild(element)
}

/**
 * @param {object} parent
 * @param {object} element
 */
export function append (parent, element) {
	parent.appendChild(element)
}

/**
 * @param {object} parent
 * @param {object} element
 * @param {object} sibling
 */
export function insert (parent, element, sibling) {
	parent.insertBefore(element, sibling)
}

/**
 * @param {object} name
 * @param {string} value
 * @return {string}
 */
export function context (name, value) {
	switch (name) {
		case 'svg':
			return 'http://www.w3.org/2000/svg'
		case 'math':
			return 'http://www.w3.org/1998/Math/MathML'
		case 'foreignObject':
			return ''
	}

	return value
}

/**
 * @param {string} name
 * @param {any} value
 * @param {object} instance
 * @param {object} handler
 */
export function properties (name, value, instance, handler) {
	if (name === 'style') {
		if (typeof value === 'object') {
			return stylesheet(name, value, instance[name])
		}
	} else {
		switch (typeof value) {
			case 'object': case 'function':
				if (valid(name)) {
					return event(name.substr(2).toLowerCase(), value, instance, handler, handler.state)
				}
		}

		if (name in instance) {
			return property(name, value, instance)
		}
	}

	attribute(name, value, instance)
}

/**
 * @param {string} name
 * @param {any} value
 * @param {object} instance
 */
export function property (name, value, instance) {
	try {
		switch (value) {
			case false: case null: case undefined:
				switch (typeof instance[name]) {
					case 'string':
						return property(name, '', instance)
					case 'boolean':
						value = false
				}
		}

		instance[name] = value
	} catch (error) {
		attribute(name, value, instance)
	}
}

/**
 * @param {string} name
 * @param {any} value
 * @param {object} instance
 */
export function attribute (name, value, instance) {
	try {
		switch (value) {
			case false: case null: case undefined:
				return instance.removeAttribute(name)
			case true:
				value = name
		}

		instance.setAttribute(name, value)
	} finally {
		return
	}
}

/**
 * @param {string} name
 * @param {*} value
 * @param {object} instance
 */
export function stylesheet (name, value, instance) {
	if (value) {
		for (var key in value) {
			declaration(key, value[key], instance)
		}
	}
}

/**
 * @param {string} name
 * @param {any} value
 * @param {object} instance
 */
export function declaration (name, value, instance) {
	switch (value) {
		case false: case null: case undefined:
			return declaration(name, '', instance)
	}

	if (name in instance) {
		instance[name] = value
	} else {
		instance.setProperty(name, value)
	}
}

/**
 * @param {string} name
 * @param {string} value
 * @param {object} instance
 * @param {object} handler
 * @param {object} handlers
 */
export function event (name, value, instance, handler, handlers) {
	if (handlers) {
		if (handlers[name] === undefined) {
			instance.addEventListener(name, handler, false)
		}

		handlers[name] = value
	} else {
		event(name, value, instance, handler, handler.state = {})
	}
}

/**
 * @param {string} name
 * @return {boolean}
 */
export function valid (name) {
	return name.charCodeAt(0) === 111 && name.charCodeAt(1) === 110
}
