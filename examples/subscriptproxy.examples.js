/**
 * This file contains examples demonstrating how to use the SubscriptProxy class
 * in different scenarios.
 */

const { SubscriptProxy } = require('./subscriptproxy.js')

/**
 * Example 1: Basic Property Override
 *
 * This example shows how to add or override properties on an object
 * through the prototype chain.
 */
function basicExample() {
  console.log('=== Basic Property Override Example ===')

  // Create a simple target object
  const person = {
    name: 'John',
    age: 30,
    greet() {
      return `Hello, my name is ${this.name} and I'm ${this.age} years old.`
    }
  }

  console.log('Original:', person.greet()) // Original: Hello, my name is John and I'm 30 years old.

  // Apply a proxy to modify properties
  SubscriptProxy.applyTo(person, {
    name: 'Jane',
    occupation: 'Engineer'
  })

  console.log('Modified:', person.greet()) // Modified: Hello, my name is Jane and I'm 30 years old.
  console.log('New property:', person.occupation) // New property: Engineer

  // Original properties still accessible through Object.getOwnPropertyDescriptor
  console.log(
    'Original property still available via descriptor:',
    Object.getOwnPropertyDescriptor(person, 'name').value
  ) // Original property still available via descriptor: John
}

/**
 * Example 2: Dynamic Properties with Functions
 *
 * This example shows how to use functions to create dynamic properties
 * that are evaluated at access time.
 */
function dynamicPropertiesExample() {
  console.log('\n=== Dynamic Properties Example ===')

  // Create an object with a counter
  const counter = {
    count: 0,
    increment() {
      this.count++
      return this.count
    }
  }

  // Apply a proxy with dynamic properties
  SubscriptProxy.applyTo(counter, {
    // Dynamic property that returns the current time
    currentTime: () => new Date().toISOString(),

    // Dynamic property that returns the square of the count
    squared: (target) => target.count * target.count
  })

  counter.increment()
  counter.increment()

  console.log('Count:', counter.count) // Count: 2
  console.log('Squared:', counter.squared) // Squared: 4
  console.log('Current time:', counter.currentTime) // Current time: [timestamp]

  counter.increment()
  console.log('Count after increment:', counter.count) // Count after increment: 3
  console.log('Squared after increment:', counter.squared) // Squared after increment: 9
}

/**
 * Example 3: Using the ALL Handler
 *
 * This example shows how to use the special ALL handler to handle
 * access to any property that doesn't have a specific handler.
 */
function allHandlerExample() {
  console.log('\n=== ALL Handler Example ===')

  // Create a simple object
  const config = {
    host: 'localhost',
    port: 8080
  }

  // Apply a proxy with an ALL handler
  SubscriptProxy.applyTo(config, (target, property) => {
    if (property.startsWith('get')) {
      const actualProp = property.substring(3).toLowerCase()
      if (actualProp in target)
        return target[actualProp]
    }

    // Log access to unknown properties
    console.log(`Attempted to access unknown property: ${String(property)}`)
    return `Property '${String(property)}' not found`
  })

  // Access using getter-style properties
  console.log('getHost:', config.getHost) // getHost: localhost
  console.log('getPort:', config.getPort) // getPort: 8080

  // Access non-existent property
  console.log('getNonExistent:', config.getNonExistent) // Attempted to access unknown property: getNonExistent
                                                       // getNonExistent: Property 'getNonExistent' not found
}

/**
 * Example 4: Using Iterables
 *
 * This example shows how to use an iterable (like Map) as the source
 * for properties.
 */
function iterablesExample() {
  console.log('\n=== Iterables Example ===')

  // Create a Map with key-value pairs
  const environmentVars = new Map([
    ['NODE_ENV', 'development'],
    ['DEBUG', 'true'],
    ['PORT', '3000']
  ])

  // Create a simple object
  const app = {
    name: 'Example App',
    start() {
      console.log(`Starting ${this.name} in ${this.NODE_ENV} mode on port ${this.PORT}`)
    }
  }

  // Apply a proxy with the Map as the source
  SubscriptProxy.applyTo(app, environmentVars)

  // Access Map entries through the proxy
  console.log('Environment:', app.NODE_ENV) // Environment: development
  console.log('Debug enabled:', app.DEBUG) // Debug enabled: true

  // Call a method that uses the proxied properties
  app.start() // Starting Example App in development mode on port 3000
}

/**
 * Example 5: Advanced Configuration Options
 *
 * This example demonstrates the various configuration options.
 */
function configurationOptionsExample() {
  console.log('\n=== Configuration Options Example ===')

  // Create a target object
  const user = {
    username: 'admin',
    password: 'secret',
    email: 'admin@example.com',
    roles: ['admin', 'user']
  }

  // Apply a proxy with configuration options
  SubscriptProxy.applyTo(user, {
    // Properties to add/override
    displayName: 'Administrator',
    password: '********', // Mask the password
    toJSON: () => {
      const { password, ...rest } = user
      return { ...rest, displayName: user.displayName }
    }
  }, {
    // Configuration options
    except: ['password'], // Don't proxy the password property
    evalFns: true, // Evaluate functions when accessed
    fallback: true, // Fall back to original properties
    copyParentProto: true // Copy the parent prototype
  })

  // The password property isn't proxied due to 'except'
  console.log('Password:', user.password) // Password: secret (not ********)

  // Other properties are proxied
  console.log('Display name:', user.displayName) // Display name: Administrator

  // Using the proxied toJSON method
  console.log('JSON representation:', JSON.stringify(user, null, 2))
  // JSON representation: {
  //   "username": "admin",
  //   "email": "admin@example.com",
  //   "roles": ["admin", "user"],
  //   "displayName": "Administrator"
  // }
}

// Run all examples
function runAllExamples() {
  basicExample()
  dynamicPropertiesExample()
  allHandlerExample()
  iterablesExample()
  configurationOptionsExample()
}

// If this file is executed directly, run the examples
if (require.main === module) {
  runAllExamples()
}

// Export the examples for use in other files
module.exports = {
  basicExample,
  dynamicPropertiesExample,
  allHandlerExample,
  iterablesExample,
  configurationOptionsExample,
  runAllExamples
}