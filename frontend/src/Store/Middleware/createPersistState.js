import _ from 'lodash';
import actions from 'Store/Actions';
import migrate from 'Store/Migrators/migrate';

const columnPaths = [];

const paths = _.reduce([...actions], (acc, action) => {
  if (action.persistState) {
    action.persistState.forEach((path) => {
      if (path.match(/\.columns$/)) {
        columnPaths.push(path);
      }

      acc.push(path);
    });
  }

  return acc;
}, []);

function mergeColumns(path, initialState, persistedState, computedState) {
  const initialColumns = _.get(initialState, path);
  const persistedColumns = _.get(persistedState, path);

  if (!persistedColumns || !persistedColumns.length) {
    return;
  }

  const columns = [];

  // Add persisted columns in the same order they're currently in
  // as long as they haven't been removed.

  persistedColumns.forEach((persistedColumn) => {
    const column = initialColumns.find((i) => i.name === persistedColumn.name);

    if (column) {
      const newColumn = {};

      // We can't use a spread operator or Object.assign to clone the column
      // or any accessors are lost and can break translations.
      for (const prop of Object.keys(column)) {
        Object.defineProperty(newColumn, prop, Object.getOwnPropertyDescriptor(column, prop));
      }

      newColumn.isVisible = persistedColumn.isVisible;

      columns.push(newColumn);
    }
  });

  // Add any columns added to the app in the initial position.
  initialColumns.forEach((initialColumn, index) => {
    const persistedColumnIndex = persistedColumns.findIndex((i) => i.name === initialColumn.name);
    const column = Object.assign({}, initialColumn);

    if (persistedColumnIndex === -1) {
      columns.splice(index, 0, column);
    }
  });

  // Set the columns in the persisted state
  _.set(computedState, path, columns);
}

function slicerFn(state) {
  const subset = {};

  paths.forEach((path) => {
    _.set(subset, path, _.get(state, path));
  });

  return subset;
}

function serialize(obj) {
  return JSON.stringify(obj, null, 2);
}

function merge(initialState, persistedState) {
  if (!persistedState) {
    return initialState;
  }

  const computedState = {};

  _.merge(computedState, initialState, persistedState);

  columnPaths.forEach((columnPath) => {
    mergeColumns(columnPath, initialState, persistedState, computedState);
  });

  return computedState;
}

const KEY = 'sonarr';
const storageKey = window.Sonarr.instanceName.toLowerCase().replace(/ /g, '_') || KEY;

// Store enhancer that syncs a subset of Redux state to localStorage.
// Replaces the redux-localstorage package with an inline implementation.
export default function createPersistState() {
  // Migrate existing local storage value to new key if it does not already exist.
  // Leave old value as-is in case there are multiple instances using the same key.
  if (storageKey !== KEY && localStorage.getItem(KEY) && !localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, localStorage.getItem(KEY));
  }

  // Migrate existing local storage before proceeding
  const existingState = JSON.parse(localStorage.getItem(storageKey));
  migrate(existingState);
  localStorage.setItem(storageKey, serialize(existingState));

  return (next) => (reducer, initialState, enhancer) => {
    if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
      enhancer = initialState;
      initialState = undefined;
    }

    let persistedState;
    let finalInitialState;

    try {
      persistedState = JSON.parse(localStorage.getItem(storageKey));
      finalInitialState = merge(initialState, persistedState);
    } catch (e) {
      console.warn('Failed to retrieve state from localStorage:', e);
      finalInitialState = initialState;
    }

    const store = next(reducer, finalInitialState, enhancer);

    store.subscribe(() => {
      const state = store.getState();
      const subset = slicerFn(state);

      try {
        localStorage.setItem(storageKey, serialize(subset));
      } catch (e) {
        console.warn('Unable to persist state to localStorage:', e);
      }
    });

    return store;
  };
}
