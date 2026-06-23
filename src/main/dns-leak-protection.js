const DEFAULT_DOH_SERVERS = Object.freeze([
    'https://1.1.1.1/dns-query',
    'https://8.8.8.8/dns-query'
]);

const HOST_RESOLVER_RULES = 'MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1, EXCLUDE ::1';
const STRICT_DNS_LEAK_PROTECTION_LAUNCH_ARGS = Object.freeze([
    '--disable-async-dns',
    '--disable-ipv6'
]);
const DNS_LEAK_PROTECTION_DISABLED_FEATURES = Object.freeze([
    'AsyncDns',
    'DnsOverHttpsUpgrade',
    'UseDnsHttpsSvcb',
    'UseDnsHttpsSvcbAlpn'
]);
const MAX_DOH_SERVERS = 6;

function isValidDohServer(value) {
    try {
        const parsed = new URL(String(value || '').trim());
        return parsed.protocol === 'https:' && !!parsed.hostname;
    } catch (e) {
        return false;
    }
}

function normalizeDohServers(value) {
    const rawServers = Array.isArray(value) ? value : String(value || '').split(/[\r\n,]+/);
    const servers = [];
    for (const server of rawServers) {
        const normalized = String(server || '').trim();
        if (!normalized || !isValidDohServer(normalized) || servers.includes(normalized)) continue;
        servers.push(normalized);
        if (servers.length >= MAX_DOH_SERVERS) break;
    }
    return servers.length > 0 ? servers : [...DEFAULT_DOH_SERVERS];
}

function normalizeDnsLeakProtectionConfig(input = {}) {
    const source = input && typeof input === 'object' && !Array.isArray(input)
        ? input
        : {};
    const hasKey = (key) => Object.prototype.hasOwnProperty.call(source, key);

    const xrayDnsExplicit = source.xrayDnsExplicit === true;

    return {
        enabled: hasKey('enabled') ? source.enabled !== false : true,
        disableQuic: hasKey('disableQuic') ? source.disableQuic !== false : true,
        disableDnsPrefetch: hasKey('disableDnsPrefetch') ? source.disableDnsPrefetch !== false : true,
        blockBrowserLocalDns: hasKey('blockBrowserLocalDns') ? source.blockBrowserLocalDns !== false : true,
        xrayDnsEnabled: xrayDnsExplicit && source.xrayDnsEnabled === true,
        xrayDnsExplicit,
        dohServers: normalizeDohServers(source.dohServers)
    };
}

function buildDnsLeakProtectionLaunchArgs(config, { hasLocalProxy = false } = {}) {
    const normalized = normalizeDnsLeakProtectionConfig(config);
    if (!normalized.enabled || !hasLocalProxy) return [];

    const args = [];
    if (normalized.disableQuic) args.push('--disable-quic');
    if (normalized.disableDnsPrefetch) args.push('--dns-prefetch-disable');
    if (normalized.blockBrowserLocalDns) {
        args.push(`--host-resolver-rules=${HOST_RESOLVER_RULES}`);
        args.push(...STRICT_DNS_LEAK_PROTECTION_LAUNCH_ARGS);
    }
    return args;
}

function buildXrayDnsConfig(config) {
    const normalized = normalizeDnsLeakProtectionConfig(config);
    if (!normalized.enabled || !normalized.xrayDnsEnabled) return null;

    return {
        queryStrategy: 'UseIPv4',
        disableFallback: true,
        disableFallbackIfMatch: true,
        servers: normalized.dohServers.map((address) => ({ address }))
    };
}

function getDnsLeakProtectionDisabledFeatures(config, { hasLocalProxy = false } = {}) {
    const normalized = normalizeDnsLeakProtectionConfig(config);
    if (!normalized.enabled || !normalized.blockBrowserLocalDns || !hasLocalProxy) return [];
    return [...DNS_LEAK_PROTECTION_DISABLED_FEATURES];
}

module.exports = {
    DEFAULT_DOH_SERVERS,
    HOST_RESOLVER_RULES,
    STRICT_DNS_LEAK_PROTECTION_LAUNCH_ARGS,
    DNS_LEAK_PROTECTION_DISABLED_FEATURES,
    normalizeDnsLeakProtectionConfig,
    buildDnsLeakProtectionLaunchArgs,
    getDnsLeakProtectionDisabledFeatures,
    buildXrayDnsConfig
};
