import { useEffect, useState, useMemo, useRef } from "react";

import cloneDeep from "../utils/cloneDeep";
import isObject from "../utils/isObject";
import log from "../utils/log";

const componentsToUpdate = {};
const subscriptions = {};
let lastSubscriptionId = 0;
let storeMeInitialState;
let state = null;

const getDataAndCompareChanges = (accessors, ignoreCompares = false, newStateKeys) => {
  if (newStateKeys && !doesAccessorContainsNewStateKeys(accessors.firstLevel, newStateKeys)) {
    return "skip_update";
  }

  let shouldUpdate = false;
  let result = {};

  accessors.structured.forEach(group => {
    const acessorsPath = group.filter(accessor => !Array.isArray(accessor));
    const groupLength = group.length;
    let lastPrev;
    let lastCurr;

    group.forEach((accessor, i) => {
      const isLastKey = i + 1 === groupLength;

      if (i === 0) {
        lastPrev = state[accessor]?.previous;
        lastCurr = state[accessor]?.current;

        if (!shouldUpdate && isLastKey && lastPrev !== lastCurr) {
          shouldUpdate = true;
        }
      } else {
        if (Array.isArray(accessor)) {
          const prevSubAccessorValues = {};
          const currSubAccessorValues = {};

          accessor.forEach(subAccessor => {
            prevSubAccessorValues[subAccessor] = lastPrev?.[subAccessor];
            currSubAccessorValues[subAccessor] = lastCurr?.[subAccessor];

            if (
              !shouldUpdate &&
              prevSubAccessorValues[subAccessor] !== currSubAccessorValues[subAccessor]
            ) {
              shouldUpdate = true;
            }
          });

          lastCurr = currSubAccessorValues;
        } else {
          lastPrev = lastPrev?.[accessor];
          lastCurr = lastCurr?.[accessor];

          if (!shouldUpdate && isLastKey && lastPrev !== lastCurr) {
            shouldUpdate = true;
          }
        }
      }
    });

    result = { ...result, ...createNestedObjectTree(acessorsPath, lastCurr) };
  });

  return shouldUpdate || ignoreCompares ? result : "skip_update";
};

const storeMeSubscriber = (accessors, callback) => {
  const id = lastSubscriptionId++;

  subscriptions[id] = {
    callback,
    accessors: {
      structured: createStructuredAccessors(accessors),
      firstLevel: createFirstLevelAccessors(accessors),
    },
  };

  return () => {
    delete subscriptions[id];
  };
};

const runStoreMeSubscriptions = (ignoreCompares, newStateKeys) => {
  const ids = Object.keys(subscriptions);

  function init() {
    ids.forEach(id => {
      if (subscriptions[id]) {
        const { accessors, callback } = subscriptions[id];
        const data = getDataAndCompareChanges(accessors, ignoreCompares, newStateKeys);

        if (data !== "skip_update") {
          componentsToUpdate[id] = {
            id,
            update: () => callback(data),
            accessors: accessors.firstLevel,
          };
        }
      }
    });
  }

  if (log.debugDataBuildTime) {
    const start = performance.now();

    init();

    log.dataBuildTime(performance.now() - start);
  } else {
    init();
  }

  if (log.debugSubscriptions) {
    log.subscriptionsCount(ids.length);
  }

  updateComponentsAndSyncState();
};

const getStoreMe = (...accessors) => {
  if (accessors.length && Array.isArray(accessors[0])) {
    accessors = accessors[0];
  }

  if (accessors.length) {
    accessors = {
      structured: createStructuredAccessors(accessors),
      firstLevel: createFirstLevelAccessors(accessors),
    };

    return getDataAndCompareChanges(accessors, true);
  } else {
    console.error(
      `"getStoreMe" expects arguments of type string or number, specifying key in state.`,
      accessors
    );

    return {};
  }
};

const setStoreMe = (data, skipUiUpdate = false) => {
  if (typeof data === "function") {
    data = data(getStateWithOriginalStructure());
  }

  if (isObject(data)) {
    const keys = Object.keys(data);
    let shouldRunSubscriptions = false;

    keys.forEach(key => {
      if (state.hasOwnProperty(key)) {
        if (state[key].current !== data[key]) {
          shouldRunSubscriptions = true;
          state[key].current = cloneDeep(data[key]);
        }
      } else {
        shouldRunSubscriptions = true;
        state[key] = {
          default: cloneDeep(data[key]),
          previous: "non-existent",
          current: data[key],
        };
      }
    });

    !skipUiUpdate && shouldRunSubscriptions && runStoreMeSubscriptions(false, keys);
  } else {
    console.error(`"setStoreMe" expects argument of type object or function.`, data);
  }
};

const resetStoreMe = (...accessors) => {
  let shouldRunSubscriptions = false;

  accessors = accessors || Object.keys(state);

  if (accessors.length === 1 && accessors[0] === "initial-store-me") {
    shouldRunSubscriptions = true;
    state = createInitialStateStructure(storeMeInitialState);
  } else {
    accessors.forEach(accessor => {
      if (state.hasOwnProperty(accessor)) {
        if (state[accessor].current !== state[accessor].default) {
          shouldRunSubscriptions = true;

          state[accessor] = {
            default: state[accessor].default,
            previous: "non-existent",
            current: cloneDeep(state[accessor].default),
          };
        }
      }
    });
  }

  shouldRunSubscriptions && runStoreMeSubscriptions(false, accessors);
};

const deleteStoreMe = (...accessors) => {
  if (accessors.length) {
    let shouldRunSubscriptions = false;

    accessors.forEach(accessor => {
      if (state.hasOwnProperty(accessor)) {
        shouldRunSubscriptions = true;

        delete state[accessor];
      }
    });

    shouldRunSubscriptions && runStoreMeSubscriptions(true, accessors);
  } else {
    console.error(
      `"deleteStoreMe" expects arguments of type string or number, specifying key in state.`,
      accessors
    );
  }
};

const renderStoreMe = (...accessors) => {
  if (accessors.length && Array.isArray(accessors[0])) {
    accessors = accessors[0];
  }

  runStoreMeSubscriptions(false, accessors.length ? accessors : null);
};

function createInitialStateStructure(initialState) {
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

function createNestedObjectTree(keys, value) {
  return keys.reverse().reduce((result, key) => {
    const res = { [key]: result };

    if (result === value) {
      result = {};
    }

    return res;
  }, value);
}

function createStructuredAccessors(accessors) {
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

function createFirstLevelAccessors(accessors) {
  return accessors.map(accessor => String(accessor).split(".").shift());
}

function syncPrevAndCurrentData(keysToSync) {
  (keysToSync || Object.keys(state)).forEach(key => {
    if (state.hasOwnProperty(key)) {
      state[key].previous = state[key].current;
    }
  });
}

function getStateWithOriginalStructure() {
  const keys = Object.keys(state);
  const result = {};

  keys.forEach(key => {
    result[key] = cloneDeep(state[key]?.current);
  });

  return result;
}

function doesAccessorContainsNewStateKeys(accessors, newStateKeys) {
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

function updateComponentsAndSyncState() {
  function initialize() {
    const ids = Object.keys(componentsToUpdate).reverse();

    ids.forEach(recordId => {
      if (componentsToUpdate[recordId]) {
        const { id, update, accessors } = componentsToUpdate[recordId];

        syncPrevAndCurrentData(accessors);

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

const StoreMe = ({ initialState = {}, debug = [], children }) => {
  if (!state) {
    storeMeInitialState = initialState;

    Object.freeze(storeMeInitialState);

    state = createInitialStateStructure(storeMeInitialState);
  }

  if (Array.isArray(debug)) {
    log.debugUpdateTime = debug.includes(1);
    log.debugDataBuildTime = debug.includes(2);
    log.debugSubscriptions = debug.includes(3);
  }

  return children;
};

const useStoreMe = (...accessors) => {
  const memoizedAccessors = useRef(accessors);
  const [state, setState] = useState(useMemo(() => getStoreMe(memoizedAccessors.current), []));

  useEffect(() => {
    if (memoizedAccessors.current.length) {
      const subscription = storeMeSubscriber(memoizedAccessors.current, setState);

      return () => subscription();
    } else {
      console.error(`"useStoreMe": At least one accessor must be specified`);
    }
  }, []);

  return state;
};

export {
  StoreMe,
  useStoreMe,
  setStoreMe,
  getStoreMe,
  resetStoreMe,
  deleteStoreMe,
  renderStoreMe,
  storeMeSubscriber,
};
