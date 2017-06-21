import {
  OFFLINE_STATUS_CHANGED,
  OFFLINE_SCHEDULE_RETRY,
  OFFLINE_COMPLETE_RETRY,
  OFFLINE_BUSY,
  PERSIST_REHYDRATE
} from "./constants";

function enqueue(state, action) {
  const transaction = state.lastTransaction + 1;
  const stamped = { ...action, meta: { ...action.meta, transaction } };
  const outbox = state.outbox;
  return {
    ...state,
    lastTransaction: transaction,
    outbox: [...outbox, stamped]
  };
}

function dequeue(state) {
  const [, ...rest] = state.outbox;
  return { ...state, outbox: rest, retryCount: 0, busy: false };
}

const initialState = {
  busy: false,
  lastTransaction: 0,
  online: false,
  outbox: [],
  receipts: [],
  retryToken: 0,
  retryCount: 0,
  retryScheduled: false
};

function offlineUpdater(state = initialState, action) {
  // Update online/offline status
  if (
    action.type === OFFLINE_STATUS_CHANGED &&
    action.payload &&
    typeof action.payload.online === 'boolean'
  ) {
    return { ...state, online: action.payload.online };
  }

  if (action.type === PERSIST_REHYDRATE) {
    return { ...state, busy: false };
  }

  if (action.type === OFFLINE_SCHEDULE_RETRY) {
    return {
      ...state,
      busy: false,
      retryScheduled: true,
      retryCount: state.retryCount + 1,
      retryToken: state.retryToken + 1
    };
  }

  if (action.type === OFFLINE_COMPLETE_RETRY) {
    return { ...state, retryScheduled: false };
  }

  if (action.type === OFFLINE_BUSY && action.payload && typeof action.payload.busy === 'boolean') {
    return { ...state, busy: action.payload.busy };
  }

  // Add offline actions to queue
  if (action.meta && action.meta.offline) {
    return enqueue(state, action);
  }

  // Remove completed actions from queue (success or fail)
  if (action.meta != null && action.meta.completed === true) {
    return dequeue(state);
  }

  return state;
};

export function enhanceReducer(reducer) {
  return (state, action) => {
    let offlineState;
    let restState;
    if (typeof state !== 'undefined') {
      const { offline, ...rest } = state;
      offlineState = offline;
      restState = rest;
    }

    return {
      ...reducer(restState, action),
      offline: offlineUpdater(offlineState, action)
    };
  };
}
