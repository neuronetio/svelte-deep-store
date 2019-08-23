import { path, set, view, lensPath, equals } from 'ramda';

export default class Store {
  constructor(data = {}) {
    this.listeners = {};
    this.data = this.mergeStores(data);
  }

  mergeListemers(store) {
    for (const path of store.listeners) {
      const fn = store.listeners[path];
      this.subscribe(path, fn);
    }
    store.listeners = {};
  }

  mergeStores(data) {
    for (const key in data) {
      const value = data[key];
      if (value instanceof Store) {
        this.mergeListeners(value);
        data[key] = value.get();
      } else if (data[key].constructor.name === 'Object') {
        this.mergeStores(data[key]);
      } else if (Array.isArray(data[key])) {
        for (let item of data[key]) {
          this.mergeStores(item);
        }
      }
    }
    return data;
  }

  destroy() {
    this.data = undefined;
    this.listeners = {};
  }

  subscribeAll(userPaths, fn) {
    let unsubscribers = [];
    for (const userPath of userPaths) {
      const wrappedSubscriber = (newValue, oldValue) => {
        fn(userPath, newValue, oldValue);
      };
      unsubscribers.push(this.subscribe(userPath, wrappedSubscriber));
    }
    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      unsubscribers = [];
    };
  }

  watchAll(userPaths, fn) {
    return this.subscribeAll(userPaths, fn);
  }

  subscribe(userPath, fn) {
    if (typeof userPath === 'function') {
      fn = userPath;
      userPath = '';
    }
    if (!Array.isArray(this.listeners[userPath])) {
      this.listeners[userPath] = [];
    }
    this.listeners[userPath].push(fn);
    let pathSplit = userPath.split('.');
    if (userPath === '') {
      pathSplit = [];
    }
    fn(path(pathSplit, this.data));
    return this.unsubscribe(fn);
  }

  watch(userPath, fn) {
    return this.subscribe(userPath, fn);
  }

  unsubscribe(fn) {
    return () => {
      for (const currentPath in this.listeners) {
        this.listeners[currentPath] = this.listeners[currentPath].filter((current) => current !== fn);
        if (this.listeners[currentPath].length === 0) {
          delete this.listeners[currentPath];
        }
      }
    };
  }

  unwatch(fn) {
    return this.unsubscribe(fn);
  }

  update(userPath, fn) {
    if (typeof userPath === 'function') {
      fn = userPath;
      userPath = '';
    }
    let pathSplit = userPath.split('.');
    if (userPath === '') {
      pathSplit = [];
    }
    const lens = lensPath(pathSplit);
    let newValue = fn(view(lens, this.data));
    this.data = set(lens, newValue, this.data);
    for (const currentPath in this.listeners) {
      if (
        userPath.substr(0, currentPath.length) === currentPath ||
        currentPath.substr(0, userPath.length) === userPath
      ) {
        let currentPathSplit = currentPath.split('.');
        if (currentPath === '') {
          currentPathSplit = [];
        }
        for (const listener of this.listeners[currentPath]) {
          listener(path(currentPathSplit, this.data));
        }
      }
    }
  }

  set(userPath, fn) {
    return this.update(userPath, fn);
  }

  get(userPath) {
    if (typeof userPath === 'undefined' || userPath === '') {
      return this.data;
    }
    return path(userPath.split('.'), this.data);
  }
}
