const PROXY_CORE_TYPES = Object.freeze({
    XRAY: 'xray',
    SING_BOX: 'sing-box'
});

const PROXY_CORE_OVERRIDES = Object.freeze({
    INHERIT: 'inherit',
    XRAY: PROXY_CORE_TYPES.XRAY,
    SING_BOX: PROXY_CORE_TYPES.SING_BOX
});

function normalizeProxyCoreType(value, fallback = PROXY_CORE_TYPES.XRAY) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === PROXY_CORE_TYPES.SING_BOX || normalized === 'singbox') return PROXY_CORE_TYPES.SING_BOX;
    if (normalized === PROXY_CORE_TYPES.XRAY) return PROXY_CORE_TYPES.XRAY;
    return fallback;
}

function normalizeProxyCoreOverride(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === PROXY_CORE_TYPES.XRAY) return PROXY_CORE_TYPES.XRAY;
    if (normalized === PROXY_CORE_TYPES.SING_BOX || normalized === 'singbox') return PROXY_CORE_TYPES.SING_BOX;
    return PROXY_CORE_OVERRIDES.INHERIT;
}

function getProxyCoreDisplayName(coreType) {
    return normalizeProxyCoreType(coreType) === PROXY_CORE_TYPES.SING_BOX ? 'sing-box' : 'Xray';
}

module.exports = {
    PROXY_CORE_TYPES,
    PROXY_CORE_OVERRIDES,
    normalizeProxyCoreType,
    normalizeProxyCoreOverride,
    getProxyCoreDisplayName
};
