[![GitHub license](https://img.shields.io/github/license/neuronetio/svelte-deep-store?style=flat-square)](https://github.com/neuronetio/svelte-deep-store/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/neuronetio/svelte-deep-store)](https://github.com/neuronetio/svelte-deep-store/issues)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/neuronetio/svelte-deep-store)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fneuronetio%2Fsvelte-deep-store)

# svelte-deep-store

Svelte deep store - react only when specified property of the object was changed.

# Usage

```javascript
import { onDestroy } from 'svelte';
import Store from 'svelte-deep-store';

const state = new Store({ some: 'value', someOther: { nested: 'value' } });

let nestedValue;
onDestroy(
  state.subscribe('someOther.nested', (value) => {
    nestedValue = value;
  })
);

let some;
onDestroy(
  state.subscribeAll(['some', 'someOther'], (which, value) => {
    if (which === 'some') {
      some = value;
    } else if (which === 'someOther') {
      nestedValue = value.nested;
    }
  })
);

state.update('someOther.nested', (currentValue) => {
  return 'new value';
});

onDestroy(
  state.subscribe('some', (value) => {
    state.update('someOther.nested', (oldValue) => {
      return 'nested changed after some changed';
    });
  })
);

let currentState = state.get();
console.log(currentState.some);

onDestroy(state.destroy);
```

There are also `watch` and `watchAll` methods instead of `subscribe` and `subscribeAll` which do the same thing.
And `set` is equivalent of `update`;
