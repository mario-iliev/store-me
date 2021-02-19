import { detectedBadAccessors, detectMutatedState } from "../../src/utils/dev";

test("Detecting bad accessors", () => {
  const a = [];
  const b = [1];
  const c = ["string"];
  const d = [1, "string"];
  const e = [true];
  const f = [false];
  const g = [null];
  const h = [undefined];
  const i = [NaN];
  const j = [function () {}];
  const k = [{}];
  const l = [[]];

  expect(detectedBadAccessors(a)).toBe(false);
  expect(detectedBadAccessors(b)).toBe(false);
  expect(detectedBadAccessors(c)).toBe(false);
  expect(detectedBadAccessors(d)).toBe(false);
  expect(detectedBadAccessors(e)).toBe(true);
  expect(detectedBadAccessors(f)).toBe(true);
  expect(detectedBadAccessors(g)).toBe(true);
  expect(detectedBadAccessors(h)).toBe(true);
  expect(detectedBadAccessors(i)).toBe(true);
  expect(detectedBadAccessors(j)).toBe(true);
  expect(detectedBadAccessors(k)).toBe(true);
  expect(detectedBadAccessors(l)).toBe(true);
});

test("Detect state mutations", () => {
  const a = {};
  const aFn = obj => obj;

  const b = { integer: 1 };
  const bFn = obj => {
    obj.integer = 2;

    return obj;
  };

  const c = { integer: 1 };
  const cFn = obj => {
    obj.newValue = 1;

    return obj;
  };

  const d = { integer: 1 };
  const dFn = obj => ({ ...(obj.integer + 1) });

  const e = { integer: 1 };
  const eFn = obj => ({ ...obj, integer: 2 });

  const f = { array: [] };
  const fArray = [];
  const fFn = obj => {
    obj.array = fArray;

    return obj;
  };

  expect(detectMutatedState(a, aFn)).toBe(false);
  expect(detectMutatedState(b, bFn)).toBe(true);
  expect(detectMutatedState(c, cFn)).toBe(true);
  expect(detectMutatedState(d, dFn)).toBe(false);
  expect(detectMutatedState(e, eFn)).toBe(false);
  expect(detectMutatedState(f, fFn)).toBe(true);
});
