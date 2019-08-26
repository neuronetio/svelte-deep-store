import { path, set, view, lensPath, equals } from 'ramda';
import clone from 'fast-copy';

export type Listener = (value: any) => {};
export type ListenerAll = (valueOrPath: any, value: any | undefined) => {};
export type Updater = (value: any) => {};

export interface IListeners {
  [key: string]: Listener[];
}

export default class Store {
  listeners: IListeners;
  data: any;

  constructor(data = {}) {
    this.listeners = {};
    this.data = data;
  }

  getListeners(): IListeners {
    return this.listeners;
  }

  destroy() {
    this.data = undefined;
    this.listeners = {};
  }

  subscribeAll(userPaths: string[], fn: ListenerAll) {
    let unsubscribers = [];
    for (const userPath of userPaths) {
      const wrappedSubscriber = (((newValue) => {
        fn(userPath, newValue);
      }) as any) as Listener;
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

  subscribe(userPath: string | Listener, fn: Listener | undefined, execute = true) {
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
    if (execute) {
      fn(path(pathSplit, this.data));
    }
    return this.unsubscribe(fn);
  }

  watch(userPath: string | Listener, fn: Listener | undefined) {
    return this.subscribe(userPath, fn);
  }

  unsubscribe(fn: Listener) {
    return () => {
      for (const currentPath in this.listeners) {
        this.listeners[currentPath] = this.listeners[currentPath].filter((current) => current !== fn);
        if (this.listeners[currentPath].length === 0) {
          delete this.listeners[currentPath];
        }
      }
    };
  }

  unwatch(fn: Listener) {
    return this.unsubscribe(fn);
  }

  stringToArray(userPath: string) {
    let pathSplit = userPath.split('.');
    if (userPath === '') {
      pathSplit = [];
    }
    return pathSplit;
  }

  update(userPath: string | Updater, fn: Updater | undefined, filter = (path, key) => true) {
    if (typeof userPath === 'function') {
      fn = userPath;
      userPath = '';
    }
    const lens = lensPath(this.stringToArray(userPath));
    let oldValue = clone(view(lens, this.data));
    let newValue;
    if (typeof fn === 'function') {
      newValue = fn(view(lens, this.data));
    } else {
      newValue = fn;
    }
    this.data = set(lens, newValue, this.data);
    for (const currentPath in this.listeners) {
      if (
        userPath.substr(0, currentPath.length) === currentPath ||
        currentPath.substr(0, userPath.length) === userPath
      ) {
        let currentPathSplit = this.stringToArray(currentPath);
        for (const listener of this.listeners[currentPath]) {
          listener(path(currentPathSplit, this.data));
        }
      }
    }
  }

  set(userPath: string | Updater, fn: Updater | undefined) {
    return this.update(userPath, fn);
  }

  get(userPath: string | undefined = undefined) {
    if (typeof userPath === 'undefined' || userPath === '') {
      return this.data;
    }
    return path(userPath.split('.'), this.data);
  }

  static clone(obj) {
    return clone(obj);
  }
}
