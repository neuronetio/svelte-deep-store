const Observer = require('../index.cjs.js');
const R = require('ramda');

test('basic', () => {
  const state = new Observer({ test: '123' });
  expect(typeof state).toEqual('object');
  expect(typeof state.unsubscribe).toBe('function');
  expect(typeof state.subscribe).toBe('function');
  expect(typeof state.update).toBe('function');
  expect(typeof state.get).toBe('function');
  expect(typeof state.destroy).toBe('function');
  state.destroy();
});

test('should call observer', () => {
  const state = new Observer({ a: 'a', b: 'b', c: { d: 'd' } });
  let $d;
  state.subscribe('c.d', (d) => {
    $d = d;
  });
  expect($d).toBe('d');
  state.destroy();
});

test('should update and watch', () => {
  const state = new Observer({
    test: {
      test2: 123
    }
  });
  let test2 = 0;
  state.subscribe('test.test2', (value) => {
    test2 = value;
  });
  expect(test2).toBe(123);
  state.update('test.test2', (oldValue) => {
    return 100;
  });
  expect(test2).toBe(100);
  state.destroy();
});

test('should watch all paths', () => {
  const state = new Observer({ x: 10, y: 20, z: { xyz: 50 } });
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
