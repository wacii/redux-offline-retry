export default function batch(outbox) {
  if (outbox.length > 0) {
    return [outbox[0]];
  }
  return [];
}
