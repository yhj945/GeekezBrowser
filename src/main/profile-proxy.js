const PROFILE_PROXY_SOURCES = {
    CUSTOM: 'custom',
    MANAGED: 'managed',
    GLOBAL: 'global',
    DIRECT: 'direct'
};

const PROFILE_PRE_PROXY_OVERRIDES = {
    DEFAULT: 'default',
    ON: 'on',
    OFF: 'off'
};

const PROXY_MODES = ['single', 'balance', 'failover'];

function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function isDirectProxy(proxyStr) {
    const value = String(proxyStr || '').trim().toLowerCase();
    return value === 'direct' || value === 'direct://';
}

function normalizeProfileProxyFields(input = {}, existing = null) {
    const rawSource = String(input.proxySource || existing?.proxySource || '').trim();
    const rawProxyStr = String(input.proxyStr ?? existing?.proxyStr ?? '').trim();
    const rawProxyId = String(input.proxyId ?? existing?.proxyId ?? '').trim();

    if (rawSource === PROFILE_PROXY_SOURCES.DIRECT || isDirectProxy(rawProxyStr)) {
        return {
            proxySource: PROFILE_PROXY_SOURCES.DIRECT,
            proxyId: null,
            proxyStr: 'direct'
        };
    }

    if (rawSource === PROFILE_PROXY_SOURCES.MANAGED) {
        return {
            proxySource: PROFILE_PROXY_SOURCES.MANAGED,
            proxyId: rawProxyId || null,
            proxyStr: ''
        };
    }

    if (rawSource === PROFILE_PROXY_SOURCES.GLOBAL) {
        return {
            proxySource: PROFILE_PROXY_SOURCES.GLOBAL,
            proxyId: null,
            proxyStr: ''
        };
    }

    return {
        proxySource: PROFILE_PROXY_SOURCES.CUSTOM,
        proxyId: null,
        proxyStr: rawProxyStr
    };
}

function normalizeProfilePreProxyFields(input = {}, existing = null) {
    const rawOverride = String(input.preProxyOverride || existing?.preProxyOverride || PROFILE_PRE_PROXY_OVERRIDES.DEFAULT).trim();
    const preProxyOverride = Object.values(PROFILE_PRE_PROXY_OVERRIDES).includes(rawOverride)
        ? rawOverride
        : PROFILE_PRE_PROXY_OVERRIDES.DEFAULT;
    const rawPreProxyId = hasOwn(input, 'preProxyId')
        ? String(input.preProxyId ?? '').trim()
        : String(existing?.preProxyId ?? '').trim();

    return {
        preProxyOverride,
        preProxyId: preProxyOverride === PROFILE_PRE_PROXY_OVERRIDES.OFF ? null : (rawPreProxyId || null)
    };
}

function normalizeOutboundProxyFields(input = {}, existing = null) {
    const rawMode = String(input.outboundMode || existing?.outboundMode || 'single').trim();
    const rawSelectedId = hasOwn(input, 'selectedOutboundId')
        ? String(input.selectedOutboundId ?? '').trim()
        : String(existing?.selectedOutboundId ?? '').trim();

    return {
        enableOutboundProxy: !!(hasOwn(input, 'enableOutboundProxy') ? input.enableOutboundProxy : existing?.enableOutboundProxy),
        outboundMode: PROXY_MODES.includes(rawMode) ? rawMode : 'single',
        selectedOutboundId: rawSelectedId || null
    };
}

function ensureUsableOutboundNode(node) {
    if (!String(node?.url || '').trim()) {
        throw new Error('出口代理节点链接为空，请检查出口代理');
    }
    return node;
}

function resolveActiveOutboundProxy(settings = {}) {
    const normalized = normalizeOutboundProxyFields(settings);
    if (!normalized.enableOutboundProxy) return null;

    const outboundNodes = settings.outboundProxies || [];
    const activeNodes = outboundNodes.filter((node) => node && node.enable !== false);

    if (normalized.outboundMode === 'single') {
        if (normalized.selectedOutboundId) {
            const selectedNode = outboundNodes.find((node) => node && node.id === normalized.selectedOutboundId);
            if (!selectedNode) {
                throw new Error('出口代理节点不存在，请重新选择出口代理');
            }
            if (selectedNode.enable === false) {
                throw new Error('出口代理节点不可用，请重新选择出口代理');
            }
            return ensureUsableOutboundNode(selectedNode);
        }

        if (activeNodes.length === 0) {
            throw new Error('没有可用的出口代理节点，请检查出口代理');
        }
        return ensureUsableOutboundNode(activeNodes[0]);
    }

    const usableNodes = activeNodes.filter((node) => String(node.url || '').trim());
    if (usableNodes.length === 0) {
        throw new Error('出口代理节点链接为空，请检查出口代理');
    }

    if (normalized.outboundMode === 'balance') {
        return usableNodes[Math.floor(Math.random() * usableNodes.length)];
    }

    return usableNodes[0];
}

function resolveProfilePreProxy(profile = {}, settings = {}) {
    const normalized = normalizeProfilePreProxyFields(profile);
    if (normalized.preProxyOverride === PROFILE_PRE_PROXY_OVERRIDES.OFF) return null;

    const shouldUsePreProxy = normalized.preProxyOverride === PROFILE_PRE_PROXY_OVERRIDES.ON ||
        (normalized.preProxyOverride === PROFILE_PRE_PROXY_OVERRIDES.DEFAULT && !!settings.enablePreProxy);
    if (!shouldUsePreProxy) return null;

    const preProxyNodes = settings.preProxies || [];
    const activeNodes = preProxyNodes.filter((node) => node && node.enable !== false);

    const ensureUsableNode = (node) => {
        if (!String(node?.url || '').trim()) {
            throw new Error('前置代理节点链接为空，请检查前置代理');
        }
        return node;
    };

    if (normalized.preProxyId) {
        const profileNode = preProxyNodes.find((node) => node && node.id === normalized.preProxyId);
        if (!profileNode) {
            throw new Error('前置代理节点不存在，请重新选择前置代理');
        }
        if (profileNode.enable === false) {
            throw new Error('前置代理节点不可用，请重新选择前置代理');
        }
        return ensureUsableNode(profileNode);
    }

    if (activeNodes.length === 0) {
        throw new Error('没有可用的前置代理节点，请检查前置代理');
    }

    if (settings.mode === 'single') {
        const selectedNode = activeNodes.find((node) => node.id === settings.selectedId);
        return ensureUsableNode(selectedNode || activeNodes[0]);
    }

    const usableNodes = activeNodes.filter((node) => String(node.url || '').trim());
    if (usableNodes.length === 0) {
        throw new Error('前置代理节点链接为空，请检查前置代理');
    }

    if (settings.mode === 'balance') {
        return usableNodes[Math.floor(Math.random() * usableNodes.length)];
    }

    return usableNodes[0];
}

function resolveProfileProxy(profile = {}, settings = {}) {
    const normalized = normalizeProfileProxyFields(profile);

    if (normalized.proxySource === PROFILE_PROXY_SOURCES.DIRECT) {
        return {
            ...normalized,
            isDirect: true,
            label: 'Direct'
        };
    }

    if (normalized.proxySource === PROFILE_PROXY_SOURCES.MANAGED) {
        const node = (settings.outboundProxies || []).find((item) => item.id === normalized.proxyId);
        if (!node) {
            throw new Error('出口代理节点不存在，请重新选择出口代理');
        }
        if (node.enable === false) {
            throw new Error('出口代理节点不可用，请重新选择出口代理');
        }
        const proxyUrl = String(node.url || '').trim();
        if (!proxyUrl) {
            throw new Error('出口代理节点链接为空，请检查出口代理');
        }
        const label = node.remark || node.name || node.id || 'Managed Proxy';
        if (isDirectProxy(proxyUrl)) {
            return {
                ...normalized,
                proxyStr: 'direct',
                isDirect: true,
                label
            };
        }

        return {
            ...normalized,
            proxyStr: proxyUrl,
            isDirect: false,
            label
        };
    }

    if (normalized.proxySource === PROFILE_PROXY_SOURCES.GLOBAL) {
        const node = resolveActiveOutboundProxy(settings);
        if (!node) {
            throw new Error('全局出口代理未开启，请开启出口代理或切换环境出口代理来源');
        }
        const proxyUrl = String(node.url || '').trim();
        const label = node.remark || node.name || node.id || 'Global Outbound Proxy';
        return {
            ...normalized,
            proxyId: node.id || null,
            proxyStr: isDirectProxy(proxyUrl) ? 'direct' : proxyUrl,
            isDirect: isDirectProxy(proxyUrl),
            label
        };
    }

    return {
        ...normalized,
        isDirect: false,
        label: 'Custom Proxy'
    };
}

module.exports = {
    PROFILE_PROXY_SOURCES,
    PROFILE_PRE_PROXY_OVERRIDES,
    isDirectProxy,
    normalizeProfileProxyFields,
    normalizeProfilePreProxyFields,
    normalizeOutboundProxyFields,
    resolveActiveOutboundProxy,
    resolveProfileProxy,
    resolveProfilePreProxy
};
