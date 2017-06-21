import {
  OFFLINE_STATUS_CHANGED,
  OFFLINE_SCHEDULE_RETRY,
  OFFLINE_COMPLETE_RETRY,
  OFFLINE_BUSY
} from "./constants";

export function networkStatusChanged(online) {
  return {
    type: OFFLINE_STATUS_CHANGED,
    payload: {
      online
    }
  };
}

export function scheduleRetry(delay = 0) {
  return {
    type: OFFLINE_SCHEDULE_RETRY,
    payload: {
      delay
    }
  };
}

export function completeRetry(action, retryToken) {
  return {
    type: OFFLINE_COMPLETE_RETRY,
    payload: action,
    meta: { retryToken }
  };
}

export function busy(isBusy) {
  return {
    type: OFFLINE_BUSY,
    payload: { busy: isBusy }
  };
}
