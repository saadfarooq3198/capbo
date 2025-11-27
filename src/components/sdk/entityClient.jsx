// DEPRECATED: This file is no longer needed.
// Base44 apps are single-tenant by design - each app instance IS the tenant.
// Use entities directly: import { Project } from "@/api/entities"
//
// This file is kept for backwards compatibility but all functions
// now just pass through to the original entities without modification.

import { Project } from "@/api/entities";
import { DecisionRun } from "@/api/entities";
import { Action } from "@/api/entities";

// Project pass-throughs
export const ProjectList = (...args) => Project.list(...args);
export const ProjectFilter = (...args) => Project.filter(...args);
export const ProjectGet = (...args) => Project.get(...args);
export const ProjectCreate = (...args) => Project.create(...args);
export const ProjectUpdate = (...args) => Project.update(...args);
export const ProjectDelete = (...args) => Project.delete(...args);

// DecisionRun pass-throughs
export const DecisionRunList = (...args) => DecisionRun.list(...args);
export const DecisionRunFilter = (...args) => DecisionRun.filter(...args);
export const DecisionRunGet = (...args) => DecisionRun.get(...args);
export const DecisionRunCreate = (...args) => DecisionRun.create(...args);
export const DecisionRunUpdate = (...args) => DecisionRun.update(...args);
export const DecisionRunDelete = (...args) => DecisionRun.delete(...args);

// Action pass-throughs
export const ActionList = (...args) => Action.list(...args);
export const ActionFilter = (...args) => Action.filter(...args);
export const ActionGet = (...args) => Action.get(...args);
export const ActionCreate = (...args) => Action.create(...args);
export const ActionUpdate = (...args) => Action.update(...args);
export const ActionDelete = (...args) => Action.delete(...args);

// Deprecated - always returns true since Base44 apps are single-tenant
export function hasTenantContext() {
  return true;
}

// Deprecated - returns app-level identifier
export function getEffectiveTenantId() {
  return 'app-level';
}