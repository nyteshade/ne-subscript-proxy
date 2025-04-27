# SubscriptProxy

A powerful and flexible JavaScript library for allowing easy and programmatic subscript access to any object.

## Features

 - Allows programmatic methods for defining how an object should react when non-existing keys are
   accessed. 

## Future Features

 - Allow set traps instead of only get traps
 - Allow option to simply return proxy around original object rather than modifying prototype chain

## Installation


### Node JS

In a node js project, simply perform the following npm
install command.

```bash
npm install @nejs/subscript-proxy
```

### Browser

In a browser, a script tag pointed here can get you a CDN
served version of the latest build

```html
<script type="module">
  const { SubscriptProxy } = await import('https://cdn.jsdelivr.net/gh/nyteshade/ne-subscript-proxy@main/dist/subscriptproxy.mjs')

  // ... use SubscriptProxy here
</script>
```

Or if you want it to automatically be injected into the window,
you can use the iife variant.

```html
<script src="'https://cdn.jsdelivr.net/gh/nyteshade/ne-subscript-proxy@main/dist/subscriptproxy.js'"></script>
```

## Usage

### Basic Usage

```js
import { SubscriptProxy } from '@nejs/subscript-proxy';

// or alternatively
const { SubscriptProxy } = require('@nejs/subscript-proxy');

// or alternatively
const { SubscriptProxy } = await import('@nejs/subscript-proxy');

// Take an object
let object = { name: 'Cocacola' }

// Choose some proxied key value pairs
SubscriptProxy.applyTo(object, [
  ['type', 'drink'],
  ['hasCalories', () => true]
])

// or
SubscriptProxy.applyTo(object, {
  type: 'drink',
  hasCalories() { return true },
})

// Then use
object.name // 'Cocacola'
object.type // 'drink'
object.hasCalories // true
```

## License

MIT

## Contributing

Contributors are welcome! Please submit a Pull Request.

