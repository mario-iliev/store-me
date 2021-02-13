import equal from "fast-deep-equal";

import { getStateWithOriginalStructure } from "./store-me";
import cloneDeep from "./clone-deep";

export const detectedBadAccessors = accessors => {
  const badAccessors = [];

  accessors.forEach(accessor => {
    if (!["number", "string"].includes(typeof accessor)) {
      badAccessors.push(accessor);
    }
  });

  if (badAccessors.length) {
    console.error(
      `"getStoreMe" expects arguments of type string or number, specifying key in state but we saw these: `,
      badAccessors
    );

    return Boolean(badAccessors.length);
  }
};

export const detectMutatedState = (storeMeState, setStoreMeCallback) => {
  const stateForConsumer = getStateWithOriginalStructure(storeMeState);
  const stateBeforePotentialMutation = cloneDeep(stateForConsumer);

  const result = setStoreMeCallback(stateForConsumer);

  if (!equal(stateBeforePotentialMutation, stateForConsumer)) {
    const message = `You have mutated "StoreMe" global state. Clone the data before changing it.`;

    console.error(message, result ? "This happened when you set: " : "", result ? result : "");
  }
};
