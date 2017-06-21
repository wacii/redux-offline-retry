import { OFFLINE_SEND, OFFLINE_SCHEDULE_RETRY } from './constants';
import { completeRetry, scheduleRetry, busy } from './actions';

function after(timeout = 0) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function complete(action, success, payload) {
  return Object.assign({}, action, {
    payload,
    meta: Object.assign({}, action.meta, {
      completed: true
    })
  })
}

function take(state, config) {
  // batching is optional, for now
  if (config.batch) {
    return config.batch(state.offline.outbox);
  }

  return [state.offline.outbox[0]];
}

function send(action, dispatch, config, retries = 0) {
  const metadata = action.meta.offline;
  dispatch(busy(true));
  return config
    .effect(metadata.effect, action)
    .then(result => dispatch(complete(metadata.commit, true, result)))
    .catch(error => {
      // discard
      if (config.discard(error, action, retries)) {
        console.log('Discarding action', action.type);
        return dispatch(complete(metadata.rollback, false, error));
      }
      const delay = config.retry(action, retries);
      if (delay != null) {
        console.log('Retrying action', action.type, 'with delay', delay);
        return dispatch(scheduleRetry(delay));
      } else {
        console.log('Discarding action', action.type, 'because retry did not return a delay');
        return dispatch(complete(metadata.rollback, false, error));
      }
    });
}

export function createOfflineMiddleware(config) {
  return ({ getState, dispatch }) => next => action => {
    // allow other middleware to do their things
    const result = next(action);

    // find any actions to send, if any
    const state = getState();
    const actions = take(state, config);

    // if the are any actions in the queue that we are not
    // yet processing, send those actions
    if (
      actions.length > 0 &&
      !state.offline.busy &&
      !state.offline.retryScheduled &&
      state.offline.online
    ) {
      send(actions[0], dispatch, config, state.offline.retryCount);
    }

    if (action.type === OFFLINE_SCHEDULE_RETRY) {
      const retryToken = state.offline.retryToken;
      after(action.payload.delay).then(() => dispatch(completeRetry(retryToken)));
    }

    // if (action.type === 'Offline/COMPLETE_RETRY') {
    //   if (action.meta.retryToken === state.offline.retryToken && actions.length > 0) {
    //     send(actions[0], store.dispatch, config);
    //   }
    // }

    if (action.type === OFFLINE_SEND && actions.length > 0 && !state.offline.busy) {
      send(actions[0], dispatch, config, state.offline.retryCount);
    }

    return result;
  };
}
