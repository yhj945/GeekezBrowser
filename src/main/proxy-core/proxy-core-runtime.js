const { PROXY_CORE_TYPES, getProxyCoreDisplayName } = require('./core-types');
const { normalizeProxyCoreConfig, resolveProxyCoreType } = require('./proxy-core-config');
const { generateXrayCoreConfig, getXraySpawnOptions, resolveXrayBinary } = require('./xray-core');
const { generateSingBoxCoreConfig, getSingBoxSpawnOptions } = require('./sing-box-core');
const { resolveSingBoxBinary } = require('./sing-box-assets');

function generateProxyCoreConfig(options) {
    if (options.coreType === PROXY_CORE_TYPES.SING_BOX) {
        return generateSingBoxCoreConfig(options);
    }
    return generateXrayCoreConfig(options);
}

function getProxyCoreSpawnOptions(coreType, configPath, env = {}) {
    if (coreType === PROXY_CORE_TYPES.SING_BOX) return getSingBoxSpawnOptions(configPath, env);
    return getXraySpawnOptions(configPath, env);
}

function resolveProxyCoreBinary(coreType, env = {}) {
    if (coreType === PROXY_CORE_TYPES.SING_BOX) return resolveSingBoxBinary(env);
    return resolveXrayBinary(env);
}

function getProxyCoreLogName(coreType) {
    return coreType === PROXY_CORE_TYPES.SING_BOX ? 'sing-box_run.log' : 'xray_run.log';
}

function getProxyCoreConfigName(coreType) {
    return coreType === PROXY_CORE_TYPES.SING_BOX ? 'sing-box.config.json' : 'xray.config.json';
}

function getProxyCoreProcessLabel(coreType) {
    return getProxyCoreDisplayName(coreType);
}

function getProxyCoreSettings(settings = {}) {
    return normalizeProxyCoreConfig(settings.proxyCore);
}

module.exports = {
    PROXY_CORE_TYPES,
    resolveProxyCoreType,
    getProxyCoreSettings,
    generateProxyCoreConfig,
    resolveProxyCoreBinary,
    getProxyCoreSpawnOptions,
    getProxyCoreLogName,
    getProxyCoreConfigName,
    getProxyCoreProcessLabel
};
