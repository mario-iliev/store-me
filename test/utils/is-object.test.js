import isObject from "../../src/utils/is-object";

test("Detect if value is na object of type {}", () => {
  const object = isObject({});
  const array = isObject([]);
  const string = isObject("a");
  const number = isObject(1);
  const functionValue = isObject(function () {});
  const date = isObject(new Date());
  const nullValue = isObject(null);
  const undefinedValue = isObject(undefined);
  const falseValue = isObject(false);
  const trueValue = isObject(true);
  const voidValue = isObject(void 0);

  expect(object).toBe(true);
  expect(array).toBe(false);
  expect(string).toBe(false);
  expect(number).toBe(false);
  expect(functionValue).toBe(false);
  expect(date).toBe(false);
  expect(nullValue).toBe(false);
  expect(undefinedValue).toBe(false);
  expect(falseValue).toBe(false);
  expect(trueValue).toBe(false);
  expect(voidValue).toBe(false);
});
