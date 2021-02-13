import cloneDeep from "./clone-deep";
import log from "./log";

export function createInitialStateStructure(initialState) {
  const keys = Object.keys(initialState);
  const result = {};

  keys.forEach(key => {
    result[key] = {
      default: cloneDeep(initialState[key]),
      previous: cloneDeep(initialState[key]),
      current: initialState[key],
    };
  });

  return result;
}

export function createNestedObjectTree(keys, value) {
  return keys.reverse().reduce((result, key) => {
    const res = { [key]: result };

    if (result === value) {
      result = {};
    }

    return res;
  }, value);
}

export function createStructuredAccessors(accessors) {
  return accessors.map(accessor => {
    accessor = String(accessor).split(".");

    if (accessor.length > 1) {
      accessor = accessor.map(value =>
        String(value).includes("[") ? String(value).replace(/\[|\]/g, "").split("|") : value
      );
    }

    return accessor;
  });
}

export function createFirstLevelAccessors(accessors) {
  return accessors.map(accessor => String(accessor).split(".").shift());
}

export function syncPrevAndCurrentData(storeMeState, keysToSync) {
  (keysToSync || Object.keys(storeMeState)).forEach(key => {
    if (storeMeState.hasOwnProperty(key)) {
      storeMeState[key].previous = storeMeState[key].current;
    }
  });
}

export function getStateWithOriginalStructure(storeMeState) {
  const keys = Object.keys(storeMeState);
  const result = {};

  keys.forEach(key => {
    result[key] = storeMeState[key]?.current;
  });

  return result;
}

export function doesAccessorContainsNewStateKeys(accessors, newStateKeys) {
  const length = newStateKeys.length;
  let result = false;
  let i = 0;

  for (i; i < length; i++) {
    if (accessors.includes(newStateKeys[i])) {
      result = true;
      break;
    }
  }

  return result;
}

export function areAccessorsDifferent(a, b) {
  if (a.length !== b.length) {
    return 1;
  } else {
    const length = b.length;
    let result = 0;
    let i = 0;

    for (i; i < length; i++) {
      if (a[i] !== b[i]) {
        result = 1;
        break;
      }
    }

    return result;
  }
}

export function updateComponentsAndSyncState(storeMeState, subscriptions, componentsToUpdate) {
  function initialize() {
    const ids = Object.keys(componentsToUpdate).reverse();

    ids.forEach(recordId => {
      if (componentsToUpdate[recordId]) {
        const { id, update, accessors } = componentsToUpdate[recordId];

        syncPrevAndCurrentData(storeMeState, accessors);

        delete componentsToUpdate[recordId];

        subscriptions[id] && update();
      }
    });
  }

  if (log.debugUpdateTime) {
    const componentsCount = String(Object.keys(componentsToUpdate).length).padStart(3, "0");
    const accessors = [Object.values(componentsToUpdate).map(item => item.accessors.join(", "))];
    const start = performance.now();

    initialize();

    const time = (performance.now() - start).toFixed(10);

    log.measureUpdate(componentsCount, time, accessors);
  } else {
    initialize();
  }
}
