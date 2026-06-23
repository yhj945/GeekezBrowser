const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const AdmZip = require('adm-zip');

const {
  DEFAULT_PROXY_PROBE_TARGETS,
  normalizeProxyProbeTargets,
  shouldAcceptProbeStatus
} = require('../src/main/proxy-probe-targets');
const {
  normalizeProfileProxyFields,
  normalizeProfilePreProxyFields,
  normalizeOutboundProxyFields,
  resolveActiveOutboundProxy,
  resolveProfileProxy,
  resolveProfilePreProxy
} = require('../src/main/profile-proxy');
const {
  DEFAULT_PROXY_STARTUP_HEALTH_CONFIG,
  normalizeProxyStartupHealthConfig
} = require('../src/main/proxy-startup-health-config');
const { parseCustomLaunchArgs } = require('../src/main/launch-args');
const { resolveChromiumPath } = require('../src/main/chromium-path');

let generateXrayConfig;
let parseProxyLink;
let createDuplicateProfilePayload;
let generateFingerprint;
let getInjectScript;
let getWorkerInjectScript;
let applyProfileScopedNoiseSeed;
let ensureProfileScopedNoiseSeed;
let rotateProfileNoiseSeed;
let buildCanvasFingerprintPreview;

function loadMainUtilsForTest() {
  const utilsPath = path.join(__dirname, '..', 'src', 'main', 'utils.js');
  const source = fs.readFileSync(utilsPath, 'utf8')
    .replace(/export \{ generateXrayConfig, parseProxyLink, getProxyRemark \};\s*$/, 'module.exports = { generateXrayConfig, parseProxyLink, getProxyRemark };');
  const sandbox = {
    require,
    module: { exports: {} },
    exports: {},
    Buffer,
    URL,
    URLSearchParams,
    console
  };
  vm.runInNewContext(source, sandbox, { filename: utilsPath });
  return sandbox.module.exports;
}

function loadProfileCopyForTest() {
  const utilsPath = path.join(__dirname, '..', 'src', 'renderer', 'src', 'utils', 'profile-copy.js');
  const source = fs.readFileSync(utilsPath, 'utf8')
    .replace('export function createDuplicateProfilePayload', 'function createDuplicateProfilePayload');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    JSON,
    String
  };
  vm.runInNewContext(`${source}\nmodule.exports = { createDuplicateProfilePayload };`, sandbox, { filename: utilsPath });
  return sandbox.module.exports;
}

function loadFingerprintForTest() {
  const fingerprintPath = path.join(__dirname, '..', 'src', 'main', 'fingerprint.js');
  const source = fs.readFileSync(fingerprintPath, 'utf8')
    .replace(/export \{([^}]+)\};\s*$/, 'module.exports = {$1};');
  const sandbox = {
    require,
    module: { exports: {} },
    exports: {},
    console,
    process,
    __dirname: path.dirname(fingerprintPath)
  };
  vm.runInNewContext(source, sandbox, { filename: fingerprintPath });
  return sandbox.module.exports;
}

function makeVmessLink({ address, port = 443, id, tls = 'tls', fingerprint = 'chrome' }) {
  const config = {
    v: '2',
    ps: address,
    add: address,
    port: String(port),
    id,
    aid: '0',
    net: 'tcp',
    tls,
    sni: address
  };
  if (fingerprint !== null) config.fp = fingerprint;

  const payload = Buffer.from(JSON.stringify(config)).toString('base64');
  return `vmess://${payload}`;
}

function findOutbound(config, tag) {
  return config.outbounds.find((outbound) => outbound.tag === tag);
}

function testDuplicateProfilePayload() {
  const source = {
    id: 'profile-1',
    name: 'Shop US',
    proxySource: 'managed',
    proxyId: 'out-1',
    proxyStr: '',
    tags: ['shop', 'us'],
    preProxyOverride: 'on',
    preProxyId: 'pre-1',
    isSetup: true,
    createdAt: 1700000000000,
    updatedAt: 1700000001000,
    fingerprint: {
      screen: { width: 1366, height: 768 },
      timezone: 'America/New_York',
      language: 'en-US',
      noiseSeed: 123456,
      noiseSeedProfileId: 'profile-1'
    },
    debugPort: 24000,
    runtimeState: { pid: 1234 }
  };

  const copy = createDuplicateProfilePayload(source);

  assert.strictEqual(copy.id, undefined);
  assert.strictEqual(copy.name, 'Shop US-copy');
  assert.deepStrictEqual(copy.tags, ['shop', 'us']);
  assert.notStrictEqual(copy.tags, source.tags);
  assert.strictEqual(copy.fingerprint.noiseSeed, undefined);
  assert.strictEqual(copy.fingerprint.noiseSeedProfileId, undefined);
  assert.notDeepStrictEqual(copy.fingerprint, source.fingerprint);
  assert.notStrictEqual(copy.fingerprint, source.fingerprint);
  assert.deepStrictEqual(copy.fingerprint.screen, source.fingerprint.screen);
  assert.notStrictEqual(copy.fingerprint.screen, source.fingerprint.screen);
  assert.strictEqual(copy.proxySource, 'managed');
  assert.strictEqual(copy.proxyId, 'out-1');
  assert.strictEqual(copy.proxyStr, '');
  assert.strictEqual(copy.preProxyOverride, 'on');
  assert.strictEqual(copy.preProxyId, 'pre-1');
  assert.strictEqual(copy.isSetup, false);
  assert.strictEqual(copy.createdAt, undefined);
  assert.strictEqual(copy.updatedAt, undefined);
  assert.strictEqual(copy.debugPort, undefined);
  assert.strictEqual(copy.runtimeState, undefined);
  assert.strictEqual(source.name, 'Shop US');
  assert.strictEqual(source.isSetup, true);
}

function testOutboundProxyFields() {
  assert.deepStrictEqual(normalizeOutboundProxyFields({}), {
    enableOutboundProxy: false,
    outboundMode: 'single',
    selectedOutboundId: null
  });

  assert.deepStrictEqual(normalizeOutboundProxyFields({
    enableOutboundProxy: true,
    outboundMode: 'balance',
    selectedOutboundId: 'out-1'
  }), {
    enableOutboundProxy: true,
    outboundMode: 'balance',
    selectedOutboundId: 'out-1'
  });

  assert.deepStrictEqual(normalizeOutboundProxyFields({
    enableOutboundProxy: true,
    outboundMode: 'invalid',
    selectedOutboundId: '   '
  }), {
    enableOutboundProxy: true,
    outboundMode: 'single',
    selectedOutboundId: null
  });

  const settings = {
    enableOutboundProxy: true,
    outboundMode: 'single',
    selectedOutboundId: 'out-2',
    outboundProxies: [
      { id: 'out-1', remark: 'Out 1', url: 'vless://out1@example.com:443?security=tls&type=tcp', enable: true },
      { id: 'out-2', remark: 'Out 2', url: 'vless://out2@example.com:443?security=tls&type=tcp', enable: true }
    ]
  };

  assert.strictEqual(resolveActiveOutboundProxy(settings)?.id, 'out-2');
  assert.strictEqual(resolveActiveOutboundProxy({ ...settings, enableOutboundProxy: false }), null);
  assert.throws(
    () => resolveActiveOutboundProxy({ ...settings, selectedOutboundId: 'missing-out' }),
    /出口代理节点不存在/
  );
  assert.throws(
    () => resolveActiveOutboundProxy({
      enableOutboundProxy: true,
      outboundMode: 'single',
      selectedOutboundId: 'blank-out',
      outboundProxies: [{ id: 'blank-out', url: '   ', enable: true }]
    }),
    /出口代理节点链接为空/
  );

  assert.strictEqual(resolveActiveOutboundProxy({
    enableOutboundProxy: true,
    outboundMode: 'failover',
    outboundProxies: [
      { id: 'disabled-out', url: 'vless://disabled@example.com:443?security=tls&type=tcp', enable: false },
      { id: 'usable-out', url: 'vless://usable@example.com:443?security=tls&type=tcp', enable: true }
    ]
  })?.id, 'usable-out');
}

function testProxyProbeTargets() {
  assert.deepStrictEqual(normalizeProxyProbeTargets({}), DEFAULT_PROXY_PROBE_TARGETS);

  const customTargets = normalizeProxyProbeTargets({
    proxyProbeUrls: 'https://example.com/health\nhttps://check.example.net/generate_204 204\nhttp://plain.example.net/generate_204 204\nftp://ignored.example'
  });

  assert.deepStrictEqual(customTargets, [
    { url: 'https://example.com/health', expectedStatus: null },
    { url: 'https://check.example.net/generate_204', expectedStatus: 204 },
    { url: 'http://plain.example.net/generate_204', expectedStatus: 204 }
  ]);

  const manyTargets = normalizeProxyProbeTargets({
    proxyProbeUrls: Array.from({ length: 20 }, (_, index) => `https://probe-${index}.example.com/generate_204 204`).join('\n')
  });
  assert.strictEqual(manyTargets.length, 8);

  assert.strictEqual(shouldAcceptProbeStatus({ expectedStatus: null }, 200), true);
  assert.strictEqual(shouldAcceptProbeStatus({ expectedStatus: null }, 302), true);
  assert.strictEqual(shouldAcceptProbeStatus({ expectedStatus: null }, 404), false);
  assert.strictEqual(shouldAcceptProbeStatus({ expectedStatus: 204 }, 204), true);
  assert.strictEqual(shouldAcceptProbeStatus({ expectedStatus: 204 }, 200), false);
}

function testProxyStartupHealthConfig() {
  assert.deepStrictEqual(normalizeProxyStartupHealthConfig({}), DEFAULT_PROXY_STARTUP_HEALTH_CONFIG);
  assert.deepStrictEqual(normalizeProxyStartupHealthConfig({ proxyStartupHealthCheck: undefined }), DEFAULT_PROXY_STARTUP_HEALTH_CONFIG);
  assert.ok(DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.direct.slowProbeTimeoutMs >= 4000);
  assert.ok(DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.direct.slowReadyTimeoutMs >= DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.direct.slowProbeTimeoutMs);

  const customized = normalizeProxyStartupHealthConfig({
    proxyStartupHealthCheck: {
      readyTimeoutMs: 3100,
      direct: {
        warmupMs: 450,
        fastReadyTimeoutMs: 2300,
        fastProbeTimeoutMs: 950,
        slowReadyTimeoutMs: 4300,
        slowProbeTimeoutMs: 4100
      },
      preProxy: {
        warmupMs: 1500,
        fastReadyTimeoutMs: 5200,
        fastProbeTimeoutMs: 2400,
        slowReadyTimeoutMs: 12000,
        slowProbeTimeoutMs: 6000
      }
    }
  });

  assert.deepStrictEqual(customized, {
    readyTimeoutMs: 3100,
    direct: {
      warmupMs: 450,
      fastReadyTimeoutMs: 2300,
      fastProbeTimeoutMs: 950,
      slowReadyTimeoutMs: 4300,
      slowProbeTimeoutMs: 4100
    },
    preProxy: {
      warmupMs: 1500,
      fastReadyTimeoutMs: 5200,
      fastProbeTimeoutMs: 2400,
      slowReadyTimeoutMs: 12000,
      slowProbeTimeoutMs: 6000
    }
  });

  const partial = normalizeProxyStartupHealthConfig({
    proxyStartupHealthCheck: {
      readyTimeoutMs: 3500,
      direct: { slowProbeTimeoutMs: 2100 }
    }
  });
  assert.strictEqual(partial.readyTimeoutMs, 3500);
  assert.strictEqual(partial.direct.slowProbeTimeoutMs, 2100);
  assert.strictEqual(partial.direct.fastProbeTimeoutMs, DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.direct.fastProbeTimeoutMs);
  assert.deepStrictEqual(partial.preProxy, DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.preProxy);

  const invalid = normalizeProxyStartupHealthConfig({
    proxyStartupHealthCheck: {
      readyTimeoutMs: 0,
      direct: {
        warmupMs: -1,
        fastReadyTimeoutMs: Number.NaN,
        fastProbeTimeoutMs: Infinity,
        slowReadyTimeoutMs: 'abc',
        slowProbeTimeoutMs: 1700
      },
      preProxy: []
    }
  });
  assert.strictEqual(invalid.readyTimeoutMs, DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.readyTimeoutMs);
  assert.deepStrictEqual(invalid.direct, {
    ...DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.direct,
    slowProbeTimeoutMs: 1700
  });
  assert.deepStrictEqual(invalid.preProxy, DEFAULT_PROXY_STARTUP_HEALTH_CONFIG.preProxy);

  const clamped = normalizeProxyStartupHealthConfig({
    proxyStartupHealthCheck: {
      readyTimeoutMs: 999999999,
      direct: { warmupMs: 999999999, slowProbeTimeoutMs: 999999999 },
      preProxy: { slowReadyTimeoutMs: 999999999, slowProbeTimeoutMs: 999999999 }
    }
  });
  assert.strictEqual(clamped.readyTimeoutMs, 30000);
  assert.strictEqual(clamped.direct.warmupMs, 30000);
  assert.strictEqual(clamped.direct.slowProbeTimeoutMs, 30000);
  assert.strictEqual(clamped.preProxy.slowReadyTimeoutMs, 30000);
  assert.strictEqual(clamped.preProxy.slowProbeTimeoutMs, 30000);
}

function testProfilePreProxyResolution() {
  const settings = {
    enablePreProxy: true,
    selectedId: 'global-pre',
    mode: 'single',
    preProxies: [
      { id: 'global-pre', remark: 'Global Pre', url: 'vless://global@example.com:443?security=tls&type=tcp&fp=chrome' },
      { id: 'profile-a-pre', remark: 'Profile A Pre', url: 'vless://profile-a@example.com:443?security=tls&type=tcp&fp=edge' },
      { id: 'profile-b-pre', remark: 'Profile B Pre', url: 'vless://profile-b@example.com:443?security=tls&type=tcp&fp=randomized' }
    ]
  };

  assert.deepStrictEqual(normalizeProfilePreProxyFields({ preProxyOverride: 'on', preProxyId: 'profile-a-pre' }), {
    preProxyOverride: 'on',
    preProxyId: 'profile-a-pre'
  });

  assert.deepStrictEqual(normalizeProfilePreProxyFields({ preProxyOverride: 'off', preProxyId: 'profile-a-pre' }), {
    preProxyOverride: 'off',
    preProxyId: null
  });

  assert.strictEqual(resolveProfilePreProxy({ preProxyOverride: 'default' }, settings)?.id, 'global-pre');
  assert.strictEqual(resolveProfilePreProxy({ preProxyOverride: 'on', preProxyId: 'profile-a-pre' }, settings)?.id, 'profile-a-pre');
  assert.strictEqual(resolveProfilePreProxy({ preProxyOverride: 'on', preProxyId: 'profile-b-pre' }, settings)?.id, 'profile-b-pre');
  assert.strictEqual(resolveProfilePreProxy({ preProxyOverride: 'off', preProxyId: 'profile-a-pre' }, settings), null);
  assert.throws(
    () => resolveProfilePreProxy({ preProxyOverride: 'on', preProxyId: 'missing-pre' }, settings),
    /前置代理节点不存在/
  );

  assert.throws(
    () => resolveProfilePreProxy(
      { preProxyOverride: 'on', preProxyId: 'disabled-pre' },
      { preProxies: [{ id: 'disabled-pre', url: 'vless://disabled@example.com:443?security=tls&type=tcp', enable: false }] }
    ),
    /前置代理节点不可用/
  );
}

function testProfilePreProxyRejectsEmptyGlobalNode() {
  const settings = {
    enablePreProxy: true,
    selectedId: 'empty-global-pre',
    mode: 'single',
    preProxies: [
      { id: 'empty-global-pre', remark: 'Empty Global Pre', url: '   ' },
      { id: 'valid-global-pre', remark: 'Valid Global Pre', url: 'vless://valid@example.com:443?security=tls&type=tcp&fp=chrome' }
    ]
  };

  assert.throws(
    () => resolveProfilePreProxy({ preProxyOverride: 'default' }, settings),
    /前置代理节点链接为空/
  );
}

function testProfilePreProxyRejectsEnabledModeWithoutActiveNodes() {
  assert.throws(
    () => resolveProfilePreProxy(
      { preProxyOverride: 'on' },
      { enablePreProxy: false, preProxies: [] }
    ),
    /没有可用的前置代理节点/
  );

  assert.throws(
    () => resolveProfilePreProxy(
      { preProxyOverride: 'default' },
      { enablePreProxy: true, preProxies: [{ id: 'disabled-pre', url: 'vless://disabled@example.com:443?security=tls&type=tcp', enable: false }] }
    ),
    /没有可用的前置代理节点/
  );
}

function testProfileProxyResolution() {
  const settings = {
    preProxies: [
      { id: 'node-a', remark: 'Wrong Pre Node', url: 'vmess://pre-node-a' }
    ],
    outboundProxies: [
      { id: 'node-a', remark: 'Node A', url: 'vmess://node-a' },
      { id: 'node-b', remark: 'Node B', url: 'trojan://node-b' }
    ]
  };

  assert.deepStrictEqual(normalizeProfileProxyFields({ proxySource: 'direct' }), {
    proxySource: 'direct',
    proxyId: null,
    proxyStr: 'direct'
  });

  assert.deepStrictEqual(normalizeProfileProxyFields({ proxySource: 'custom', proxyStr: 'socks://127.0.0.1:1080' }), {
    proxySource: 'custom',
    proxyId: null,
    proxyStr: 'socks://127.0.0.1:1080'
  });

  assert.deepStrictEqual(normalizeProfileProxyFields({ proxySource: 'global', proxyId: 'old-node', proxyStr: 'old-static-copy' }), {
    proxySource: 'global',
    proxyId: null,
    proxyStr: ''
  });

  const managed = normalizeProfileProxyFields({ proxySource: 'managed', proxyId: 'node-a', proxyStr: 'old-static-copy' });
  assert.deepStrictEqual(managed, {
    proxySource: 'managed',
    proxyId: 'node-a',
    proxyStr: ''
  });

  assert.deepStrictEqual(resolveProfileProxy(managed, settings), {
    proxySource: 'managed',
    proxyId: 'node-a',
    proxyStr: 'vmess://node-a',
    isDirect: false,
    label: 'Node A'
  });

  assert.deepStrictEqual(resolveProfileProxy(
    { proxySource: 'managed', proxyId: 'direct-node' },
    { outboundProxies: [{ id: 'direct-node', remark: 'Direct Node', url: 'direct://', enable: true }] }
  ), {
    proxySource: 'managed',
    proxyId: 'direct-node',
    proxyStr: 'direct',
    isDirect: true,
    label: 'Direct Node'
  });

  assert.deepStrictEqual(resolveProfileProxy(
    { proxySource: 'global' },
    { ...settings, enableOutboundProxy: true, outboundMode: 'single', selectedOutboundId: 'node-b' }
  ), {
    proxySource: 'global',
    proxyId: 'node-b',
    proxyStr: 'trojan://node-b',
    isDirect: false,
    label: 'Node B'
  });

  assert.deepStrictEqual(resolveProfileProxy(
    { proxySource: 'global' },
    { enableOutboundProxy: true, outboundMode: 'single', selectedOutboundId: 'direct-global', outboundProxies: [{ id: 'direct-global', remark: 'Direct Global', url: 'direct://' }] }
  ), {
    proxySource: 'global',
    proxyId: 'direct-global',
    proxyStr: 'direct',
    isDirect: true,
    label: 'Direct Global'
  });

  assert.deepStrictEqual(resolveProfileProxy({ proxySource: 'direct', proxyStr: 'direct' }, settings), {
    proxySource: 'direct',
    proxyId: null,
    proxyStr: 'direct',
    isDirect: true,
    label: 'Direct'
  });

  assert.throws(
    () => resolveProfileProxy({ proxySource: 'managed', proxyId: 'missing', proxyStr: '' }, settings),
    /出口代理节点不存在/
  );

  assert.throws(
    () => resolveProfileProxy(
      { proxySource: 'managed', proxyId: 'blank-node', proxyStr: '' },
      { outboundProxies: [{ id: 'blank-node', remark: 'Blank Node', url: '   ' }] }
    ),
    /出口代理节点链接为空/
  );

  assert.throws(
    () => resolveProfileProxy(
      { proxySource: 'managed', proxyId: 'disabled-node', proxyStr: '' },
      { outboundProxies: [{ id: 'disabled-node', remark: 'Disabled Node', url: 'vless://disabled@example.com:443?security=tls&type=tcp', enable: false }] }
    ),
    /出口代理节点不可用/
  );
}

function testMainProxyKeepsExplicitFingerprint() {
  const vmessMainConfig = generateXrayConfig(
    makeVmessLink({ address: 'vmess-main.example.com', id: '22222222-2222-2222-2222-222222222222', fingerprint: 'firefox' }),
    24079,
    null,
    { uaMode: 'spoof', browserType: 'edge', browserMajorVersion: 147 }
  );
  const vmessMainOutbound = findOutbound(vmessMainConfig, 'proxy_main');
  assert.strictEqual(vmessMainOutbound.streamSettings.tlsSettings.fingerprint, 'firefox');

  const trojanMainConfig = generateXrayConfig(
    'trojan://password@trojan-main.example.com:443?security=tls&type=tcp&sni=trojan-main.example.com&fp=safari',
    24078,
    null,
    { uaMode: 'spoof', browserType: 'chrome', browserMajorVersion: 147 }
  );
  const trojanMainOutbound = findOutbound(trojanMainConfig, 'proxy_main');
  assert.strictEqual(trojanMainOutbound.streamSettings.tlsSettings.fingerprint, 'safari');
}

function testChainedXrayConfigKeepsPreProxyFingerprint() {
  const mainProxy = 'vless://main-user@main.example.com:443?security=reality&type=tcp&sni=main.example.com&fp=chrome&pbk=public-key&sid=abcd';
  const preProxy = 'vless://pre-user@pre.example.com:443?security=reality&type=tcp&sni=pre.example.com&fp=edge&pbk=pre-public-key&sid=1234';

  const config = generateXrayConfig(
    mainProxy,
    24080,
    { preProxies: [{ id: 'profile-pre', url: preProxy }] },
    { uaMode: 'spoof', browserType: 'chrome', browserMajorVersion: 147 }
  );

  const mainOutbound = findOutbound(config, 'proxy_main');
  const preOutbound = findOutbound(config, 'proxy_pre');

  assert.strictEqual(mainOutbound.streamSettings.sockopt.dialerProxy, 'proxy_pre');
  assert.strictEqual(mainOutbound.streamSettings.realitySettings.fingerprint, 'chrome');
  assert.strictEqual(preOutbound.streamSettings.realitySettings.fingerprint, 'edge');

  const vmessPreConfig = generateXrayConfig(
    mainProxy,
    24081,
    { preProxies: [{ id: 'vmess-pre', url: makeVmessLink({ address: 'vmess-pre.example.com', id: '11111111-1111-1111-1111-111111111111', fingerprint: 'firefox' }) }] },
    { uaMode: 'spoof', browserType: 'edge', browserMajorVersion: 147 }
  );
  const vmessPreOutbound = findOutbound(vmessPreConfig, 'proxy_pre');
  assert.strictEqual(vmessPreOutbound.streamSettings.tlsSettings.fingerprint, 'firefox');
}

function testChainedXrayConfigAddsMissingPreProxyFingerprint() {
  const mainProxy = 'vless://main-user@main.example.com:443?security=reality&type=tcp&sni=main.example.com&fp=chrome&pbk=public-key&sid=abcd';
  const config = generateXrayConfig(
    mainProxy,
    24082,
    { preProxies: [{ id: 'vmess-pre', url: makeVmessLink({ address: 'vmess-pre.example.com', id: '33333333-3333-3333-3333-333333333333', fingerprint: null }) }] },
    { uaMode: 'spoof', browserType: 'edge', browserMajorVersion: 147 }
  );

  const preOutbound = findOutbound(config, 'proxy_pre');
  assert.strictEqual(preOutbound.streamSettings.tlsSettings.fingerprint, 'edge');
}

function testMissingFingerprintFallbackDoesNotDependOnUaMode() {
  const mainProxy = 'vless://main-user@main.example.com:443?security=tls&type=tcp&sni=main.example.com';
  const config = generateXrayConfig(
    mainProxy,
    24083,
    { preProxies: [{ id: 'vmess-pre', url: makeVmessLink({ address: 'vmess-pre.example.com', id: '44444444-4444-4444-4444-444444444444', fingerprint: null }) }] },
    { uaMode: 'none', browserType: 'auto', browserMajorVersion: 'auto' }
  );

  const mainOutbound = findOutbound(config, 'proxy_main');
  const preOutbound = findOutbound(config, 'proxy_pre');
  assert.strictEqual(mainOutbound.streamSettings.tlsSettings.fingerprint, 'chrome');
  assert.strictEqual(preOutbound.streamSettings.tlsSettings.fingerprint, 'chrome');
}

function testGenerateXrayConfigFailsClosedWhenPreProxyInvalid() {
  const mainProxy = 'vless://main-user@main.example.com:443?security=tls&type=tcp&sni=main.example.com&fp=chrome';
  assert.throws(
    () => generateXrayConfig(
      mainProxy,
      24084,
      { preProxies: [{ id: 'bad-pre', url: 'unsupported://user:secret@example.com:443' }] },
      { uaMode: 'spoof', browserType: 'chrome', browserMajorVersion: 147 }
    ),
    /Unsupported protocol/
  );
}

function testParseProxyLinkDoesNotLogRawCredentials() {
  const originalError = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);

  try {
    assert.throws(
      () => parseProxyLink('user:secret:host:port:extra', 'proxy_main'),
      /Invalid IP:Port:User:Pass format/
    );
  } finally {
    console.error = originalError;
  }

  const serialized = JSON.stringify(calls);
  assert.strictEqual(serialized.includes('secret'), false);
  assert.strictEqual(serialized.includes('user:secret:host:port:extra'), false);
}

function testParseProxyLinkThrowsSanitizedInvalidUrlError() {
  const originalError = console.error;
  const calls = [];
  const rawProxy = 'vless://user:secret@[::1';
  let thrown = null;
  console.error = (...args) => calls.push(args);

  try {
    parseProxyLink(rawProxy, 'proxy_main');
  } catch (err) {
    thrown = err;
  } finally {
    console.error = originalError;
  }

  assert.ok(thrown);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(thrown, 'input'), false);
  assert.strictEqual(JSON.stringify(thrown).includes('secret'), false);
  assert.strictEqual(JSON.stringify(calls).includes('secret'), false);
  assert.strictEqual(JSON.stringify(calls).includes(rawProxy), false);
}

function makeStableFingerprint(seed) {
  return generateFingerprint({
    uaMode: 'none',
    screen: { width: 1366, height: 768 },
    hardwareConcurrency: 8,
    deviceMemory: 8,
    canvasNoise: { r: 1, g: -1, b: 1, a: 0 },
    audioNoise: 0.0000003,
    noiseSeed: seed,
    timezone: 'Auto',
    language: 'auto',
    webglProfile: 'none'
  });
}

function testCanvasFingerprintScriptUsesStableProfileSeed() {
  const profileA = makeStableFingerprint(123456);
  const profileAAgain = makeStableFingerprint(123456);
  const profileB = makeStableFingerprint(654321);

  assert.strictEqual(profileA.noiseSeed, 123456);
  assert.deepStrictEqual(profileA.canvasNoise, { r: 1, g: -1, b: 1, a: 0 });
  assert.deepStrictEqual(profileA, profileAAgain);

  const scriptA = getInjectScript(profileA, 'Canvas Profile', 'enhanced');
  const scriptAAgain = getInjectScript(profileAAgain, 'Canvas Profile', 'enhanced');
  const scriptB = getInjectScript(profileB, 'Canvas Profile', 'enhanced');

  assert.strictEqual(scriptA, scriptAAgain);
  assert.notStrictEqual(scriptA, scriptB);
  assert.ok(scriptA.includes('"noiseSeed":123456'));
  assert.ok(scriptB.includes('"noiseSeed":654321'));
}

function testCanvasFingerprintScriptCoversSerializationAndWebglReadback() {
  const script = getInjectScript(makeStableFingerprint(123456), 'Canvas Profile', 'enhanced');

  assert.doesNotThrow(() => new vm.Script(script));
  assert.strictEqual(script.includes('?.'), false);
  assert.ok(script.includes('window.CanvasRenderingContext2D'));
  assert.ok(script.includes('window.HTMLCanvasElement'));
  assert.ok(script.includes('toDataURL'));
  assert.ok(script.includes('toBlob'));
  assert.ok(script.includes('OffscreenCanvas'));
  assert.ok(script.includes('OffscreenCanvasRenderingContext2D'));
  assert.ok(script.includes('readPixels'));
  assert.ok(script.includes('copyBufferSubData'));
  assert.ok(script.includes('bufferData'));
  assert.ok(script.includes('bufferSubData'));
  assert.ok(script.includes('deleteBuffer'));
  assert.ok(script.includes('createBuffer'));
  assert.ok(script.includes('PIXEL_UNPACK_BUFFER'));
  assert.ok(script.includes('bufferSizes'));
  assert.ok(script.includes('getBufferSourceByteLength'));
  assert.ok(script.includes('isValidBufferUsage'));
  assert.ok(script.includes('isValidBufferUsageEnum'));
  assert.ok(script.includes('getBufferDataByteLength'));
  assert.ok(script.includes('getBufferSubDataByteLength'));
  assert.ok(script.includes('canCopyBufferRange'));
  assert.ok(script.includes('isValidBufferUsage(boundPackBuffer, packOffset, byteLength)'));
  assert.ok(script.includes('sizeOrData === null'));
  assert.strictEqual(script.includes('bufferSizes.set(buffer, Math.max'), false);
  assert.ok(script.includes('isTrackedRange'));
  assert.strictEqual(script.includes('getError() === 0'), false);
  assert.ok(script.includes('ArrayBuffer.isView'));
  assert.ok(script.includes('addNoisyPackBufferRange'));
  assert.ok(script.includes('clearNoisyPackBufferRange'));
  assert.ok(script.includes('mergeNoisyRanges'));
  assert.ok(script.includes('Number(length) === 0'));
  assert.ok(script.includes('maxLength === undefined'));
  assert.ok(script.includes('byteLength > 0'));
  assert.ok(script.includes('getReadPixelsByteLength'));
  assert.ok(script.includes('PACK_ALIGNMENT'));
  assert.ok(script.includes('Number.isInteger(widthValue)'));
  assert.ok(script.includes('rowStride'));
  assert.ok(script.includes('mixCanvasNoiseIndex'));
  assert.strictEqual(script.includes('((index + canvasSeed) % 53'), false);
  assert.strictEqual(script.includes('((index + workerCanvasSeed) % 53'), false);
  assert.ok(script.includes('hasReadableFramebuffer'));
  assert.ok(script.includes('FRAMEBUFFER_COMPLETE'));
  assert.ok(script.includes('getReadPixelsBytesPerPixel'));
  assert.strictEqual(script.includes('Unsupported WebGL readPixels format'), false);
  assert.ok(script.includes('canReadPixelsSucceed'));
  assert.ok(script.includes('READ_BUFFER'));
  assert.ok(script.includes('readBuffer === NONE'));
  assert.ok(script.includes('isContextLost'));
  assert.ok(script.includes('canWriteReadPixelsArray'));
  assert.ok(script.includes('pendingReadPixelsErrors'));
  assert.ok(script.includes('takeGlErrors'));
  assert.ok(script.includes('queueGlErrors'));
  assert.ok(script.includes('getViewByteMetadata(pixels)'));
  assert.ok(script.includes('isUint8ArrayView'));
  assert.ok(script.includes('typedArrayTagGetter'));
  assert.ok(script.includes('typedArrayBufferGetter'));
  assert.ok(script.includes('typedArrayByteOffsetGetter'));
  assert.ok(script.includes('typedArrayByteLengthGetter'));
  assert.ok(script.includes("typedArrayTagGetter.call(view) === 'Uint8Array'"));
  assert.ok(script.includes('getViewByteMetadata'));
  assert.ok(script.includes('typedArrayByteLengthGetter.call(view)'));
  assert.ok(script.includes('getArrayBufferByteLength'));
  assert.ok(script.includes('arrayBufferByteLengthGetter.call(value)'));
  assert.ok(script.includes('getBufferDestinationBytes'));
  assert.strictEqual(script.includes('getWorkerBufferDestinationBytes'), false);
  assert.ok(script.includes('new Uint8Array(source, 0, byteLength)'));
  assert.ok(script.includes('!getBoundBuffer(gl, gl.PIXEL_PACK_BUFFER)'));
  assert.strictEqual(script.includes('this.PIXEL_PACK_BUFFER || 35051'), false);
  assert.strictEqual(script.includes('gl.PIXEL_PACK_BUFFER || 35051'), false);
  assert.ok(script.includes('canNoiseReadPixelsType'));
  assert.strictEqual(script.includes("const canNoiseReadPixelsType = (gl, type) => Number(type) === (gl.UNSIGNED_BYTE || 5121)"), false);
  assert.ok(script.includes('applyTypedReadPixelsNoise'));
  assert.strictEqual(script.includes('applyWorkerTypedReadPixelsNoise'), false);
  assert.ok(script.includes('applyBufferDestinationNoise'));
  assert.strictEqual(script.includes('applyWorkerBufferDestinationNoise'), false);
  assert.ok(script.includes('canWriteReadPixelsArray(this, pixels, type)'));
  assert.strictEqual(script.includes('canWriteWorkerReadPixelsArray(this, pixels, type)'), false);
  assert.ok(script.includes('READ_FRAMEBUFFER_BINDING'));
  assert.ok(script.includes('noiseIndexOffset'));
  assert.ok(script.includes('range.noiseIndexOffset'));
  assert.strictEqual(script.includes('packSkipPixels + widthValue > rowPixels'), false);
  assert.ok(script.includes('canWriteReadPixelsResult'));
  assert.ok(script.includes('dstOffset + byteLength <= bytes.length'));
  assert.ok(script.includes('__geekezCanvasPatched__'));
  assert.ok(script.includes('__geekezAudioPatched__'));
  assert.ok(script.includes('__geekezReadPixelsPatched__'));
  assert.strictEqual(script.includes('__geekezWorkerConstructorPatched__'), false);
  assert.strictEqual(script.includes('workerCanvasSeed'), false);
  assert.ok(script.includes('noisedAudioChannels'));
  assert.ok(script.includes('copyFromChannel'));
  assert.ok(script.includes('VideoFrame'));
  assert.ok(script.includes('copyTo'));
  assert.ok(script.includes('__geekezVideoFramePatched__'));
  assert.ok(script.includes('VideoEncoder'));
  assert.ok(script.includes('__geekezVideoEncoderPatched__'));
  assert.ok(script.includes('createNoisedVideoFrame'));
  assert.ok(script.includes('audioNoise'));
  assert.ok(script.includes('getBufferSubData'));
  assert.ok(script.includes('PIXEL_PACK_BUFFER'));
  assert.ok(script.includes('applyVideoFrameCopyNoise'));
  assert.ok(script.includes('getVideoFramePlaneLayouts'));
  assert.ok(script.includes('logicalNoiseOffset'));
  assert.ok(script.includes('__geekezFingerprintInjected__'));
  assert.strictEqual(script.includes('wrapNestedWorkerConstructor'), false);
  assert.strictEqual(script.includes('wrapWorkerConstructor'), false);
  assert.strictEqual(script.includes('Unsupported Worker URL for fingerprint isolation'), false);
  assert.strictEqual(script.includes('__geekezWorkerLocation'), false);
  assert.strictEqual(script.includes('__geekezIframeRealmPatched__'), false);
  assert.strictEqual(script.includes('__geekezIframeInsertionPatched__'), false);
  assert.strictEqual(script.includes('Unpatched iframe realm blocked for fingerprint isolation'), false);
  assert.strictEqual(script.includes('__geekezWorkerPatchApplied'), false);
  assert.strictEqual(script.includes('Worker fingerprint patch failed'), false);
  assert.strictEqual(script.includes('sharedWorkerUrlCache'), false);
  assert.strictEqual(script.includes('__geekezWorkerBaseUrl'), false);
  assert.strictEqual(script.includes('URL.createObjectURL(blob)'), false);
  assert.ok(script.includes('UNSIGNED_BYTE'));
}

function testWorkerFingerprintScriptIsSeparateFromPageWorkerWrapping() {
  const workerScript = getWorkerInjectScript(makeStableFingerprint(123456));

  assert.doesNotThrow(() => new vm.Script(workerScript));
  assert.strictEqual(workerScript.includes('?.'), false);
  assert.ok(workerScript.includes('__geekezWorkerFingerprintInjected__'));
  assert.strictEqual(workerScript.includes('if (self.__geekezWorkerFingerprintInjected__ === true) return'), false);
  assert.ok(workerScript.includes('return __geekezWorkerPatchApplied === true'));
  assert.ok(workerScript.includes("Object.defineProperty(self, '__geekezWorkerFingerprintInjected__', { value: true, configurable: false, writable: false })"));
  assert.ok(workerScript.includes('workerCanvasSeed'));
  assert.ok(workerScript.includes('applyWorkerTypedReadPixelsNoise'));
  assert.ok(workerScript.includes('applyWorkerBufferDestinationNoise'));
  assert.ok(workerScript.includes('canWriteWorkerReadPixelsArray(this, pixels, type)'));
  assert.ok(workerScript.includes('applyWorkerVideoFrameCopyNoise'));
  assert.ok(workerScript.includes('createNoisedWorkerVideoFrame'));
  assert.strictEqual(workerScript.includes('wrapNestedWorkerConstructor'), false);
  assert.strictEqual(workerScript.includes('URL.createObjectURL'), false);
  assert.strictEqual(workerScript.includes('__geekezWorkerBaseUrl'), false);
}

function testBrowserLaunchKeepsExtensionsEnabled() {
  const indexPath = path.join(__dirname, '..', 'src', 'main', 'index.js');
  const source = fs.readFileSync(indexPath, 'utf8');

  assert.match(source, /ignoreDefaultArgs:\s*\[[^\]]*['"]--disable-extensions['"]/s);
}

function testCustomLaunchArgsCannotOverrideManagedExtensionArgs() {
  const args = parseCustomLaunchArgs('--load-extension --disable-extensions-except=/tmp/other --lang=en-US --foo=bar');

  assert.deepStrictEqual(args, ['--lang=en-US', '--foo=bar']);
}

function testBundledChromiumZipIsExtractedBeforeSystemChromeFallback() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'geekez-chromium-test-'));
  const bundledBase = path.join(tempDir, 'puppeteer');
  const archiveId = '147.0.7727.50-chrome-linux64';
  const cacheDir = path.join(tempDir, 'cache');
  const zipPath = path.join(bundledBase, 'chrome', `${archiveId}.zip`);
  const expectedPath = path.join(cacheDir, 'chrome', archiveId, 'chrome-linux64', 'chrome');
  const nonExecutableResource = path.join(cacheDir, 'chrome', archiveId, 'chrome-linux64', 'resources.pak');
  const systemBin = path.join(tempDir, 'bin');
  const systemChrome = path.join(systemBin, 'google-chrome-stable');
  const poisonedChrome = path.join(tempDir, 'poisoned-chrome');

  try {
    fs.mkdirSync(path.dirname(zipPath), { recursive: true });
    fs.mkdirSync(systemBin, { recursive: true });
    fs.writeFileSync(systemChrome, '#!/bin/sh\nexit 0\n');
    fs.writeFileSync(poisonedChrome, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(systemChrome, 0o755);
    fs.chmodSync(poisonedChrome, 0o755);

    const zip = new AdmZip();
    zip.addFile('chrome-linux64/', Buffer.alloc(0));
    zip.addFile('chrome-linux64/chrome', Buffer.from('#!/bin/sh\nexit 0\n'));
    zip.addFile('chrome-linux64/resources.pak', Buffer.from('resource'));
    zip.writeZip(zipPath);

    fs.mkdirSync(path.dirname(expectedPath), { recursive: true });
    fs.symlinkSync(poisonedChrome, expectedPath);
    const zipStat = fs.statSync(zipPath);
    fs.writeFileSync(path.join(cacheDir, 'chrome', archiveId, '.geekez-chromium-extracted.json'), JSON.stringify({
      zipSize: zipStat.size,
      zipMtimeMs: zipStat.mtimeMs
    }));

    const resolvedPath = resolveChromiumPath({
      basePath: bundledBase,
      platform: 'linux',
      env: {
        PATH: systemBin,
        GEEKEZ_CHROMIUM_CACHE_DIR: cacheDir
      }
    });

    assert.strictEqual(resolvedPath, expectedPath);
    assert.ok(fs.existsSync(resolvedPath));
    assert.strictEqual(fs.lstatSync(resolvedPath).isSymbolicLink(), false);
    assert.strictEqual(fs.statSync(nonExecutableResource).mode & 0o022, 0);
    assert.strictEqual(fs.statSync(path.join(cacheDir, 'chrome')).mode & 0o077, 0);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function testMainProcessInstallsCdpFingerprintTargetInjection() {
  const indexPath = path.join(__dirname, '..', 'src', 'main', 'index.js');
  const source = fs.readFileSync(indexPath, 'utf8');
  const blockStart = source.indexOf('const workerInjectScript = getWorkerInjectScript');
  const blockEnd = source.indexOf('await installFingerprintTargetInjection(browser);', blockStart);
  assert.ok(blockStart > -1);
  assert.ok(blockEnd > blockStart);
  const block = source.slice(blockStart, blockEnd);

  assert.ok(block.includes('getWorkerInjectScript'));
  assert.ok(block.includes('installFingerprintTargetInjection'));
  assert.ok(block.includes('configureFingerprintTargetAutoAttach'));
  assert.ok(block.includes('Target.setAutoAttach'));
  assert.ok(block.includes('Target.attachedToTarget'));
  assert.ok(block.includes('Runtime.runIfWaitingForDebugger'));
  assert.ok(block.includes('Page.addScriptToEvaluateOnNewDocument'));
  assert.ok(block.includes('workerInjectScript'));
  assert.ok(block.includes("type: 'worker'"));
  assert.ok(block.includes("type: 'shared_worker'"));
  assert.ok(block.includes('await configureFingerprintTargetAutoAttach(browserSession)'));
  assert.ok(block.includes('await configureFingerprintTargetAutoAttach(childSession)'));
  assert.ok(block.includes('const workerEvaluation = await session.send(\'Runtime.evaluate\''));
  assert.ok(block.includes('expression: workerInjectScript'));
  assert.strictEqual(block.includes('__geekezWorkerFingerprintInjected__ === true'), false);
  assert.ok(block.includes('workerEvaluation.exceptionDetails'));
  assert.ok(block.includes('workerEvaluation.result'));
  assert.ok(block.includes('const isFingerprintTargetType = (targetType) =>'));
  assert.ok(block.includes('runIfWaitingForDebugger(childSession)'));
  assert.ok(block.includes('cdpAutoAttachListenerSessions'));
  assert.strictEqual(block.includes('catch (fallbackError) { }'), false);
  assert.strictEqual(block.includes('cdpInjectedSessions.add(session);\n\n            const targetType'), false);
  const workerBranch = block.slice(block.indexOf('if (isWorkerFingerprintTargetType(targetType))'));
  assert.ok(block.indexOf('await configureFingerprintTargetAutoAttach(childSession)') < block.indexOf('await applyFingerprintTargetSession(childSession, event.targetInfo || {})'));
  assert.ok(workerBranch.indexOf("const workerEvaluation = await session.send('Runtime.evaluate'") < workerBranch.indexOf('cdpInjectedSessions.add(session)'));
  assert.strictEqual(block.includes('if (shouldResume)'), false);
  assert.ok(block.indexOf('await applyFingerprintTargetSession(childSession, event.targetInfo || {})') < block.indexOf('await runIfWaitingForDebugger(childSession)'));
}

function testMainProcessKeepsSeedLifecycleGuards() {
  const indexPath = path.join(__dirname, '..', 'src', 'main', 'index.js');
  const source = fs.readFileSync(indexPath, 'utf8');

  assert.ok(source.includes('deriveOnMissingProfileId: !existingProfile'));
  assert.ok(source.includes('deriveOnProfileMismatch: !existingProfile'));
  assert.ok(source.includes("ipcMain.handle('preview-canvas-fingerprint'"));
  assert.ok(source.includes('source.webglProfile !== source.webgl.profileId'));
  assert.ok(source.includes('delete source.webgl'));
  assert.ok(source.includes('deriveOnMissingProfileId: false'));
  assert.ok(source.includes('deriveOnProfileMismatch: false'));
}

function testProfileScopedNoiseSeedMakesCopiedProfilesDifferent() {
  const base = makeStableFingerprint(123456);
  const profileA = applyProfileScopedNoiseSeed(base, 'profile-a');
  const profileAAgain = applyProfileScopedNoiseSeed(profileA, 'profile-a');
  const profileB = applyProfileScopedNoiseSeed(base, 'profile-b');

  assert.notStrictEqual(profileA.noiseSeed, base.noiseSeed);
  assert.notStrictEqual(profileA.noiseSeed, profileB.noiseSeed);
  assert.deepStrictEqual(profileA, profileAAgain);
  assert.strictEqual(profileA.noiseSeedProfileId, 'profile-a');
  assert.strictEqual(profileB.noiseSeedProfileId, 'profile-b');
}

function testProfileNoiseSeedLifecycleIsStableUntilRotated() {
  const base = makeStableFingerprint(123456);
  const firstSave = ensureProfileScopedNoiseSeed(base, 'profile-a');
  const repeatedLaunch = ensureProfileScopedNoiseSeed(firstSave, 'profile-a');
  const ordinaryEdit = ensureProfileScopedNoiseSeed({
    ...firstSave,
    timezone: 'Europe/London'
  }, 'profile-a');
  const rotated = rotateProfileNoiseSeed(ordinaryEdit, 'profile-a');
  const launchAfterRotate = ensureProfileScopedNoiseSeed(rotated, 'profile-a');

  assert.strictEqual(firstSave.noiseSeedProfileId, 'profile-a');
  assert.strictEqual(repeatedLaunch.noiseSeed, firstSave.noiseSeed);
  assert.deepStrictEqual(repeatedLaunch, firstSave);
  assert.strictEqual(ordinaryEdit.noiseSeed, firstSave.noiseSeed);
  assert.strictEqual(ordinaryEdit.noiseSeedProfileId, 'profile-a');
  assert.notStrictEqual(rotated.noiseSeed, ordinaryEdit.noiseSeed);
  assert.strictEqual(rotated.noiseSeedProfileId, 'profile-a');
  assert.deepStrictEqual(launchAfterRotate, rotated);
}

function testCanvasFingerprintPreviewIsDeterministicAndNonLaunching() {
  const fingerprint = ensureProfileScopedNoiseSeed(makeStableFingerprint(123456), 'profile-a');
  const preview = buildCanvasFingerprintPreview(fingerprint, 'profile-a');
  const previewAgain = buildCanvasFingerprintPreview(fingerprint, 'profile-a');
  const rotatedPreview = buildCanvasFingerprintPreview(rotateProfileNoiseSeed(fingerprint, 'profile-a'), 'profile-a');

  assert.deepStrictEqual(preview, previewAgain);
  assert.strictEqual(preview.profileId, 'profile-a');
  assert.strictEqual(preview.noiseSeed, fingerprint.noiseSeed);
  assert.strictEqual(preview.noiseSeedProfileId, 'profile-a');
  assert.strictEqual(preview.launchRequired, false);
  assert.strictEqual(preview.previewType, 'offline-simulated');
  assert.ok(/^canvas-[0-9a-f]{16}$/.test(preview.canvasPreviewHash));
  assert.notStrictEqual(rotatedPreview.canvasPreviewHash, preview.canvasPreviewHash);
}

function main() {
  ({ generateXrayConfig, parseProxyLink } = loadMainUtilsForTest());
  ({ createDuplicateProfilePayload } = loadProfileCopyForTest());
  ({
    generateFingerprint,
    getInjectScript,
    getWorkerInjectScript,
    applyProfileScopedNoiseSeed,
    ensureProfileScopedNoiseSeed,
    rotateProfileNoiseSeed,
    buildCanvasFingerprintPreview
  } = loadFingerprintForTest());

  testDuplicateProfilePayload();
  testOutboundProxyFields();
  testProxyProbeTargets();
  testProxyStartupHealthConfig();
  testProfilePreProxyResolution();
  testProfilePreProxyRejectsEmptyGlobalNode();
  testProfilePreProxyRejectsEnabledModeWithoutActiveNodes();
  testProfileProxyResolution();
  testMainProxyKeepsExplicitFingerprint();
  testChainedXrayConfigKeepsPreProxyFingerprint();
  testChainedXrayConfigAddsMissingPreProxyFingerprint();
  testMissingFingerprintFallbackDoesNotDependOnUaMode();
  testGenerateXrayConfigFailsClosedWhenPreProxyInvalid();
  testParseProxyLinkDoesNotLogRawCredentials();
  testParseProxyLinkThrowsSanitizedInvalidUrlError();
  testCanvasFingerprintScriptUsesStableProfileSeed();
  testCanvasFingerprintScriptCoversSerializationAndWebglReadback();
  testWorkerFingerprintScriptIsSeparateFromPageWorkerWrapping();
  testBrowserLaunchKeepsExtensionsEnabled();
  testCustomLaunchArgsCannotOverrideManagedExtensionArgs();
  testBundledChromiumZipIsExtractedBeforeSystemChromeFallback();
  testMainProcessInstallsCdpFingerprintTargetInjection();
  testMainProcessKeepsSeedLifecycleGuards();
  testProfileScopedNoiseSeedMakesCopiedProfilesDifferent();
  testProfileNoiseSeedLifecycleIsStableUntilRotated();
  testCanvasFingerprintPreviewIsDeterministicAndNonLaunching();
  console.log('proxy behavior tests passed');
}

main();
