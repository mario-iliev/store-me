import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";

import cloneDeep from "../utils/cloneDeep";
import isObject from "../utils/isObject";

const StoreMeContext = createContext({});
const subscriptions = {};
let lastSubscriptionId = 0;
let state = null;

const useStoreMeActions = () => useContext(StoreMeContext);

const StoreMe = ({ initialState = {}, children }) => {
  Object.freeze(initialState);

  if (!state) {
    state = createInitialStateStructure(initialState);
  }

  const getDataAndCompareChanges = useCallback(
    (accessors, ignoreCompares = false, newStateKeys) => {
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
    },
    []
  );

  const storeMeSubscriber = useCallback((accessors, callback) => {
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
  }, []);

  const runStoreMeSubscriptions = useCallback(
    (ignoreCompares, newStateKeys) => {
      const ids = Object.keys(subscriptions);
      const componentsToUpdate = [];

      ids.forEach(id => {
        if (subscriptions[id]) {
          const { accessors, callback } = subscriptions[id];
          const data = getDataAndCompareChanges(accessors, ignoreCompares, newStateKeys);

          if (data !== "skip_update") {
            componentsToUpdate.push({
              id,
              update: () => callback(data),
              accessors: accessors.firstLevel,
            });
          }
        }
      });

      updateComponentsAndSyncState(componentsToUpdate);
    },
    [getDataAndCompareChanges]
  );

  const getStoreMe = useCallback(
    accessors => {
      if (Array.isArray(accessors) && accessors.length) {
        accessors = {
          structured: createStructuredAccessors(accessors),
          firstLevel: createFirstLevelAccessors(accessors),
        };

        return getDataAndCompareChanges(accessors, true);
      } else {
        console.error(
          `"getStoreMe" expects arguments of type string or number, specifying key in state.`
        );

        return {};
      }
    },
    [getDataAndCompareChanges]
  );

  const setStoreMe = useCallback(
    data => {
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
              state[key].current = window[key] ? data[key] : cloneDeep(data[key]);
            }
          } else {
            shouldRunSubscriptions = true;
            state[key] = {
              default: window[key] ? data[key] : cloneDeep(data[key]),
              previous: "non-existent",
              current: data[key],
            };
          }
        });

        shouldRunSubscriptions && runStoreMeSubscriptions(false, keys);
      } else {
        console.error(`"setStoreMe" expects argument of type object or function.`);
      }
    },
    [runStoreMeSubscriptions]
  );

  const resetStoreMe = useCallback(
    (...accessors) => {
      let shouldRunSubscriptions = false;

      accessors = accessors || Object.keys(state);

      if (accessors.length === 1 && accessors[0] === "initial-store-me") {
        shouldRunSubscriptions = true;
        state = createInitialStateStructure(initialState);
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
    },
    [initialState, runStoreMeSubscriptions]
  );

  const deleteStoreMe = useCallback(
    (...accessors) => {
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
          `"deleteStoreMe" expects arguments of type string or number, specifying key in state.`
        );
      }
    },
    [runStoreMeSubscriptions]
  );

  const dangerouslyGetStoreMeMutableState = useCallback(() => state, []);

  return (
    <StoreMeContext.Provider
      value={{
        setStoreMe,
        getStoreMe,
        resetStoreMe,
        deleteStoreMe,
        storeMeSubscriber,
        runStoreMeSubscriptions,
        dangerouslyGetStoreMeMutableState,
      }}
    >
      {children}
    </StoreMeContext.Provider>
  );
};

function createInitialStateStructure(initialState) {
  const keys = Object.keys(initialState);
  const result = {};

  keys.push("stopStoreMeUiUpdates");

  keys.forEach(key => {
    result[key] = {
      default: window[key] ? initialState[key] : cloneDeep(initialState[key]),
      previous: window[key] ? initialState[key] : cloneDeep(initialState[key]),
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
    result[key] = state[key].current;
  });

  return cloneDeep(result);
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

function updateComponentsAndSyncState(queue) {
  const componentToUpdate = queue.shift();

  if (componentToUpdate) {
    const { id, update, accessors } = componentToUpdate;

    syncPrevAndCurrentData(accessors);

    subscriptions[id] && update();

    queue.length && updateComponentsAndSyncState(queue);
  }
}

const useStoreMe = (...accessors) => {
  const { storeMeSubscriber, getStoreMe } = useStoreMeActions();
  const memoizedAccessors = useRef(accessors);
  const [state, setState] = useState(
    useMemo(() => getStoreMe(memoizedAccessors.current), [getStoreMe])
  );

  useEffect(() => {
    if (memoizedAccessors.current.length) {
      const subscription = storeMeSubscriber(memoizedAccessors.current, setState);

      return () => subscription();
    } else {
      console.error(`"useStoreMe": At least one accessor must be specified`);
    }
  }, [storeMeSubscriber]);

  return state;
};

export { StoreMe, useStoreMe, useStoreMeActions };
