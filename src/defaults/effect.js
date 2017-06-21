export function NetworkError(response, status) {
  this.name = 'NetworkError';
  this.status = status;
  this.response = response;
}

NetworkError.prototype = Error.prototype;
NetworkError.prototype.status = null;

function tryParseJSON(json) {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`Failed to parse unexpected JSON response: ${json}`);
  }
}


function getResponseBody (res) {
  const contentType = res.headers.get('content-type');
  return contentType.indexOf('json') >= 0 ? res.text().then(tryParseJSON) : res.text();
}

export default function effect(effect, _action) {
  const { url, ...options } = effect;
  const headers = { 'content-type': 'application/json', ...options.headers };
  return fetch(url, { ...options, headers }).then(res => {
    if (res.ok) {
      return getResponseBody(res);
    } else {
      return getResponseBody(res).then(body => {
        throw new NetworkError(body || '', res.status);
      });
    }
  });
}
