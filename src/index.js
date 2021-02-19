import { useEffect, useState, useMemo, useRef } from "react";

import { detectedBadAccessors, detectMutatedState } from "./utils/dev";
import {
  doesAccessorContainsNewStateKeys,
  getStateWithOriginalStructure,
  updateComponentsAndSyncState,
  addNestedObjectTreeWithValue,
  createInitialStateStructure,
  createStructuredAccessors,
  createFirstLevelAccessors,
  areAccessorsDifferent,
} from "./utils/store-me";
import cloneDeep from "./utils/clone-deep";
import isObject from "./utils/is-object";
import log from "./utils/log";

const skipStateSyncForKeys = {};
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

    addNestedObjectTreeWithValue(result, acessorsPath, lastCurr);
  });

  return shouldUpdate || ignoreCompares ? result : "skip_update";
};

const storeMeSubscriber = (accessors, callback) => {
  if (accessors.length) {
    if (process.env.NODE_ENV === "development" && detectedBadAccessors(accessors)) {
      return () => {};
    }

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
  } else {
    console.error(
      `"storeMeSubscriber" expects at least one argument of type string or number, specifying key in state.`,
      accessors
    );
  }
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

  updateComponentsAndSyncState(state, subscriptions, componentsToUpdate, skipStateSyncForKeys);
};

const getStoreMe = (...accessors) => {
  if (Array.isArray(accessors[0])) {
    accessors = accessors[0];
  }

  if (accessors.length) {
    if (process.env.NODE_ENV === "development" && detectedBadAccessors(accessors)) {
      return {};
    }

    accessors = {
      structured: createStructuredAccessors(accessors),
      firstLevel: createFirstLevelAccessors(accessors),
    };

    return getDataAndCompareChanges(accessors, true);
  } else {
    console.error(
      `"getStoreMe" expects at least one argument of type string or number, specifying key in state.`,
      accessors
    );

    return {};
  }
};

const setStoreMe = (data, skipUiUpdate = false) => {
  if (typeof data === "function") {
    process.env.NODE_ENV === "development" && detectMutatedState(state, data);

    data = data(getStateWithOriginalStructure(state));
  }

  if (isObject(data)) {
    const keys = Object.keys(data);
    const newStateKeys = [];

    keys.forEach(key => {
      if (state.hasOwnProperty(key)) {
        if (state[key].current !== data[key]) {
          newStateKeys.push(key);
          state[key].current = cloneDeep(data[key]);
        }
      } else {
        newStateKeys.push(key);
        state[key] = {
          default: cloneDeep(data[key]),
          previous: cloneDeep(data[key]),
          current: data[key],
        };
      }
    });

    skipUiUpdate &&
      newStateKeys.forEach(key => {
        skipStateSyncForKeys[key] = 1;
      });

    !skipUiUpdate && newStateKeys.length && runStoreMeSubscriptions(false, newStateKeys);
  } else {
    console.error(`"setStoreMe" expects argument of type object or function but received: `, data);
  }
};

const resetStoreMe = (...accessors) => {
  let shouldRunSubscriptions = false;

  if (Array.isArray(accessors[0])) {
    accessors = accessors[0];
  }

  if (process.env.NODE_ENV === "development" && detectedBadAccessors(accessors)) {
    return;
  }

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
            previous: cloneDeep(state[accessor].default),
            current: cloneDeep(state[accessor].default),
          };
        }
      }
    });
  }

  shouldRunSubscriptions && runStoreMeSubscriptions(false, accessors);
};

const deleteStoreMe = (...accessors) => {
  if (Array.isArray(accessors[0])) {
    accessors = accessors[0];
  }

  if (accessors.length) {
    if (process.env.NODE_ENV === "development" && detectedBadAccessors(accessors)) {
      return;
    }

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
  if (Array.isArray(accessors[0])) {
    accessors = accessors[0];
  }

  if (process.env.NODE_ENV === "development" && detectedBadAccessors(accessors)) {
    return;
  }

  accessors.forEach(accessor => {
    delete skipStateSyncForKeys[accessor];
  });

  runStoreMeSubscriptions(false, accessors.length ? accessors : null);
};

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
  const lastAccessors = useRef(accessors);
  const stateUsesLastAccessors = useRef(1);
  const manuallyFetchedState = useRef();
  const subscription = useRef();
  const [state, setState] = useState(useMemo(() => getStoreMe(lastAccessors.current), []));
  const accessorsAreDifferent = areAccessorsDifferent(lastAccessors.current, accessors);

  if (accessorsAreDifferent || !subscription.current) {
    if (accessorsAreDifferent) {
      lastAccessors.current = accessors;
      stateUsesLastAccessors.current = 0;
      manuallyFetchedState.current = lastAccessors.current.length
        ? getStoreMe(lastAccessors.current)
        : {};

      subscription.current();
    }

    if (lastAccessors.current.length) {
      subscription.current = storeMeSubscriber(lastAccessors.current, newState => {
        stateUsesLastAccessors.current = 1;

        setState(newState);
      });
    } else {
      console.error(`"useStoreMe": At least one accessor must be specified`);
    }
  }

  useEffect(() => {
    return () => subscription.current();
  }, []);

  return stateUsesLastAccessors.current ? state : manuallyFetchedState.current;
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
