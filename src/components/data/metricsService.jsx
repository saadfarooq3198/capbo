import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Field picker helpers
const getFirstExistingField = (obj, fields) => {
  for (const field of fields) {
    if (obj && typeof obj[field] !== 'undefined') {
      return obj[field];
    }
  }
  return null;
};

const getDate = (obj) => getFirstExistingField(obj, ['created_date', 'run_at', 'createdAt', 'executed_at']);
const getProjectId = (obj) => getFirstExistingField(obj, ['project_id', 'projectId']);
const getStability = (obj) => getFirstExistingField(obj?.topline || obj, ['stability_score', 'stabilityScore']);

let forceReadLogged = false;

// Retry utility with VERY aggressive backoff for rate limiting
async function retryWithBackoff(fn, maxRetries = 5, baseDelay = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        const retryAfter = error.response?.headers?.['retry-after'];
        // Much more aggressive backoff: 3s, 6s, 12s, 24s, 48s
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        
        console.log(`[CABPOE] Rate limited, waiting ${Math.round(delay / 1000)}s before retry (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Lists decision runs with extensive logging for debugging
 */
export async function listDecisionRuns({ projectId, from, to, limit = 1000 }) {
  const isForceRead = localStorage.getItem('FORCE_READ') === '1';
  const domain = window.location.hostname;

  console.log(`[CABPOE] listDecisionRuns called:`, {
    domain,
    projectId,
    from: from?.toISOString(),
    to: to?.toISOString(),
    limit,
    forceRead: isForceRead
  });

  if (isForceRead && !forceReadLogged) {
    console.log('[CABPOE] FORCE_READ active — bypassing filters');
    forceReadLogged = true;
  }

  if (isForceRead) {
    try {
      const rawRuns = await retryWithBackoff(() => DecisionRun.list('-created_date', 200));
      console.log(`[CABPOE] FORCE_READ result — runs:${rawRuns.length}`);
      if (rawRuns.length > 0) {
        console.log('[CABPOE] Sample run:', rawRuns[0]);
      }
      return rawRuns;
    } catch (error) {
      console.error('[CABPOE] FORCE_READ failed:', error);
      return [];
    }
  }
  
  const startDate = from || startOfDay(subDays(new Date(), 90));
  const endDate = to || endOfDay(new Date());

  let filters = {};
  if (projectId) {
    filters.project_id = projectId;
  }

  console.log(`[CABPOE] Querying DecisionRun.filter with:`, {
    filters,
    sort: '-created_date',
    limit
  });

  try {
    const allRuns = await retryWithBackoff(() => DecisionRun.filter(filters, '-created_date', limit));
    
    console.log(`[CABPOE] DecisionRun.filter returned ${allRuns.length} runs for project ${projectId || 'all'}`);
    
    if (allRuns.length > 0) {
      console.log('[CABPOE] Sample run structure:', {
        keys: Object.keys(allRuns[0]),
        sample: allRuns[0]
      });
    } else {
      console.warn(`[CABPOE] Zero runs returned! This may indicate RLS filtering. Domain: ${domain}`);
    }
    
    const filtered = allRuns.filter(run => {
      const runDate = new Date(getDate(run));
      return runDate >= startDate && runDate <= endDate;
    });

    console.log(`[CABPOE] After date filtering: ${filtered.length} runs (${allRuns.length - filtered.length} filtered out)`);
    
    return filtered;
  } catch (error) {
    console.error('[CABPOE] Failed to list decision runs:', error);
    console.error('[CABPOE] Error details:', {
      message: error.message,
      status: error.status,
      response: error.response
    });
    return [];
  }
}

/**
 * Calculates key metrics for a single project with extensive logging
 */
export async function projectMetrics({ projectId, from, to }) {
  const domain = window.location.hostname;
  const startDate = from || startOfDay(subDays(new Date(), 90));
  const endDate = to || endOfDay(new Date());

  console.log(`[CABPOE] Loading metrics for project ${projectId} on ${domain}`);

  try {
    const startTime = Date.now();
    
    // Load runs first with retry logic
    const allRuns = await retryWithBackoff(() => DecisionRun.filter({ project_id: projectId }, '-created_date', 1000));
    
    // LONGER delay (2 seconds) before loading actions to ensure rate limit recovery
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Then load actions with retry logic
    const allActions = await retryWithBackoff(() => Action.filter({ project_id: projectId }, '-created_date', 1000));

    const loadTime = Date.now() - startTime;
    
    console.log(`[CABPOE] Project ${projectId} raw data (${loadTime}ms):`, {
      runs: allRuns.length,
      actions: allActions.length,
      domain
    });

    if (allRuns.length === 0) {
      console.warn(`[CABPOE] ⚠️ ZERO runs returned for project ${projectId} on ${domain}!`);
      console.warn('[CABPOE] This suggests RLS is filtering data. Try enabling FORCE_READ in debug banner.');
    }

    const runsInRange = allRuns.filter(run => {
      const runDate = new Date(getDate(run));
      return runDate >= startDate && runDate <= endDate;
    });

    const actionsInRange = allActions.filter(action => {
      const actionDate = new Date(getDate(action));
      return actionDate >= startDate && actionDate <= endDate;
    });

    const completedRuns = runsInRange.filter(run => 
      ['completed', 'success', 'done'].includes(run.status) && getStability(run) != null
    );

    let avgStability = null;
    if (completedRuns.length > 0) {
      const totalStability = completedRuns.reduce((sum, run) => {
        const score = typeof getStability(run) === 'string' 
          ? parseFloat(getStability(run)) 
          : getStability(run);
        return sum + (isNaN(score) ? 0 : score);
      }, 0);
      avgStability = totalStability / completedRuns.length;
    }
    
    const lastRun = runsInRange.length > 0 ? runsInRange[0] : null;

    const metrics = {
      total_runs: runsInRange.length,
      avg_stability: avgStability,
      actions: actionsInRange.length,
      alerts: null,
      last_run_at: lastRun ? getDate(lastRun) : null
    };

    console.log(`[CABPOE] Project ${projectId} metrics:`, metrics);

    return metrics;
  } catch (error) {
    console.error(`[CABPOE] Failed to load metrics for project ${projectId}:`, error);
    console.error('[CABPOE] Error details:', {
      message: error.message,
      status: error.status,
      stack: error.stack
    });
    return {
      total_runs: 0,
      avg_stability: null,
      actions: 0,
      alerts: null,
      last_run_at: null
    };
  }
}