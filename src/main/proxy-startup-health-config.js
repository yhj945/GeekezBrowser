const MAX_PROXY_STARTUP_HEALTH_TIMEOUT_MS = 30000;

const DEFAULT_PROXY_STARTUP_HEALTH_CONFIG = Object.freeze({
    readyTimeoutMs: 2500,
    direct: Object.freeze({
        warmupMs: 300,
        fastReadyTimeoutMs: 2200,
        fastProbeTimeoutMs: 900,
        slowReadyTimeoutMs: 4300,
        slowProbeTimeoutMs: 4000
    }),
    preProxy: Object.freeze({
        warmupMs: 1200,
        fastReadyTimeoutMs: 4200,
        fastProbeTimeoutMs: 1800,
        slowReadyTimeoutMs: 9000,
        slowProbeTimeoutMs: 4000
    })
});

function normalizePositiveMilliseconds(value, fallback) {
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.min(Math.floor(value), MAX_PROXY_STARTUP_HEALTH_TIMEOUT_MS);
}

function normalizeStartupPhaseConfig(input, fallback) {
    const source = input && !Array.isArray(input) && typeof input === 'object' ? input : {};
    return {
        warmupMs: normalizePositiveMilliseconds(source.warmupMs, fallback.warmupMs),
        fastReadyTimeoutMs: normalizePositiveMilliseconds(source.fastReadyTimeoutMs, fallback.fastReadyTimeoutMs),
        fastProbeTimeoutMs: normalizePositiveMilliseconds(source.fastProbeTimeoutMs, fallback.fastProbeTimeoutMs),
        slowReadyTimeoutMs: normalizePositiveMilliseconds(source.slowReadyTimeoutMs, fallback.slowReadyTimeoutMs),
        slowProbeTimeoutMs: normalizePositiveMilliseconds(source.slowProbeTimeoutMs, fallback.slowProbeTimeoutMs)
    };
}

function normalizeProxyStartupHealthConfig(settings = {}) {
    const rawConfig = settings && !Array.isArray(settings) && typeof settings === 'object'
        ? settings.proxyStartupHealthCheck
        : null;
    const source = rawConfig && !Array.isArray(rawConfig) && typeof rawConfig === 'object' ? rawConfig : {};

    return {
        readyTimeoutMs: normalizePositiveMilliseconds(
            source.readyTimeoutMs,
            DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.readyTimeoutMs
        ),
        direct: normalizeStartupPhaseConfig(source.direct, DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.direct),
        preProxy: normalizeStartupPhaseConfig(source.preProxy, DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.preProxy)
    };
}

module.exports = {
    DEFAULT_PROXY_STARTUP_HEALTH_CONFIG,
    MAX_PROXY_STARTUP_HEALTH_TIMEOUT_MS,
    normalizeProxyStartupHealthConfig
};
