<p align="center">
<img src="https://marioiliev.com/images/store-me-logo.png" alt="React Store Me" height="123" />
</p>
<h3 align="center">Fast, flexible and lightweight global state manager for React.</h3>
<p align="center">Provides two APIs for both basic and more complex cases allowing you to control component updates.</p>

# Why "Store me"

**"Store me"** was created to provide easy way of using a global state in **React** but also giving the option to fine tune if you need to heavily optimize your React app performance. **"Store me"** is using React Hooks to re-render components with latest state. This package is not working with class based React components.

| Base methods              | Helpful methods                 | Fine tuning for complex cases           |
| ------------------------- | ------------------------------- | --------------------------------------- |
| [useStoreMe](#usestoreme) | [getStoreMe](#getstoreme)       | [renderStoreMe](#renderstoreme)         |
| [setStoreMe](#setstoreme) | [resetStoreMe](#resetstoreme)   | [storeMeSubscriber](#storemesubscriber) |
|                           | [deleteStoreMe](#deletestoreme) |                                         |

## Installation

```sh
npm i store-me
```

#### Wrap your application and provide the initial state

```js
// index.js
import { StoreMe } from "store-me";
import App from "./App";

const initialState = {
  isMenuExpanded: false,
  language: "en_US",
  user: {
    name: "John Doe",
    age: 21,
    is_premium: true,
    profit: "$1050",
    settings: {
      notifications_allowed: 1,
    },
  },
};

<StoreMe initialState={initialState}>
  <App />
</StoreMe>;
```

Or start with empty state and fill it later.

```js
// index.js
import { StoreMe } from "store-me";
import App from "./App";

<StoreMe>
  <App />
</StoreMe>;
```

[Read more](#api) about the debug prop and how it can help you.

```js
<StoreMe debug={[1, 3]}>
```

## useStoreMe

```js
import { useStoreMe, setStoreMe } from "store-me";

const App = () => {
  const { user, isMenuExpanded } = useStoreMe("user", "isMenuExpanded");

  return (
    <div onClick={() => setStoreMe({ isMenuExpanded: !isMenuExpanded })}>
      Hello, {user.name}! Click here to toggle the main menu.
    </div>
  );
};
```

#### Use with "Sub accessor"

In everyday React we import the **entire "user" object** in our component even if it needs only one or a few properties from it. This way we expose our components to many unwanted re-renders and depending on your application it could drastically affect performance.

**"Store me"** provides a "sub accessor" option. In this case the component will never re-render unless the user name changes.

```js
const App = () => {
  const { user } = useStoreMe("user.name");

  console.log(user);
  /*
  user: {
    name: "John Doe"
  }
  */

  return user.name;
};
```

#### Use with multiple "Sub accessors"

Accessing more than one **nested value** is also possible. This way you can "subscribe" only to non frequently updating values.

```js
const App = () => {
  const { user } = useStoreMe("user.[name|age|is_premium]");
  const { name, age, is_premium } = user;

  console.log(user);
  /*
  user: {
    name: "John Doe",
    age: 21,
    is_premium: true,
  }
  */

  return (
    <div className={is_premium ? "gold-color" : "silver-color"}>
      Hey {name}! You are {age} years old, so cool!
    </div>
  );
};
```

What if the user is not yet logged in? **"Store me"** will always provide the expected object structure.

```js
// Current global state:
const globalState = {
  isMenuExpanded: false,
  language: "en_US",
  user: false,
};

const App = () => {
  const { user } = useStoreMe("user.settings.notifications_allowed");

  console.log(user);
  /*
  user: {
    settings: {
      notifications_allowed: undefined
    }
  }
  */

  return <div>Click here to log in</div>;
};
```

#### With dynamic accessor

In the following example we will dynamically change the accessor and **"StoreMe"** will automatically re-subscribe to it.

```js
const globalState = {
  0: {
    name: "Batman",
    year: 1989,
    rating: 7.5,
  },
  1: {
    name: "The Matrix",
    year: 1999,
    rating: 8.7,
  },
};

const App = () => {
  const [currentMovieId, setCurrentMovieId] = useState(0);

  return (
    <div>
      <div onClick={() => setCurrentMovieId(prevId => prevId + 1)}>
        Click here for next movie
      </div>
      <MovieView movie_id={currentMovieId} />
    </div>
  );
};

const MovieView = movie_id => {
  const { [movie_id]: movie } = useStoreMe(movie_id);

  return (
    <div>
      Movie {movie.name} - {movie.year} | Rating: ${movie.rating}
    </div>
  );
};
```

## setStoreMe

#### Updating the global state

In the following examples we didn't consume the **"isMenuExpanded"** value with **useStoreMe** because it's not required for the component to have the state if we just need to update it.

```js
import { setStoreMe } from "store-me";

const App = () => {
  return (
    <>
      // Static value update
      <div onClick={() => setStoreMe({ isMenuExpanded: true })}>
        Expand Menu
      </div>
      // Static value update
      <div onClick={() => setStoreMe({ isMenuExpanded: false })}>
        Collapse Menu
      </div>
      // Dynamic value update
      <div
        onClick={() => {
          setStoreMe(({ isMenuExpanded }) => ({
            isMenuExpanded: !isMenuExpanded,
          }));
        }}
      >
        Toggle Menu
      </div>
      // Dynamic value update with complexity
      <div
        onClick={() => {
          setStoreMe(globalState => {
            const { user } = globalState;

            return { isMenuExpanded: user && user.age > 18 ? true : false };
          });
        }}
      >
        Open Menu if user is logged in and more than 18 years old.
      </div>
    </>
  );
};
```

## getStoreMe

#### Retrieve state on demand

It's not required to be subscribed to a specific state value in order to access it. **getStoreMe** can be used in various scenarios as you will see in the examples listed here.

In this situation, we want to send some data to the backend on click event. Untill the user initiate that click there is no point of having re-renders when the user object or the language changes. We can consume the state just when we want it.

```js
import { getStoreMe } from "store-me";

const App = () => {
  return (
    <div
      onClick={() => {
        const { user, language } = getStoreMe("user", "language");

        saveEventInTheDataBase(user.name, language);
      }}
    >
      I want to proceed!
    </div>
  );
};
```

## resetStoreMe

#### Reset values to their original state

It could be useful to reset some state with initial values, let's say when the user logs in or out.
**There are three different reset options.** For convinience let's show them in one place:

```js
import { useStoreMe, resetStoreMe } from "store-me";
import { useEffect } from "react";

const App = () => {
  const { user } = useStoreMe("user");

  useEffect(() => {
    if (!user) {
      /* Option 1. Reset specific values to their initial state when they were created */
      resetStoreMe("language", "isMenuExpanded");

      /* Option 2. Reset all values to their initial state when they were created  */
      resetStoreMe();

      /* Option 3. Reset the entire state with the initial one received when initializing StoreMe component */
      resetStoreMe("initial-store-me");
    }
  }, [user]);

  return <div>{user ? `Hello, ${user.name}` : "Click here to log in."}</div>;
};
```

## deleteStoreMe

#### Delete values from the state

In specific cases it could be useful to delete some state.

```js
import { useStoreMe, deleteStoreMe } from "store-me";
import { useEffect } from "react";

// Current global state:
const globalState = {
  movies_id: ["fpl-352-hmduwfi-98352-4938", "pln-653-jfeughw-64837-2645"],
  "fpl-352-hmduwfi-98352-4938": {
    name: "Batman",
    year: 1989,
    rating: 7.5,
  },
  "pln-653-jfeughw-64837-2645": {
    name: "The Matrix",
    year: 1999,
    rating: 8.7,
  },
};

const App = () => {
  const { movies_id } = useStoreMe("movies_id");

  useEffect(() => {
    if (!user) {
      deleteStoreMe("movies_id", ...movies_id);
    }
  }, [user]);

  return <div>{user ? `Hello, ${user.name}` : "Click here to log in."}</div>;
};
```

## renderStoreMe

#### Update React UI on demand

You will need this **only if** you use the second argument of [setStoreMe](#setstoreme)\
An example can be seen in the [Performance recepies](#setstoreme-and-renderstoreme)

# Performance recepies

## storeMeSubscriber

#### Manually subscribe for state updates

Depending on the type of your application you may need a way to fully control component updates. This is where the **"storeMeSubscriber"** comes into play. Let's see some possible usages and cases.

**Example 1.**
The goal is to update the component only when it's visible on the screen. This is useful for cases when frequently updated components are not always visible because of a scroll. Imagine 200 components in a scrollable list, showing the user profit changing 10 times per second.

```js
import { getStoreMe, storeMeSubscriber } from "store-me";
import { useState, useEffect } from "react";
import VisibilitySensor from "react-visibility-sensor";

const subscriptionKeys = ["user", "language"];

const App = () => {
  const [state, setState] = useState(getStoreMe(subscriptionKeys));
  const [isVisible, setIsVisible] = useState(true);

  const { user, language } = state;

  /*
  Every time "isVisible" becomes true, 
  the component will subscribe to any updates on the user and language values.
  If "isVisible" becomes false, the return function will unsubscribe.
  The reason for calling the "setState" when "isVisible" becomes true is to set 
  the latest values from the global state to our local component state.
  Keep in mind that "storeMeSubscriber" does not retrieve the state upon initialization,
  only when an actual update occurs.
  */

  useEffect(() => {
    if (isVisible) {
      const subscription = storeMeSubscriber(subscriptionKeys, setState);

      setState(getStoreMe(subscriptionKeys));

      return () => subscription();
    }
  }, [isVisible, storeMeSubscriber]);

  return (
    <VisibilitySensor onChange={setIsVisible}>
      <div>
        Hello {user.name}. Your profit is ${user.profit}
      </div>
    </VisibilitySensor>
  );
};
```

**Example 2.**
We are going to do the same thing with a different approach, just to show how much control you can have.

```js
import { getStoreMe, storeMeSubscriber } from "store-me";
import { useState, useEffect, useRef } from "react";
import VisibilitySensor from "react-visibility-sensor";

const subscriptionKeys = ["user", "language"];

const App = () => {
  const [state, setState] = useState(getStoreMe(subscriptionKeys));
  const isVisibleRef = useRef(true);

  const { user, language } = state;

  /*
  Instead of using "isVisible" state and subscribe/unsubscribe depending on it's value,
  we could be always subscribed but update our component state only when we want, using
  the React useRef to determine if we want or not.
  This is usefull if you have multiple conditions
  upon which you decide if you want to update or not.
  */
  useEffect(() => {
    const subscription = storeMeSubscriber(subscriptionKeys, data => {
      isVisible.current && setState(data);
    });

    return () => subscription();
  }, [storeMeSubscriber]);

  return (
    <VisibilitySensor
      onChange={isVisible => {
        isVisibleRef.current = isVisible;
      }}
    >
      <div>
        Hello {user.name}. Your profit is ${user.profit}
      </div>
    </VisibilitySensor>
  );
};
```

**Example 3.**
Controlling update frequency.
Let's say the user profit is updated from the backend **10 times per second**. This data is going into your global state but you want to display the changes every **5 seconds**.

```js
import { getStoreMe, storeMeSubscriber } from "store-me";
import { useState, useEffect, useRef } from "react";

const subscriptionKeys = ["user", "language"];

const App = () => {
  const [state, setState] = useState(getStoreMe(subscriptionKeys));

  const { user, language } = state;

  useEffect(() => {
    let lastUpdateTime = 0;
    let latestState = "no_updates_yet";
    const subscription = storeMeSubscriber(subscriptionKeys, data => {
      latestState = data;
    });

    const initAnimationFrame = (time = 0) => {
      requestAnimationFrame(initAnimationFrame);

      if (time - lastUpdateTime >= 5000) {
        lastUpdateTime = time;
        latestState !== "no_updates_yet" && setState(latestState);
      }
    };

    initAnimationFrame();

    return () => subscription();
  }, [storeMeSubscriber]);

  return (
    <div>
      Hello {user.name}. Your profit is ${user.profit}
    </div>
  );
};
```

## useStoreMe

Imagine that your application receives big list of movies to present. After receiving the initial list you will continue receive live and **frequent updates** for their ratings. If we have an array of 100 movie objects, then we update two of them, we will change the **entire list**, thus forcing React to re-render it.

One possible solution is to write each movie as a separate value in the global state and keep one array of all movie IDs. Then we will render the list **once** using the array of IDs and **subscribe** each movie independantly.
Later on if you need to add new movie in the list or sort the movies by some criteria, you will work with the array of IDs and cause re-render of the entire list only in those situations.

```js
// Current global state:
const globalState = {
  movies_id: ["fpl-352-hmduwfi-98352-4938", "pln-653-jfeughw-64837-2645"],
  "fpl-352-hmduwfi-98352-4938": {
    name: "Batman",
    year: 1989,
    rating: 7.5,
  },
  "pln-653-jfeughw-64837-2645": {
    name: "The Matrix",
    year: 1999,
    rating: 8.7,
  },
};

const App = () => {
  const { movies_id } = useStoreMe("movies_id");

  return movies_id.map(id => <Movie movie_id={id} />);
};

const Movie = movie_id => {
  const { [movie_id]: movie } = useStoreMe(movie_id);

  return (
    <div>
      Movie {movie.name} - {movie.year} | Rating: ${movie.rating}
    </div>
  );
};
```

## setStoreMe and renderStoreMe

Image that your application receives stream of data trough webSockets, severl times per second.
Multiple channels are sending different data which you want to display **at once** every 5 seconds.
Combinig the **second argument** of **setStoreMe** and manually render specific UI changes can achieve exactly this.

```js
// Current global state:
const globalState = {
  // Constanly updated 4 times per second
  movies_ratings: [
    { id: 1, rating: 7.5 },
    { id: 2, rating: 9 },
  ],
  // Constanly updated 2 times per second
  profits_by_rating: [
    { id: 1, profit: 760040 },
    { id: 2, profit: 1260040 },
  ],
  // Constanly updated 5 times per second
  comments: [
    { id: 1, text: "I love this movie..." },
    { id: 2, text: "I've seen better..." },
  ],
};

const App = () => {
  useEffect(() => {
    subscribeForMovieRatings(movies_ratings => {
      setStoreMe({ movies_ratings }, true);
    });

    subscribeForMovieProfits(profits_by_rating => {
      setStoreMe({ profits_by_rating }, true);
    });

    subscribeForMovieComments(comments => {
      setStoreMe({ comments }, true);
    });
  }, []);

  return <Consumer />;
};

const Consumer = () => {
  const { movies_ratings, profits_by_rating, comments } = useStoreMe(
    "movies_id"
  );

  useEffect(() => {
    let lastUpdateTime = 0;

    const initAnimationFrame = (time = 0) => {
      requestAnimationFrame(initAnimationFrame);

      if (time - lastUpdateTime >= 5000) {
        lastUpdateTime = time;
        renderStoreMe("movies_ratings", "profits_by_rating", "comments");
      }
    };

    initAnimationFrame();
  }, []);

  return (
    <div>
      Ratings: {movies_ratings.map(({ rating }) => rating)} <br />
      Profits: {profits_by_rating.map(({ profit }) => profit)} <br />
      Comments: {comments.map(({ text }) => text)} <br />
    </div>
  );
};
```

# API

**StoreMe**\
[Example](#wrap-your-application-and-provide-the-initial-state)\
_Type:_ `Component`\
_Arguments:_

- `initialState` of type object `{}`
- `debug` accepts `array` with `number` values. Example: `<StoreMe debug={[1, 2, 3]}>`\
  Currently there are 3 logs which you can see independantly by specifying their ID in the array.

  - 1 - Will show you how much time was needed for React to render the components which were affected of the last state change.
    This could help you to find components that take too much time to render and optimize them.\
     Example output:\
    `[1] React updated and rendered 005 components for 10.8799999980 ms [Array(5)]`
  - 2 - Will show you the time needed for StoreMe to check the new state differences and decide which component should be updated.\
    Example output:\
    `[2] StoreMe bilt components state for 1.8199999976786785 ms`
  - 3 - Will show you how many components are currently connected to StoreMe.\
    Example output:\
    `[3] Current StoreMe connected components: 2672`

_Returns:_ `children` prop

---

**useStoreMe**\
[Example](#usestoreme)\
_Type:_ `Hook/Function`\
_Arguments:_ `string` or `number`. Single or multiple separated by comma. The are three types of accessors.

- **Single**, for example `user`. Accessing any type of value.
- **Nested** `user.settings.app.theme`.
  Accessing nested property in object. It will always return object with the specified in the accessor structure even if "user" doesn't exist in the global state.
- **Nested multiple** `user.settings.app.[theme|version|type]`
  Accessing nested properties in object. It will always return object with the specified in the accessor structure even if "user" doesn't exist in the global state.

---

**setStoreMe**\
[Example](#setstoreme)\
_Type:_ `Function`\
_Arguments:_

- `object` with single or multiple values.
- `function` which should return an object. By using the function you will receive the entire state as an argument to it. This is the same as using the React `setState(prevCount => prevCount + 1)`

There is a second possible `boolean` argument which by default is set to `false`. If passed as true, **"StoreMe"** **will not render** those updates to the UI.
This option should be used with caution. Example usage can be seen [here](#setstoreme+rennderstoreme)\

---

**getStoreMe**\
[Example](#getstoreme)\
_Type:_ `Function`\
_Arguments:_ The same as **useStoreMe**. The are two differences with the **useStoreMe** method.

- It is not automatic subscription to the global state. It's rather an on demand data fetcher from the state.
- It will always fetch the state values, while useStoreMe is returning them when the value is changed.

---

**resetStoreMe**\
[Example](#resetstoreme)\
_Type:_ `Function`\
_Arguments:_

- `string/s` or `number/s` representing a **key/s** in the global state. **"Store me"** will reset the state of the specified keys to their initial value.
- If no argument is passed, **"Store me"** **will reset all state values** to their initial state when they were created.
- If you pass "initial-store-me" **"Store me"** **will reset the entire state** to the initial one received when initializing StoreMe component

---

**deleteStoreMe**\
[Example](#deletestoreme)\
_Type:_ `Function`\
_Arguments:_

- `string/s` or `number/s` representing a **key/s** in the global state. **"Store me"** will delete these values from the state as they never were.

---

**renderStoreMe**\
[Example](#renderstoreme)\
_Type:_ `Function`\
_Arguments:_

- `string/s` or `number/s` representing a **key/s** in the global state. **"Store me"** will re-render the UI for the specified accessors (if they were not rendered already).

---

**storeMeSubscriber**\
[Example](#storemesubscriber)\
_Type:_ `Function`\
_Arguments:_

- `array` with the same type of accessors as described in **useStoreMe**
- `function` which will be executed every time there is an update to the values you are subscribed for.

_Returns:_ `function` which will **unsubscribe** from **"Store me"** updates when the component is destroyed (unmounted).\
**You if you don't clean up your subscription you will cause yourself a memory leak.**
