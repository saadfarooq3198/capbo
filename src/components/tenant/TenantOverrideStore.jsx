// DEPRECATED: This file is no longer needed.
// Base44 apps are single-tenant by design.
// Keeping empty file for backwards compatibility.

export function getOverride() {
  return null;
}

export function setOverride() {
  return null;
}

export function clearOverride() {
  // No-op
}

export function isSet() {
  return false;
}

export function onChange() {
  return () => {};
}