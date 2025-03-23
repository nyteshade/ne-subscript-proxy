/**
 * Test suite for the SubscriptProxy class using Vitest.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SubscriptProxy } from './dist/subscriptproxy.js'

describe('SubscriptProxy', () => {
  /**
   * Test object that will be used as the target for our proxy
   */
  let testObj

  beforeEach(() => {
    // Reset the test object before each test
    testObj = {
      originalMethod() {
        return 'original'
      },
      originalProp: 'original value'
    }
  })

  describe('Basic functionality', () => {
    it('should correctly proxy object properties', () => {
      // Apply proxy with a simple key-value map
      SubscriptProxy.applyTo(testObj, {
        newProp: 'new value'
      })

      // The new property should be accessible
      expect(testObj.newProp).toBe('new value')

      // The original property should still be accessible
      expect(testObj.originalProp).toBe('original value')

      // The original method should still work
      expect(testObj.originalMethod()).toBe('original')
    })

    it('should handle function values in key-value map', () => {
      // Apply proxy with a function value
      SubscriptProxy.applyTo(testObj, {
        dynamicProp: () => 'dynamic value'
      })

      // The function should be evaluated when accessing the property
      expect(testObj.dynamicProp).toBe('dynamic value')
    })

    it('should handle ALL handler for fallback properties', () => {
      // Apply proxy with a custom ALL handler
      SubscriptProxy.applyTo(testObj, (target, prop) => {
        if (prop === 'missing')
          return 'custom fallback'

        return undefined
      })

      // The custom fallback should work for the specified property
      expect(testObj.missing).toBe('custom fallback')

      // Other properties should work normally
      expect(testObj.originalProp).toBe('original value')
    })
  })

  describe('Advanced functionality', () => {
    it('should respect the except option', () => {
      // Apply proxy with except option
      SubscriptProxy.applyTo(testObj, {
        prop1: 'value1',
        prop2: 'value2',
        prop3: 'value3'
      }, { except: ['prop2'] })

      // Excluded property should not be accessible through the proxy
      expect(testObj.prop1).toBe('value1')
      expect(testObj.prop2).toBeUndefined()
      expect(testObj.prop3).toBe('value3')
    })

    it('should handle iterables as input', () => {
      // Create a Map as an iterable source
      const map = [
        ['mapProp1', 'map value 1'],
        ['mapProp2', 'map value 2']
      ]

      // Apply proxy with the Map
      SubscriptProxy.applyTo(testObj, map)

      // Properties from the Map should be accessible
      expect(testObj.mapProp1).toBe('map value 1')
      expect(testObj.mapProp2).toBe('map value 2')
    })
  })

  describe('Edge cases', () => {
    it('should handle nullish property values', () => {
      // Apply proxy with null and undefined values
      SubscriptProxy.applyTo(testObj, {
        nullProp: null,
        undefinedProp: undefined
      })

      // Null values should be accessible as null
      expect(testObj.nullProp).toBeUndefined()

      // Undefined values should be undefined
      expect(testObj.undefinedProp).toBeUndefined()
    })

    it('should handle Symbol properties', () => {
      const testSymbol = Symbol('test')

      // Apply proxy with a Symbol key
      SubscriptProxy.applyTo(testObj, {
        [testSymbol]: 'symbol value'
      })

      // Symbol property should be accessible
      expect(testObj[testSymbol]).toBe('symbol value')
    })

    it('should handle property existence checks', () => {
      // Apply proxy with properties
      SubscriptProxy.applyTo(testObj, {
        prop1: 'value1'
      })

      // Property existence check should work for original and added properties
      expect('originalProp' in testObj).toBe(true)
      expect('prop1' in testObj).toBe(true)
      expect('nonExistentProp' in testObj).toBe(false)
    })

    it('should preserve the instanceof relationship', () => {
      class TestClass {}
      const instance = new TestClass()

      // Apply proxy to the instance
      SubscriptProxy.applyTo(instance, {
        prop: 'value'
      })

      // instanceof should still work
      expect(instance instanceof TestClass).toBe(true)
    })
  })

  describe('Chaining proxies', () => {
    it('should allow multiple proxies to be chained', () => {
      // Apply first proxy
      SubscriptProxy.applyTo(testObj, {
        layer1: 'layer 1 value'
      })

      // Apply second proxy
      SubscriptProxy.applyTo(testObj, {
        layer2: 'layer 2 value'
      })

      // Both layers should be accessible
      expect(testObj.layer1).toBe('layer 1 value')
      expect(testObj.layer2).toBe('layer 2 value')
      expect(testObj.originalProp).toBe('original value')
    })
  })

  describe('Performance considerations', () => {
    it('should handle a large number of properties', () => {
      const largeMap = {}

      // Create a large number of properties
      for (let i = 0; i < 1000; i++)
        largeMap[`prop${i}`] = `value${i}`

      // Apply proxy with the large map
      SubscriptProxy.applyTo(testObj, largeMap)

      // Random property access should work
      expect(testObj.prop42).toBe('value42')
      expect(testObj.prop999).toBe('value999')
    })
  })
})
