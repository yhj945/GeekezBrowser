const {
    PROXY_CORE_TYPES,
    PROXY_CORE_OVERRIDES,
    normalizeProxyCoreType,
    normalizeProxyCoreOverride
} = require('./core-types');

const DEFAULT_SING_BOX_DNS = Object.freeze({
    enabled: true,
    strategy: 'ipv4_only',
    finalDnsTag: 'remote-dns',
    remoteDnsServers: ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'],
    enableDnsThroughProxy: true,
    strictRoute: true,
    disableCache: false,
    independentCache: true
});

const DEFAULT_PROXY_CORE = Object.freeze({
    type: PROXY_CORE_TYPES.XRAY,
    singBox: DEFAULT_SING_BOX_DNS
});

const VALID_DNS_STRATEGIES = new Set(['ipv4_only', 'prefer_ipv4', 'prefer_ipv6', 'ipv6_only', 'as_is']);
const MAX_SING_BOX_DNS_SERVERS = 6;

function normalizeDnsStrategy(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_');
    if (normalized === 'asis' || normalized === 'as-is') return 'as_is';
    return VALID_DNS_STRATEGIES.has(normalized) ? normalized : DEFAULT_SING_BOX_DNS.strategy;
}

function normalizeRemoteDnsServers(value) {
    const rawServers = Array.isArray(value) ? value : String(value || '').split(/[\r\n,]+/);
    const result = [];
    for (const item of rawServers) {
        const address = typeof item === 'string' ? item : item?.address;
        const normalized = String(address || '').trim();
        if (!normalized || result.includes(normalized)) continue;
        result.push(normalized);
        if (result.length >= MAX_SING_BOX_DNS_SERVERS) break;
    }
    return result.length > 0 ? result : [...DEFAULT_SING_BOX_DNS.remoteDnsServers];
}

function normalizeSingBoxOptions(input = {}) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    return {
        enabled: source.enabled !== false && source.dnsEnabled !== false,
        dnsEnabled: source.enabled !== false && source.dnsEnabled !== false,
        strategy: normalizeDnsStrategy(source.strategy || source.dnsStrategy),
        dnsStrategy: normalizeDnsStrategy(source.strategy || source.dnsStrategy),
        finalDnsTag: String(source.finalDnsTag || DEFAULT_SING_BOX_DNS.finalDnsTag).trim() || DEFAULT_SING_BOX_DNS.finalDnsTag,
        remoteDnsServers: normalizeRemoteDnsServers(source.remoteDnsServers || source.servers || source.dohServers),
        enableDnsThroughProxy: source.enableDnsThroughProxy !== false,
        strictRoute: source.strictRoute !== false,
        disableCache: source.disableCache === true,
        independentCache: source.independentCache !== false
    };
}

function normalizeProxyCoreConfig(input = {}) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    return {
        type: normalizeProxyCoreType(source.type, DEFAULT_PROXY_CORE.type),
        singBox: normalizeSingBoxOptions(source.singBox)
    };
}

function resolveProxyCoreType(settings = {}, profile = {}) {
    const globalConfig = normalizeProxyCoreConfig(settings.proxyCore);
    const override = normalizeProxyCoreOverride(profile.proxyCoreOverride);
    if (override === PROXY_CORE_OVERRIDES.XRAY || override === PROXY_CORE_OVERRIDES.SING_BOX) return override;
    return globalConfig.type;
}

module.exports = {
    DEFAULT_PROXY_CORE,
    DEFAULT_SING_BOX_DNS,
    normalizeProxyCoreConfig,
    normalizeSingBoxOptions,
    normalizeProxyCoreOverride,
    resolveProxyCoreType
};
