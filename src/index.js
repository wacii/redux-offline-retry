import { applyMiddleware, compose } from 'redux';
import { createOfflineMiddleware } from './middleware';
import { enhanceReducer } from './updater';
import { defaultConfig } from './defaults';
import { networkStatusChanged } from './actions';

// @TODO: Take createStore as config?

export function offline(userConfig = {}) {
  return next => (reducer, state, enhancer) => {
    console.log('user config', userConfig);
    const config = Object.assign({}, defaultConfig, userConfig);

    console.log('Creating offline store', config);

    // wraps userland reducer with a top-level
    // reducer that handles offline state updating
    const offlineReducer = enhanceReducer(reducer);

    const offlineMiddleware = applyMiddleware(createOfflineMiddleware(config));

    // create store
    const store = offlineMiddleware(next)(offlineReducer, state, enhancer);

    // launch network detector
    if (config.detectNetwork) {
      config.detectNetwork(online => {
        store.dispatch(networkStatusChanged(online));
      });
    }

    return store;
  };
}
