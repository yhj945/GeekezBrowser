const { parseProxyLink, deriveUtlsFingerprint } = require('../utils');
const { normalizeSingBoxOptions } = require('./proxy-core-config');

const SING_BOX_BOOTSTRAP_DNS_TAG = 'bootstrap-dns';

function getFirstServer(outbound) {
    return outbound?.settings?.vnext?.[0] || outbound?.settings?.servers?.[0] || null;
}

function sanitizeProxyError(error, protocol, tag) {
    const message = String(error?.message || error || 'Unsupported proxy configuration')
        .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, '[redacted proxy]')
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[redacted uuid]');
    const err = new Error(`sing-box ${protocol || 'proxy'} outbound ${tag || ''}: ${message}`.trim());
    err.code = 'SING_BOX_CONFIG_UNSUPPORTED';
    return err;
}

function requireServer(server, protocol, tag) {
    if (!server?.address || !Number.isFinite(Number(server.port))) {
        throw sanitizeProxyError(new Error('missing server address or port'), protocol, tag);
    }
}

function cleanObject(value) {
    if (Array.isArray(value)) return value.map(cleanObject).filter((item) => item !== undefined);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        const cleaned = cleanObject(item);
        if (cleaned === undefined || cleaned === null || cleaned === '') continue;
        if (Array.isArray(cleaned) && cleaned.length === 0) continue;
        if (typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0) continue;
        result[key] = cleaned;
    }
    return result;
}

function mapTls(stream = {}, serverNameFallback, utlsFingerprint) {
    if (stream.security !== 'tls' && stream.security !== 'reality') return undefined;
    const xrayTls = stream.tlsSettings || {};
    const xrayReality = stream.realitySettings || {};
    const tls = {
        enabled: true,
        server_name: xrayTls.serverName || xrayReality.serverName || serverNameFallback,
        insecure: xrayTls.allowInsecure === true
    };
    const alpn = Array.isArray(xrayTls.alpn) ? xrayTls.alpn.filter(Boolean) : [];
    if (alpn.length > 0) tls.alpn = alpn;
    const fingerprint = xrayTls.fingerprint || xrayReality.fingerprint || utlsFingerprint;
    if (fingerprint) tls.utls = { enabled: true, fingerprint };
    if (stream.security === 'reality') {
        tls.reality = {
            enabled: true,
            public_key: xrayReality.publicKey,
            short_id: xrayReality.shortId
        };
    }
    return cleanObject(tls);
}

function mapTransport(stream = {}, protocol, tag) {
    const network = stream.network || 'tcp';
    if (network === 'tcp') return undefined;
    if (network === 'ws') {
        return cleanObject({
            type: 'ws',
            path: stream.wsSettings?.path || '/',
            headers: stream.wsSettings?.headers || {}
        });
    }
    if (network === 'grpc') {
        return cleanObject({
            type: 'grpc',
            service_name: stream.grpcSettings?.serviceName || ''
        });
    }
    if (network === 'h2' || network === 'http') {
        return cleanObject({
            type: 'http',
            host: stream.httpSettings?.host || [],
            path: stream.httpSettings?.path || '/'
        });
    }
    if (network === 'quic') return { type: 'quic' };
    throw sanitizeProxyError(new Error(`transport '${network}' is not supported by this sing-box integration`), protocol, tag);
}

function mapUsers(users = []) {
    const first = Array.isArray(users) ? users[0] : null;
    if (!first?.user) return undefined;
    return {
        username: first.user,
        password: first.pass || ''
    };
}

function parseDnsServerAddress(address) {
    const raw = String(address || '').trim();
    if (!raw) return null;

    if (raw.startsWith('https://')) {
        const parsed = new URL(raw);
        return cleanObject({
            type: 'https',
            server: parsed.hostname,
            server_port: parsed.port ? Number(parsed.port) : 443,
            path: `${parsed.pathname || '/dns-query'}${parsed.search || ''}`,
            tls: {
                enabled: true,
                server_name: parsed.hostname
            }
        });
    }

    if (raw.startsWith('tls://')) {
        const parsed = new URL(raw);
        return cleanObject({
            type: 'tls',
            server: parsed.hostname,
            server_port: parsed.port ? Number(parsed.port) : 853,
            tls: {
                enabled: true,
                server_name: parsed.hostname
            }
        });
    }

    if (raw.startsWith('quic://')) {
        const parsed = new URL(raw);
        return cleanObject({
            type: 'quic',
            server: parsed.hostname,
            server_port: parsed.port ? Number(parsed.port) : 853,
            tls: {
                enabled: true,
                server_name: parsed.hostname
            }
        });
    }

    // sing-box 1.13 still accepts legacy servers without a type. Keep this
    // fallback for plain UDP/TCP/local values while using typed DoH/DoT above.
    return { address: raw };
}

function xrayOutboundToSingBox(outbound, { tag = outbound?.tag, utlsFingerprint } = {}) {
    const protocol = outbound?.protocol;
    try {
        const stream = outbound.streamSettings || {};
        const server = getFirstServer(outbound);
        requireServer(server, protocol, tag);
        const base = {
            tag,
            server: server.address,
            server_port: Number(server.port)
        };
        const transport = mapTransport(stream, protocol, tag);
        const tls = mapTls(stream, server.address, utlsFingerprint);

        if (protocol === 'vless') {
            const user = server.users?.[0] || {};
            return cleanObject({
                type: 'vless',
                ...base,
                uuid: user.id,
                flow: user.flow || undefined,
                network: 'tcp',
                tls,
                transport
            });
        }
        if (protocol === 'vmess') {
            const user = server.users?.[0] || {};
            return cleanObject({
                type: 'vmess',
                ...base,
                uuid: user.id,
                security: user.security || 'auto',
                alter_id: Number(user.alterId) || 0,
                network: 'tcp',
                tls,
                transport
            });
        }
        if (protocol === 'trojan') {
            return cleanObject({
                type: 'trojan',
                ...base,
                password: server.password,
                network: 'tcp',
                tls,
                transport
            });
        }
        if (protocol === 'shadowsocks') {
            if (stream.tcpSettings?.header || stream.security === 'tls') {
                throw new Error('shadowsocks plugin/obfs settings are not supported');
            }
            return cleanObject({
                type: 'shadowsocks',
                ...base,
                method: server.method,
                password: server.password
            });
        }
        if (protocol === 'socks') {
            return cleanObject({
                type: 'socks',
                ...base,
                version: '5',
                ...mapUsers(server.users)
            });
        }
        if (protocol === 'http') {
            return cleanObject({
                type: 'http',
                ...base,
                ...mapUsers(server.users)
            });
        }
        throw new Error(`protocol '${protocol || 'unknown'}' is not supported`);
    } catch (error) {
        throw sanitizeProxyError(error, protocol, tag);
    }
}

function buildSingBoxDnsConfig(options = {}) {
    const dns = normalizeSingBoxOptions(options);
    if (!dns.dnsEnabled) return null;
    const remoteServers = dns.remoteDnsServers
        .map((address, index) => cleanObject({
            tag: index === 0 ? dns.finalDnsTag : `${dns.finalDnsTag}-${index + 1}`,
            ...parseDnsServerAddress(address),
            detour: dns.enableDnsThroughProxy ? 'proxy_main' : undefined
        }))
        .filter((server) => server.server || server.address);
    if (remoteServers.length === 0) return null;
    const servers = [
        { type: 'local', tag: SING_BOX_BOOTSTRAP_DNS_TAG },
        ...remoteServers
    ];
    return cleanObject({
        servers,
        final: remoteServers[0].tag,
        strategy: dns.dnsStrategy,
        disable_cache: dns.disableCache,
        independent_cache: dns.independentCache,
        reverse_mapping: true
    });
}

function buildSingBoxRouteRules(dnsConfig) {
    if (!dnsConfig) return [];
    return [{
        inbound: 'local-socks',
        action: 'resolve',
        strategy: dnsConfig.strategy || 'ipv4_only'
    }];
}

function generateSingBoxConfig(mainProxyStr, localPort, preProxyConfig = null, profileFingerprint = null, dnsOptions = null) {
    const outbounds = [];
    const utlsFingerprint = deriveUtlsFingerprint(profileFingerprint || {});
    const mainParsed = parseProxyLink(mainProxyStr, 'proxy_main');
    const mainOutbound = xrayOutboundToSingBox(mainParsed, { tag: 'proxy_main', utlsFingerprint });

    if (preProxyConfig?.preProxies?.length > 0) {
        const target = preProxyConfig.preProxies[0];
        const preParsed = parseProxyLink(target.url, 'proxy_pre');
        outbounds.push(xrayOutboundToSingBox(preParsed, { tag: 'proxy_pre', utlsFingerprint }));
        mainOutbound.detour = 'proxy_pre';
    }

    outbounds.push(mainOutbound);
    outbounds.push({ type: 'direct', tag: 'direct' });
    const dnsConfig = buildSingBoxDnsConfig(dnsOptions);

    const config = cleanObject({
        log: { level: 'warn', timestamp: true },
        dns: dnsConfig,
        inbounds: [{
            type: 'socks',
            tag: 'local-socks',
            listen: '127.0.0.1',
            listen_port: localPort
        }],
        outbounds,
        route: {
            final: 'proxy_main',
            auto_detect_interface: true,
            default_domain_resolver: dnsConfig ? SING_BOX_BOOTSTRAP_DNS_TAG : undefined,
            rules: buildSingBoxRouteRules(dnsConfig)
        }
    });
    return config;
}

module.exports = {
    xrayOutboundToSingBox,
    buildSingBoxDnsConfig,
    generateSingBoxConfig
};
