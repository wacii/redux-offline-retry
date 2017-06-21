export default function discard(error, action, _retries = 0) {
  // not a network error -> discard
  if (!('status' in error)) {
    return true;
  }

  //discard http 4xx errors
  return error.status >= 400 && error.status < 500;
};
