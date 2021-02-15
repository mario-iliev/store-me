## [v1.4.4](https://github.com/mario-iliev/store-me/tree/1afe746bef7dc72c2a1cd062a4cdcc4a2eaf7a2c) (15-02-2021)

- Fix sync bug when using manual UI update with renderStoreMe
- Optimize some functions for more performance

## [v1.4.0](https://github.com/mario-iliev/store-me/tree/0625c0c01ba4ec57c390171ffb2d6e1b099f7937) (13-02-2021)

#### Support dynamically changing "accessor" for "useStoreMe" hook.

- In previous versions "useStoreMe" returned "undefined" for a key that was changed on the fly.
- Add more "accessor" validations in development mode.

## [v1.3.2](https://github.com/mario-iliev/store-me/tree/be24d410191a5df18b5bc708c6704d104f947c93) (11-02-2021)

#### Performance improvement

- Remove deep cloning state when using "previous state" from setStoreMe. Instead check for mutations only in development mode
- Replace npm with yarn. Use babel for build instead of webpack.

## [v1.3.1](https://github.com/mario-iliev/store-me/tree/787ca04255b6680b579981833db31b5d9c316436) (09-02-2021)

- Handle both list of arguments or array for methods: getStoreMe, resetStoreMe, deleteStoreMe and renderStoreMe

## [v1.3.0](https://github.com/mario-iliev/store-me/tree/4a6cdd2a423ec74b3f6aa21156d09322516e2e85) (04-02-2021)

- Add "performance" debug logs.

## [v1.2.0](https://github.com/mario-iliev/store-me/tree/9d8198cfd0f320eecd6a92201502c5970b7e7c98) (03-02-2021)

- Fix a UI state update race condition

## [v1.1.0](https://github.com/mario-iliev/store-me/tree/d874425d7b96191a2d7ca41c02318e130e2022d0) (02-02-2021)

#### Add one new method "renderStoreMe"

- Add new method "renderStoreMe" which is rendering the UI on demand
- Add second argument to "setStoreMe" method. If "true" it will skip the UI update when state is set.

## [v1.0.2](https://github.com/mario-iliev/store-me/tree/3ca6340e957389ecca95bf80b84b33faab0e8b04) (01-02-2021)

#### Remove React Context

- Provide "Store me" methods directly as modules of "store-me" package

## [v1.0.0](https://github.com/mario-iliev/store-me/tree/6cdbb4b7f1047a84ded53228115a837be3e217be) (30-01-2021)

#### First release

- First stable version of "Store me". In this release, "Store me" methods were provided trough React Context which was changed later.
