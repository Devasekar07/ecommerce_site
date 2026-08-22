const guestCartStorageKey = "fashion-rail-guest-cart-id";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateGuestCartId() {
  const existing = window.localStorage.getItem(guestCartStorageKey);

  if (existing && uuidPattern.test(existing)) {
    return existing;
  }

  const nextId = window.crypto.randomUUID();
  window.localStorage.setItem(guestCartStorageKey, nextId);
  return nextId;
}

export function clearGuestCartId() {
  window.localStorage.removeItem(guestCartStorageKey);
}

export function getGuestCartHeaders() {
  return {
    "x-guest-cart-id": getOrCreateGuestCartId()
  };
}
