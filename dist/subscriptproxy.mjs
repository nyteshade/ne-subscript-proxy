/**
 * The SubscriptProxy class inserts a proxy in the prototype chain
 * of the specified object, duplicating the parent prototype with a call to
 * Object.create and wrapping that parent prototype layer in a
 * Proxy instance.
 *
 * This enables custom property lookup behavior for an object without
 * directly modifying the object or its immediate prototype. It allows
 * for intercepting and customizing how properties are accessed, checked,
 * and enumerated through the prototype chain.
 *
 * @class
 */
class SubscriptProxy {
  /**
   * Creates a new SubscriptProxy instance.
   *
   * @param {Object} target - The target object whose prototype chain will be modified
   * @param {Object} keyValueMap - Map of property names to values or handler functions
   * @param {Object} options - Configuration options
   * @param {boolean} [options.fallback=true] - Whether to fallback to default behavior for undefined properties
   * @param {boolean} [options.evalFns=true] - Whether to evaluate functions in the key-value map
   * @param {Array} [options.except=[]] - Properties to exclude from proxying
   * @param {boolean} [options.copyParentProto=true] - Whether to copy the parent prototype
   */
  constructor(target, keyValueMap, options) {
    Object.assign(this, { target, keyValueMap, options })
  }

  /**
   * Extracts relevant keys for proxy handlers, filtering out special keys and
   * respecting exceptions.
   *
   * @param {SubscriptProxy} instance - The SubscriptProxy instance
   * @returns {Object} An object containing filtered keys and generated object
   * @private
   */
  static _getRelevantKeys(instance) {
    const { is } = SubscriptProxy
    const { ALL, GENFN } = SubscriptProxy

    const iterator = instance.keyValueMap[GENFN]
    const excepts = instance.options?.except ?? []
    const gentries = is.genFn(iterator) ? [...iterator()] : []
    const genObject = Object.fromEntries(gentries)

    const keys = Reflect
      .ownKeys(instance.keyValueMap)
      .filter(key => !excepts.some(exception => key === exception))
      .filter(key => key !== ALL && key !== GENFN)
      .concat(Object.keys(genObject))

    return { keys, genObject }
  }

  /**
   * Applies a proxy to the prototype chain of the specified target object.
   *
   * @param {Object} target - The target object to modify
   * @param {Object|Function|Iterable} kvMapOrFunction - Key-value map, function handler, or iterable
   * @param {Object} [options] - Configuration options
   * @param {boolean} [options.fallback=true] - Whether to fallback to default behavior for undefined properties
   * @param {boolean} [options.evalFns=true] - Whether to evaluate functions in the key-value map
   * @param {Array} [options.except=[]] - Properties to exclude from proxying
   * @param {boolean} [options.copyParentProto=true] - Whether to copy the parent prototype
   * @returns {SubscriptProxy} The created proxy instance
   */
  static applyTo(target, kvMapOrFunction, options) {
    let {
      fallback = true,
      evalFns = true,
      except = [],
      copyParentProto = true,
    } = (options && typeof options === 'object' ? options : {})

    const { is, ALL, GENFN } = this

    let keyValueMap = {}

    if (is.entries(kvMapOrFunction))
      Object.assign(keyValueMap, Object.fromEntries(kvMapOrFunction));

    else if (is.fn(kvMapOrFunction))
      keyValueMap[ALL] = kvMapOrFunction;

    else if (is.entryIterator(kvMapOrFunction))
      keyValueMap[GENFN] = kvMapOrFunction[Symbol.iterator].bind(kvMapOrFunction);

    else if (is.obj(kvMapOrFunction))
      Object.assign(keyValueMap, kvMapOrFunction);

    if (fallback) {
      if (is.fn(keyValueMap[ALL])) {
        const handler = keyValueMap[ALL]

        keyValueMap[ALL] = (target, property, receiver) => {
          const response = handler(target, property, receiver)

          if (typeof response === 'undefined')
            return Reflect.get(target, property, receiver)

          return response
        }
      }

      else
        keyValueMap[ALL] = Reflect.get.bind(Reflect)
    }

    const prototype = copyParentProto
      ? Object.create(Object.getPrototypeOf(target))
      : Object.getPrototypeOf(target)

    const instance = new this(
      target,
      keyValueMap,
      { fallback, except, copyParentProto, evalFns }
    )

    instance.proxy = new Proxy(prototype, {
      /**
       * Handle property access on the proxy
       */
      get(target, property, receiver) {
        const handler = instance.keyValueMap[ALL]
        const { keys, genObject } = SubscriptProxy._getRelevantKeys(instance)

        if (keys.includes(property)) {
          let value = instance.keyValueMap[property] ?? genObject[property]

          if (instance.options?.evalFns && is.fn(value))
            value = value(target, property, receiver)

          return value
        }

        if (handler)
          return handler(target, property, receiver)
      },

      /**
       * Handle property existence check on the proxy
       */
      has(target, property) {
        const { keys } = SubscriptProxy._getRelevantKeys(instance)
        return keys.includes(property) || Reflect.has(target, property)
      },

      /**
       * Handle own keys enumeration on the proxy
       */
      ownKeys(target) {
        const { keys } = SubscriptProxy._getRelevantKeys(instance)
        return keys
      }
    })

    Object.setPrototypeOf(target, instance.proxy)

    return instance
  }

  static {
    const hiddenData = value => ({ value, configurable: true, writable: true })
    const hiddenAccessor = (get, set) => ({ get, set, configurable: true })

    // Define instance properties with default values
    Object.defineProperties(SubscriptProxy.prototype, {
      keyValueMap: hiddenData({ '*': Reflect.get }),
      options: hiddenData({
        fallback: true,
        except: [],
        copyParentProto: true,
        evalFns: true,
      }),
      proxy: hiddenData(undefined),
      target: hiddenData(undefined),
    })

    const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor

    // Define type checking utilities
    const is = {
      array: value => Array.isArray(value),
      obj: value => value && typeof value === 'object',
      fn: value => typeof value === 'function',
      iteratorObj: value => value && typeof value === 'object' && Reflect.has(value, Symbol.iterator),
    }

    // Add dependent type checks that rely on the base checks
    is.genFn = value => is.fn(value) && value instanceof GeneratorFunction
    is.entries = value => is.array(value) && value.filter(e => e?.length == 2).length == value.length
    is.entryIterator = value => {
      const iterator = is.iteratorObj(value) && value[Symbol.iterator]()
      let entry = undefined

      if (is.fn(iterator?.next)) {
        entry = iterator.next()

        if (is.array(entry.value) && entry.value.length === 2)
          return true
      }

      return false
    }

    // Define static properties
    Object.defineProperties(SubscriptProxy, {
      is: hiddenData(is),

      GeneratorFunction: hiddenAccessor(() => GeneratorFunction),

      ALL: hiddenAccessor(() => '*'),
      GENFN: hiddenAccessor(() => '**'),
    })
  }
}


export { SubscriptProxy }
export default SubscriptProxy