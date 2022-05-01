
/**
 * This React component should wrap your application.
 * @param initialState The initial state of your app.
 * @param syncStateKeys Array of keys representing state values which should be synced across opened tabs or windows. For Example: ["user", "isLogged", "language"]
 * @param debug Array of debug levels you want to see in your console. Possible options are 1, 2 and 3. For example: [1,, 3]
 * @param children Usually this is you entire application. You can nest it wherever you want, but components above "StoreMe" won't be able to consume the global state.
 * @see https://github.com/mario-iliev/store-me#wrap-your-application-and-provide-the-initial-state
*/
export declare function StoreMe(initialState?: object, syncStateKeys?: array, debug?: [], children: ReactElement): void;

/**
 * This is a custom hook, used to retrieve state and it's changes.
 * @param stateKey One or multiple strings, separated by comma. Each string should represent key from the state object. For example: useStoreMe("user", "isLogged", "language");
 * @see https://github.com/mario-iliev/store-me#usestoreme
*/
export declare function useStoreMe(stateKey: string): object;

/**
 * This is the state update function of Store Me.
 * @param newState New state object or callback function that returns new state object. The callback functions will receive the entire current state as an argument.
 * @param skipUiUpdate If true, the state will be updated but not flushed to the "useStoreMe" hook. In order to flush them to the UI you must use the "renderStoreMe" function.
 * @see https://github.com/mario-iliev/store-me#setstoreme
*/
export declare function setStoreMe(newState: object | Function, skipUiUpdate?: boolean): void;

/**
 * This is a simple "get" function that retrieves a state on demand. It can be used outside of React components as well.
 * @param stateKey One or multiple strings, separated by comma. Each string should represent key from the state object. For example: useStoreMe("user", "isLogged", "language");
 * @see https://github.com/mario-iliev/store-me#getstoreme
*/
export declare function getStoreMe(stateKey: string): object;

/**
 * This function is need only if you used the second argument of "setStoreMe" and prevented some state from flushing to the UI. "renderStoreMe" will flush not rendered state to the respective components.
 * @param stateKey One or multiple strings, separated by comma. Each string should represent key from the state object. For example: useStoreMe("user", "isLogged", "language");
 * @see https://github.com/mario-iliev/store-me#renderstoreme
*/
export declare function renderStoreMe(stateKey: string): void;

/**
 * This function will reset the respective state to their initial one whenever "StoreMe" was initialized.
 * @param stateKey One or multiple strings, separated by comma. Each string should represent key from the state object. For example: useStoreMe("user", "isLogged", "language");
 * @see https://github.com/mario-iliev/store-me#resetstoreme
*/
export declare function resetStoreMe(stateKey: string): void;

/**
 * This function will delete state values, they will become undefined and component will re-render.
 * @param stateKey One or multiple strings, separated by comma. Each string should represent key from the state object. For example: useStoreMe("user", "isLogged", "language");
 * @see https://github.com/mario-iliev/store-me#deletestoreme
*/
export declare function deleteStoreMe(stateKey: string): void;

/**
 * This function will subscribe to state changes and return them into a callback function thus not causing a re-render to you component. This means that you are in charge of when your component will re-render (look at the link for code examples and recipes).
 * @param stateKey One or multiple strings passed in array. Each string should represent key from the state object. For example: useStoreMe(["user", "isLogged", "language"], (updatedState) => {});
 * @param callback This callback function will receive the updated state as an argument.
 * @see https://github.com/mario-iliev/store-me#storemesubscriber
*/
export declare function storeMeSubscriber(stateKey: array, callback: Function): Function;