const MAX_PROXY_PROBE_TARGETS = 8;
const MAX_PROXY_PROBE_TEXT_LENGTH = 4096;
const MAX_PROXY_PROBE_URL_LENGTH = 512;

const DEFAULT_PROXY_PROBE_TARGETS = [
    { url: 'https://www.gstatic.com/generate_204', expectedStatus: 204 },
    { url: 'https://cp.cloudflare.com/generate_204', expectedStatus: 204 },
    { url: 'https://www.google.com/generate_204', expectedStatus: 204 }
];

function isHttpProbeUrl(value) {
    if (String(value || '').length > MAX_PROXY_PROBE_URL_LENGTH) return false;
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch (e) {
        return false;
    }
}

function parseProbeLine(line) {
    const text = String(line || '').trim();
    if (!text) return null;

    const [url, statusText] = text.split(/\s+/);
    if (!isHttpProbeUrl(url)) return null;

    const status = Number(statusText);
    return {
        url,
        expectedStatus: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null
    };
}

function normalizeProxyProbeTarget(target) {
    if (!target) return null;
    if (typeof target === 'string') return parseProbeLine(target);

    const url = String(target.url || '').trim();
    if (!isHttpProbeUrl(url)) return null;

    return {
        url,
        expectedStatus: Number.isInteger(target.expectedStatus) ? target.expectedStatus : null
    };
}

function targetsFromProbeUrlText(text) {
    return String(text || '')
        .slice(0, MAX_PROXY_PROBE_TEXT_LENGTH)
        .split(/[\r\n]+/)
        .slice(0, MAX_PROXY_PROBE_TARGETS)
        .map((line) => normalizeProxyProbeTarget(line))
        .filter(Boolean);
}

function normalizeProxyProbeTargets(input = {}) {
    const rawTargets = Array.isArray(input)
        ? input
        : (Array.isArray(input.targets) ? input.targets : null);

    const targets = rawTargets
        ? rawTargets.slice(0, MAX_PROXY_PROBE_TARGETS).map((target) => normalizeProxyProbeTarget(target)).filter(Boolean)
        : targetsFromProbeUrlText(input.proxyProbeUrls);

    return targets.length > 0
        ? targets
        : DEFAULT_PROXY_PROBE_TARGETS.map((target) => ({ ...target }));
}

function shouldAcceptProbeStatus(target, statusCode) {
    if (Number.isInteger(target?.expectedStatus)) {
        return statusCode === target.expectedStatus;
    }
    return statusCode >= 200 && statusCode < 400;
}

module.exports = {
    DEFAULT_PROXY_PROBE_TARGETS,
    normalizeProxyProbeTarget,
    normalizeProxyProbeTargets,
    shouldAcceptProbeStatus
};
