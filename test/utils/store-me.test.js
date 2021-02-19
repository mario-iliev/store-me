import {
  addNestedObjectTreeWithValue,
  createInitialStateStructure,
  createStructuredAccessors,
} from "../../src/utils/store-me";

test("Create StoreMe state structure", () => {
  const a = createInitialStateStructure({});
  const b = createInitialStateStructure({ valueKey: 123 });

  expect(JSON.stringify({}) === JSON.stringify(a)).toBe(true);
  expect(b.hasOwnProperty("valueKey")).toBe(true);
  expect(b.valueKey.default).toBe(123);
  expect(b.valueKey.current).toBe(123);
  expect(b.valueKey.previous).toBe(123);
});

test("Create object tree and last node to have provided value", () => {
  const a = ["levelOne", "levelTwo", "levelThree"];
  const b = ["levelOne"];
  const resultA = {};
  const resultB = {};

  addNestedObjectTreeWithValue(resultA, a, 123);
  expect(resultA.levelOne.levelTwo.levelThree).toBe(123);
  expect(resultA.levelOne.levelTwo.levelThree.levelFour).toBe(undefined);

  addNestedObjectTreeWithValue(resultB, b, 234);
  expect(resultB.levelOne).toBe(234);
  expect(resultB.levelOne.levelTwo).toBe(undefined);
});

test("Create structured accessors", () => {
  const a = createStructuredAccessors(["user", "settings", "account"]);
  const b = createStructuredAccessors([
    "user.name",
    "settings.notifications.marketing",
    "account.funds.[balance|deposit|profit]",
  ]);

  expect(a.length).toBe(3);
  expect(Array.isArray(a[0]) && Array.isArray(a[1]) && Array.isArray(a[2])).toBe(true);
  expect(a[0][0]).toBe("user");
  expect(a[1][0]).toBe("settings");
  expect(a[2][0]).toBe("account");

  expect(b.length).toBe(3);
  expect(Array.isArray(b[0]) && Array.isArray(b[1]) && Array.isArray(b[2])).toBe(true);
  expect(b[0].length).toBe(2);
  expect(b[0][0]).toBe("user");
  expect(b[0][1]).toBe("name");
  expect(b[1].length).toBe(3);
  expect(b[1][0]).toBe("settings");
  expect(b[1][1]).toBe("notifications");
  expect(b[1][2]).toBe("marketing");
  expect(b[2].length).toBe(3);
  expect(b[2][0]).toBe("account");
  expect(b[2][1]).toBe("funds");
  expect(Array.isArray(b[2][2])).toBe(true);
  expect(b[2][2].length).toBe(3);
  expect(b[2][2][0]).toBe("balance");
  expect(b[2][2][1]).toBe("deposit");
  expect(b[2][2][2]).toBe("profit");
});
