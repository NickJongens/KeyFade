const startedAt = new Date();
const maxRecentEvents = Number(process.env.TELEMETRY_MAX_EVENTS || 500);

const totals = {
  failedAttempts: 0,
  corsDenials: 0,
  rateLimitHits: 0,
};

const recentEvents = [];
const ipStats = new Map();
const targetStats = new Map();
const trackedSecrets = new Map();
const inventoryTracking = {
  lastSyncedAt: null,
  lastUpdatedAt: null,
};

const eventTypeToCounter = {
  failed_attempt: 'failedAttempts',
  cors_denial: 'corsDenials',
  rate_limit_hit: 'rateLimitHits',
};

const safeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const incrementMapCounter = (map, key) => {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
};

const toSortedEntries = (map, limit, mapper) => {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(mapper);
};

const getBaseSecretId = (name) => (
  typeof name === 'string' && name.endsWith('-key') ? name.slice(0, -4) : name
);

const isKeyEntryName = (name) => typeof name === 'string' && name.endsWith('-key');

const buildInventorySnapshot = () => {
  let activeSecrets = 0;

  for (const state of trackedSecrets.values()) {
    if (state.hasSecret) activeSecrets += 1;
  }

  return {
    activeSecrets,
    trackingMode: 'cache_plus_runtime_updates',
    isSeededFromVaultScan: Boolean(inventoryTracking.lastSyncedAt),
    lastSyncedAt: inventoryTracking.lastSyncedAt,
    lastUpdatedAt: inventoryTracking.lastUpdatedAt,
  };
};

const markSecretEntryState = (secretName, exists, timestampIso) => {
  if (!secretName || typeof secretName !== 'string') return;

  const baseSecretId = getBaseSecretId(secretName);
  if (!baseSecretId) return;

  const state = trackedSecrets.get(baseSecretId) || {
    hasSecret: false,
    hasKey: false,
    updatedAt: null,
  };

  if (isKeyEntryName(secretName)) {
    state.hasKey = Boolean(exists);
  } else {
    state.hasSecret = Boolean(exists);
  }

  state.updatedAt = timestampIso;

  if (!state.hasSecret && !state.hasKey) {
    trackedSecrets.delete(baseSecretId);
    return;
  }

  trackedSecrets.set(baseSecretId, state);
};

const syncTrackedSecretsFromVaultNames = (secretNames = []) => {
  const timestampIso = new Date().toISOString();
  const nextTrackedSecrets = new Map();

  for (const secretName of secretNames) {
    if (!secretName || typeof secretName !== 'string') continue;

    const baseSecretId = getBaseSecretId(secretName);
    if (!baseSecretId) continue;

    const state = nextTrackedSecrets.get(baseSecretId) || {
      hasSecret: false,
      hasKey: false,
      updatedAt: timestampIso,
    };

    if (isKeyEntryName(secretName)) {
      state.hasKey = true;
    } else {
      state.hasSecret = true;
    }

    state.updatedAt = timestampIso;
    nextTrackedSecrets.set(baseSecretId, state);
  }

  trackedSecrets.clear();
  for (const [baseSecretId, state] of nextTrackedSecrets.entries()) {
    trackedSecrets.set(baseSecretId, state);
  }

  inventoryTracking.lastSyncedAt = timestampIso;
  inventoryTracking.lastUpdatedAt = timestampIso;
};

const noteSecretEntryCreated = (secretName) => {
  const timestampIso = new Date().toISOString();
  markSecretEntryState(secretName, true, timestampIso);
  inventoryTracking.lastUpdatedAt = timestampIso;
};

const noteSecretEntryDeleted = (secretName) => {
  const timestampIso = new Date().toISOString();
  markSecretEntryState(secretName, false, timestampIso);
  inventoryTracking.lastUpdatedAt = timestampIso;
};

const recordAbuseEvent = (type, details = {}) => {
  const timestamp = new Date();
  const counterKey = eventTypeToCounter[type];

  if (counterKey) {
    totals[counterKey] += 1;
  }

  const event = {
    timestamp: timestamp.toISOString(),
    type,
    ip: details.ip || 'unknown',
    method: details.method || null,
    path: details.path || null,
    origin: details.origin || null,
    secretId: details.secretId || null,
    reason: details.reason || null,
  };

  recentEvents.push(event);
  if (recentEvents.length > maxRecentEvents) {
    recentEvents.shift();
  }

  if (event.ip && event.ip !== 'unknown') {
    const currentIp = ipStats.get(event.ip) || {
      total: 0,
      failedAttempts: 0,
      corsDenials: 0,
      rateLimitHits: 0,
      lastSeen: null,
    };

    currentIp.total += 1;
    if (counterKey) {
      currentIp[counterKey] += 1;
    }
    currentIp.lastSeen = event.timestamp;
    ipStats.set(event.ip, currentIp);
  }

  incrementMapCounter(targetStats, event.path || event.origin);
};

const getAbuseTelemetrySnapshot = ({ recentLimit, hotLimit, targetLimit } = {}) => {
  const normalizedRecentLimit = safeInt(recentLimit, 50);
  const normalizedHotLimit = safeInt(hotLimit, 10);
  const normalizedTargetLimit = safeInt(targetLimit, 10);

  const hotIps = [...ipStats.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, normalizedHotLimit)
    .map(([ip, stats]) => ({
      ip,
      total: stats.total,
      failedAttempts: stats.failedAttempts,
      corsDenials: stats.corsDenials,
      rateLimitHits: stats.rateLimitHits,
      lastSeen: stats.lastSeen,
    }));

  const totalEvents =
    totals.failedAttempts + totals.corsDenials + totals.rateLimitHits;

  return {
    startedAt: startedAt.toISOString(),
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    totals: {
      ...totals,
      totalEvents,
    },
    hotIps,
    topTargets: toSortedEntries(
      targetStats,
      normalizedTargetLimit,
      ([target, count]) => ({ target, count })
    ),
    keyVaultInventory: buildInventorySnapshot(),
    recentEvents: recentEvents.slice(-normalizedRecentLimit).reverse(),
  };
};

module.exports = {
  recordAbuseEvent,
  getAbuseTelemetrySnapshot,
  syncTrackedSecretsFromVaultNames,
  noteSecretEntryCreated,
  noteSecretEntryDeleted,
};
