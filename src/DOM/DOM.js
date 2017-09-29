/**
 * @param {Element} element
 * @param {*}
 */
function setDOMContent (element, value) {
	getDOMNode(element).textContent = value
}

/**
 * @param {Element} element
 * @param {(string|number)} value
 */
function setDOMValue (element, value) {
	getDOMNode(element).nodeValue = value
}

/**
 * @param {(EventListener|Element)} element
 * @param {string} type
 */
function setDOMEvent (element, type) {
	getDOMNode(element).addEventListener(type, element, false)
}

/**
 * @param {Element} element
 * @param {Object} props
 */
function setDOMStyle (element, props) {
	for (var key in props) {
		var value = props[key]

		if (key.indexOf('-') < 0)
			getDOMNode(element).style[key] = value !== false && value !== undefined ? value : null
		else
			getDOMNode(element).style.setProperty(key, value)
	}
}

/**
 * @param {Element} element
 * @param {string} name 
 * @param {*} value
 */
function setDOMProperty (element, name, value) {
	switch (value) {
		case null:
		case false:
		case undefined:
			return setDOMAttribute(element, name, value, getDOMNode(element)[name] = '')
	}

	getDOMNode(element)[name] = value
}

/**
 * @param {Element} element
 * @param {string} name
 * @param {*} value
 * @param {string} xmlns
 */
function setDOMAttribute (element, name, value, xmlns) {
	switch (value) {
		case null:
		case false:
		case undefined:
			if (xmlns)
				getDOMNode(element).removeAttributeNS(xmlns, name)

			return getDOMNode(element).removeAttribute(name)				
		case true:
			return setDOMAttribute(element, name, '', xmlns)
	}

	if (!xmlns)
		getDOMNode(element).setAttribute(name, value)
	else
		getDOMNode(element).setAttributeNS(xmlns, name, value)
}

/**
 * @param {Element} element
 * @param {string} name
 * @param {*} value
 * @param {string} xmlns
 */
function setDOMProperties (element, name, value, xmlns) {
	switch (name) {
		case 'className':
			if (!xmlns && value)
				return setDOMProperty(element, name, value)
		case 'class':
			return setDOMAttribute(element, 'class', value, '')
		case 'style':
			if (typeof value === 'object')
				return setDOMStyle(element, value)
			break
		case 'xlink:href':
			return setDOMAttribute(element, name, value, 'http://www.w3.org/1999/xlink')
		case 'dangerouslySetInnerHTML':
			return setDOMInnerHTML(element, value ? value.__html : null, [])
		case 'innerHTML':
			return
		case 'acceptCharset':
			return setDOMProperties(element, 'accept-charset', value, xmlns)
		case 'httpEquiv':
			return setDOMProperties(element, 'http-equiv', value, xmlns)
		case 'autofocus':
		case 'autoFocus':
			return getDOMNode(element)[value ? 'focus' : 'blur']()
		case 'width':
		case 'height':
			if (element.type === 'img')
				break
		default:
			if (!xmlns && name in getDOMNode(element))
				return setDOMProperty(element, name, value)
	}

	switch (typeof value) {
		case 'object':
		case 'function':
			return setDOMProperty(element, name, value)						
	}

	setDOMAttribute(element, name, value, '')
}

/**
 * @param {Element} element
 * @param {*} value
 * @param {Array} nodes
 */
function setDOMInnerHTML (element, value, nodes) {
	if (getDOMNode(element).innerHTML)
		element.children.forEach(function (children) {
			nodes.push(getDOMNode(children))
		})

	if (getDOMNode(element).innerHTML = value != null ? value : '')
		nodes.push.apply(nodes, getDOMNode(element).childNodes)

	nodes.forEach(function (node) {
		getDOMNode(element).appendChild(node)
	})
}

/**
 * @return {Node}
 */
function getDOMDocument () {
	return document.documentElement
}

/**
 * @param {Element} element
 * @param {string} xmlns
 */
function getDOMType (element, xmlns) {
	switch (element.type) {
		case 'svg':
			return 'http://www.w3.org/2000/svg'
		case 'math':
			return 'http://www.w3.org/1998/Math/MathML'
		case 'foreignObject':
			return ''
	}
	
	return xmlns
}

/**
 * @param {Element} element
 * @return {Object}
 */
function getDOMProps (element) {
	switch (element.type) {
		case 'input':
			return merge({type: null, step: null, min: null, max: null}, element.props)
		default:
			return element.props
	}
}

/**
 * @param {Element} element
 * @return {Node}
 */
function getDOMNode (element) {
	return element.DOM.node
}

/**
 * @param {Element} element
 * @param {Element} parent
 * @param {Element} previous
 * @param {Element} next
 */
function getDOMQuery (element, parent, previous, next) {
	var id = element.id
	var type = id > SharedElementNode ? '#text' : element.type.toLowerCase()
	var xmlns = element.xmlns
	var props = element.props
	var children = element.children
	var length = children.length
	var target = previous.active ? getDOMNode(previous).nextSibling : getDOMNode(parent).firstChild 
	var sibling = target
	var node = null

	while (target) {
		if (target.nodeName.toLowerCase() === type) {
			if (id > SharedElementNode) {
				if (next.id > SharedElementNode)
					target.splitText(length)

				if (target.nodeValue !== children)
					target.nodeValue = children
			} else if (length === 0 && target.firstChild) {
				target.textContent = ''
			}

			if (parent.id === SharedElementPortal)
				getDOMPortal(parent).appendChild(target)

			node = target
			type = null

			if (!(target = target.nextSibling) || next.type)
				break
		}

		if (id > SharedElementNode && length === 0) {
			target.parentNode.insertBefore((node = createDOMText(element)), target)
			
			if (!next.type)				
				type = null
			else
				break
		}

		target = (sibling = target).nextSibling
		sibling.parentNode.removeChild(sibling)
	}

	if (node && !node.splitText)
		for (var attributes = node.attributes, i = attributes.length - 1; i >= 0; --i) {
			var attr = attributes[i]
			var name = attr.name
			var value = props[name] + ''

			if (attr.value !== value && attr.value !== value.toLowerCase())
				node.removeAttribute(name)
		}

	return node
}

/**
 * @param {(Component|Element|Node|Event)} element
 * @return {Node}
 */
function findDOMNode (element) {
	if (!element)
		invariant(SharedSiteFindDOMNode, 'Expected to receive a component')

	if (isValidElement(getComponentElement(element)))
		return findDOMNode(getComponentElement(element))

	if (element.active && isValidElement(element))
		return getDOMNode(element)

	if (isValidDOMNode(element))
		return element

	if (isValidDOMEvent(element))
		return element.currentTarget

	invariant(SharedSiteFindDOMNode, 'Called on an unmounted component')
}

/**
 * @param {Node} target
 * @param {boolean}
 */
function isValidDOMNode (target) {
	return !!(target && target.ELEMENT_NODE)
}

/**
 * @param {Event} event
 * @return {boolean}
 */
function isValidDOMEvent (event) {
	return !!(event && event.BUBBLING_PHASE)
}

/**
 * @param {Element} element
 * @param {Element} parent
 */
function removeDOMNode (element, parent) {
	getDOMNode(parent).removeChild(getDOMNode(element))
}

/**
 * @param {Element} element
 * @param {Element} sibling
 * @param {Element} parent
 */
function insertDOMNode (element, sibling, parent) {
	getDOMNode(parent).insertBefore(getDOMNode(element), getDOMNode(sibling))
}

/**
 * @param {Element} element
 * @param {Element} parent
 */
function appendDOMNode (element, parent) {
	getDOMNode(parent).appendChild(getDOMNode(element))
}

/**
 * @param {Element} element
 * @return {Object}
 */
function createDOMElement (element) {
	if (element.xmlns)
		return document.createElementNS(element.xmlns, element.type)
	else
		return document.createElement(element.type)
}

/**
 * @param {Element} element
 * @return {Object}
 */
function createDOMText (element) {
	return document.createTextNode(element.children)
}

/**
 * @param {Element} element
 * @return {Object}
 */
function createDOMEmpty (element) {
	return document.createTextNode('')
}

/**
 * @param {Element} element
 * @return {Object}
 */
function getDOMPortal (element) {
	if (typeof element.type === 'string')
		return getDOMDocument().querySelector(element.type)

	if (isValidDOMNode(element.type))
		return element.type

	return getDOMDocument()
}
