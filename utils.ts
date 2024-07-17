const ID_RE = /^[a-z0-9-_]+$/i;

export function validateId(id: string) {
  if (id.length > 255) {
    return false;
  }
  return Boolean(id.match(ID_RE));
}
