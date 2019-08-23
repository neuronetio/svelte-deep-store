const Store = require('../index.cjs.js');
const R = require('ramda');

describe('Store', () => {
  it('should check existence of methods and data', () => {
    const state = new Store({ test: '123' });
    expect(typeof state).toEqual('object');
    expect(typeof state.unsubscribe).toBe('function');
    expect(typeof state.subscribe).toBe('function');
    expect(typeof state.subscribeAll).toBe('function');
    expect(typeof state.update).toBe('function');
    expect(typeof state.get).toBe('function');
    expect(typeof state.destroy).toBe('function');
    state.destroy();
  });

  it('should call Store', () => {
    const state = new Store({ a: 'a', b: 'b', c: { d: 'd' } });
    let $d;
    state.subscribe('c.d', (d) => {
      $d = d;
    });
    expect($d).toEqual('d');
    state.destroy();
  });

  it('should update and watch', () => {
    const state = new Store({
      test: {
        test2: 123
      }
    });
    let test2 = 0;
    let event = 0;
    state.subscribe('test.test2', (value) => {
      test2 = value;
      if (event === 0) {
        expect(value).toEqual(123);
      } else {
        expect(value).toEqual(100);
      }
      event++;
    });
    expect(test2).toEqual(123);
    state.update('test.test2', (oldValue) => {
      return 100;
    });
    expect(test2).toEqual(100);
    state.destroy();
  });

  it('should watch all paths', () => {
    const state = new Store({ x: 10, y: 20, z: { xyz: 50 } });
    let result = {};
    const paths = [];
    state.subscribeAll(['x', 'y', 'z.xyz'], (path, value) => {
      result = R.set(R.lensPath(path.split('.')), value, result);
      paths.push(path);
    });
    expect(result).toEqual({ x: 10, y: 20, z: { xyz: 50 } });
    expect(paths).toEqual(['x', 'y', 'z.xyz']);
    state.destroy();
  });

  it('should attach differences', () => {
    let state1Count = 0;
    const state1Str = 'state1 rulez!';
    const state1 = new Store({ state1: state1Str, nested: { state: 'ok' } });
    state1.subscribe('state1', (value, diff) => {
      if (state1Count === 0) {
        expect(value).toEqual(state1Str);
        expect(diff).toEqual([]);
      } else if (state1Count === 1) {
        if (!diff) {
          console.log(`'${value} ${diff}'`);
        }
        expect(value).toEqual('test');
        expect(diff.length).toEqual(1);
        expect(diff[0].kind).toEqual('E');
        expect(diff[0].lhs).toEqual(state1Str);
        expect(diff[0].rhs).toEqual('test');
      }
      state1Count++;
    });
    state1.update('state1', () => 'test');
    expect(state1Count).toEqual(2);
    let count2 = 0;
    state1.subscribe('', (state, diff) => {
      if (count2 === 0) {
        expect(state.nested.state).toEqual('ok');
        expect(diff.length).toEqual(0);
      } else {
        expect(state.nested.state).toEqual('updated');
        expect(diff.length).toEqual(1);
        expect(diff[0].kind).toEqual('E');
        expect(diff[0].path).toEqual(['nested', 'state']);
        expect(diff[0].lhs).toEqual('ok');
        expect(diff[0].rhs).toEqual('updated');
      }
      count2++;
    });
    state1.update((data) => {
      data.nested.state = 'updated';
      return data;
    });
    expect(count2).toEqual(2);
  });
});
