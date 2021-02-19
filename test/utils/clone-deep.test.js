import cloneDeep from "../../src/utils/clone-deep";

test("Deep cloning an object, avoid mutations", () => {
  const a = {
    booleanValue: 1,
    objectValue: { innerValue: 1 },
    arrayValue: [1, 2, 3],
    valueToDelete: {},
  };
  const b = cloneDeep(a);

  b.booleanValue = 2;
  b.objectValue.innerValue = 2;
  b.arrayValue.push(4);

  delete b.valueToDelete;

  b.addedNewValue = 1;

  expect(a.booleanValue).toBe(1);
  expect(a.objectValue.innerValue).toBe(1);
  expect(a.arrayValue.length).toBe(3);
  expect(typeof a.valueToDelete).toBe("object");
  expect(typeof a.addedNewValue).toBe("undefined");
});
