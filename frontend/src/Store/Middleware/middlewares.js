import { applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import createPersistState from './createPersistState';
import createSentryMiddleware from './createSentryMiddleware';

export default function () {
  const middlewares = [];
  const sentryMiddleware = createSentryMiddleware();

  if (sentryMiddleware) {
    middlewares.push(sentryMiddleware);
  }

  middlewares.push(thunk);

  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  return composeEnhancers(
    applyMiddleware(...middlewares),
    createPersistState()
  );
}
