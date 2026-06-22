const os = require('os');
const fs = require('fs');
const path = require('path');

const RESOLUTIONS = [
    { w: 1920, h: 1080 },
    { w: 2560, h: 1440 },
    { w: 1366, h: 768 },
    { w: 1536, h: 864 },
    { w: 1440, h: 900 }
];

const BROWSER_MAJOR_VERSIONS = Array.from({ length: 19 }, (_, i) => 129 + i); // 129 - 147
const BROWSER_TYPES = ['chrome', 'edge'];
const UTLS_SIGNATURES = [
    'none',
    'chrome',
    'edge',
    'firefox',
    'safari',
    'ios',
    'android',
    'qq',
    '360',
    'random',
    'randomized',
    'hellorandomizednoalpn'
];
const BROWSER_FULL_VERSION_POOL = [
    '147.0.0.0',
    '146.0.0.0',
    '145.0.0.0',
    '144.0.0.0',
    '143.0.0.0',
    '142.0.0.0',
    '141.0.0.0',
    '140.0.0.0',
    '139.0.0.0',
    '138.0.0.0',
    '137.0.0.0',
    '136.0.0.0',
    '135.0.0.0',
    '134.0.0.0',
    '133.0.0.0',
    '132.0.0.0',
    '131.0.0.0',
    '130.0.0.0',
    '129.0.0.0'
];
const BROWSER_FULL_VERSION_BY_MAJOR = BROWSER_FULL_VERSION_POOL.reduce((acc, version) => {
    const major = String(version).split('.')[0];
    if (!acc[major]) acc[major] = [];
    if (!acc[major].includes(version)) acc[major].push(version);
    return acc;
}, {});

const WEBGL_CATALOG = {
    windows: [
        {
            id: 'win_intel_uhd_620',
            vendor: 'Google Inc. (Intel)',
            renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00003EA0) Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'Intel Inc.',
            unmaskedRenderer: 'Intel(R) UHD Graphics 620',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_intel_uhd_630',
            vendor: 'Google Inc. (Intel)',
            renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'Intel Inc.',
            unmaskedRenderer: 'Intel(R) UHD Graphics 630',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_intel_iris_xe',
            vendor: 'Google Inc. (Intel)',
            renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'Intel Inc.',
            unmaskedRenderer: 'Intel(R) Iris(R) Xe Graphics',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_gtx_1050',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce GTX 1050/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_gtx_1060',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce GTX 1060 6GB/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_gtx_1660',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce GTX 1660 SUPER/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_2060',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 2060/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_3060',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_3070',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 3070/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_3080',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 3080/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_4060',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 4060/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_4070',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 4070/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_rtx_4080',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 4080/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_amd_rx_580',
            vendor: 'Google Inc. (AMD)',
            renderer: 'ANGLE (AMD, Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'Radeon RX 580 Series',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_amd_rx_6600',
            vendor: 'Google Inc. (AMD)',
            renderer: 'ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon RX 6600 XT',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_amd_rx_6700',
            vendor: 'Google Inc. (AMD)',
            renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon RX 6700 XT',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_amd_rx_6800',
            vendor: 'Google Inc. (AMD)',
            renderer: 'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon RX 6800 XT',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_amd_vega_8',
            vendor: 'Google Inc. (AMD)',
            renderer: 'ANGLE (AMD, AMD Radeon(TM) Vega 8 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon(TM) Vega 8 Graphics',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_nvidia_1650',
            vendor: 'Google Inc. (NVIDIA)',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 (0x00001F99) Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce GTX 1650/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'win_amd_rx6600',
            vendor: 'Google Inc. (AMD)',
            renderer: 'ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon RX 6600 XT',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        }
    ],
    mac: [
        {
            id: 'mac_apple_m1',
            vendor: 'Google Inc. (Apple)',
            renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)',
            unmaskedVendor: 'Apple Inc.',
            unmaskedRenderer: 'Apple M1',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_apple_m2',
            vendor: 'Google Inc. (Apple)',
            renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)',
            unmaskedVendor: 'Apple Inc.',
            unmaskedRenderer: 'Apple M2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_apple_m3',
            vendor: 'Google Inc. (Apple)',
            renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)',
            unmaskedVendor: 'Apple Inc.',
            unmaskedRenderer: 'Apple M3',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_apple_m4',
            vendor: 'Google Inc. (Apple)',
            renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)',
            unmaskedVendor: 'Apple Inc.',
            unmaskedRenderer: 'Apple M4',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_intel_iris',
            vendor: 'Google Inc. (Intel)',
            renderer: 'Intel Iris OpenGL Engine',
            unmaskedVendor: 'Intel Inc.',
            unmaskedRenderer: 'Intel Iris OpenGL Engine',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_intel_uhd_630',
            vendor: 'Google Inc. (Intel)',
            renderer: 'Intel UHD Graphics 630 OpenGL Engine',
            unmaskedVendor: 'Intel Inc.',
            unmaskedRenderer: 'Intel UHD Graphics 630 OpenGL Engine',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_amd_pro_560x',
            vendor: 'ATI Technologies Inc.',
            renderer: 'AMD Radeon Pro 560X OpenGL Engine',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon Pro 560X OpenGL Engine',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'mac_amd_pro_5500m',
            vendor: 'ATI Technologies Inc.',
            renderer: 'AMD Radeon Pro 5500M OpenGL Engine',
            unmaskedVendor: 'ATI Technologies Inc.',
            unmaskedRenderer: 'AMD Radeon Pro 5500M OpenGL Engine',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        }
    ],
    linux: [
        {
            id: 'linux_mesa_intel_620',
            vendor: 'Intel Open Source Technology Center',
            renderer: 'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
            unmaskedVendor: 'Intel Open Source Technology Center',
            unmaskedRenderer: 'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_mesa_intel_xe',
            vendor: 'Intel Open Source Technology Center',
            renderer: 'Mesa Intel(R) Xe Graphics (TGL GT2)',
            unmaskedVendor: 'Intel Open Source Technology Center',
            unmaskedRenderer: 'Mesa Intel(R) Xe Graphics (TGL GT2)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_nvidia_1650',
            vendor: 'NVIDIA Corporation',
            renderer: 'NVIDIA GeForce GTX 1650/PCIe/SSE2',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce GTX 1650/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_nvidia_3060',
            vendor: 'NVIDIA Corporation',
            renderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_nvidia_4090',
            vendor: 'NVIDIA Corporation',
            renderer: 'NVIDIA GeForce RTX 4090/PCIe/SSE2',
            unmaskedVendor: 'NVIDIA Corporation',
            unmaskedRenderer: 'NVIDIA GeForce RTX 4090/PCIe/SSE2',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_mesa_amd_6600',
            vendor: 'X.Org',
            renderer: 'AMD Radeon RX 6600 XT (radeonsi, navi23, LLVM 17.0.6, DRM 3.57, 6.8.0)',
            unmaskedVendor: 'X.Org',
            unmaskedRenderer: 'AMD Radeon RX 6600 XT (radeonsi, navi23, LLVM 17.0.6, DRM 3.57, 6.8.0)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_mesa_amd_6800',
            vendor: 'X.Org',
            renderer: 'AMD Radeon RX 6800 XT (radeonsi, navi21, LLVM 17.0.6, DRM 3.57, 6.8.0)',
            unmaskedVendor: 'X.Org',
            unmaskedRenderer: 'AMD Radeon RX 6800 XT (radeonsi, navi21, LLVM 17.0.6, DRM 3.57, 6.8.0)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_mesa_amd',
            vendor: 'X.Org',
            renderer: 'AMD Radeon RX 6600 XT (radeonsi, navi23, LLVM 17.0.6, DRM 3.57, 6.8.0)',
            unmaskedVendor: 'X.Org',
            unmaskedRenderer: 'AMD Radeon RX 6600 XT (radeonsi, navi23, LLVM 17.0.6, DRM 3.57, 6.8.0)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        },
        {
            id: 'linux_mesa_intel',
            vendor: 'Intel Open Source Technology Center',
            renderer: 'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
            unmaskedVendor: 'Intel Open Source Technology Center',
            unmaskedRenderer: 'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        }
    ]
};

function sanitizeProfileId(input, fallback = 'profile') {
    const clean = String(input || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return clean || fallback;
}

function inferWebglVendorMeta(renderer) {
    const value = String(renderer || '');
    const lower = value.toLowerCase();
    if (lower.includes('apple')) return { vendor: 'Google Inc. (Apple)', unmaskedVendor: 'Apple Inc.' };
    if (lower.includes('nvidia')) return { vendor: 'Google Inc. (NVIDIA)', unmaskedVendor: 'NVIDIA Corporation' };
    if (lower.includes('intel')) return { vendor: 'Google Inc. (Intel)', unmaskedVendor: 'Intel Inc.' };
    if (lower.includes('amd') || lower.includes('radeon') || lower.includes('ati')) return { vendor: 'Google Inc. (AMD)', unmaskedVendor: 'ATI Technologies Inc.' };
    if (lower.includes('mesa') || lower.includes('x.org')) return { vendor: 'X.Org', unmaskedVendor: 'X.Org' };
    return { vendor: 'Google Inc.', unmaskedVendor: 'Google Inc.' };
}

function inferWebglRuntimeBucket(renderer) {
    const value = String(renderer || '').toLowerCase();
    if (value.includes('direct3d')) return 'windows';
    if (value.includes('metal') || value.includes('apple')) return 'mac';
    if (value.includes('mesa') || value.includes('x.org') || value.includes('opengl')) return 'linux';

    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'mac';
    return 'linux';
}

function buildExternalWebglProfile(renderer, index) {
    const meta = inferWebglVendorMeta(renderer);
    const bucket = inferWebglRuntimeBucket(renderer);
    return {
        bucket,
        profile: {
            id: `ext_${bucket}_${sanitizeProfileId(renderer).slice(0, 48)}_${index}`,
            vendor: meta.vendor,
            renderer,
            unmaskedVendor: meta.unmaskedVendor,
            unmaskedRenderer: renderer,
            version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        }
    };
}

function augmentWebglCatalogFromExternalDataset() {
    const datasetDir = ['Virtual', 'Browser'].join('');
    const candidates = [
        path.resolve(process.cwd(), `${datasetDir}/server/src/utils/webgl.json`),
        path.resolve(__dirname, `../../${datasetDir}/server/src/utils/webgl.json`),
        path.resolve(__dirname, `../../../${datasetDir}/server/src/utils/webgl.json`)
    ];

    const sourcePath = candidates.find(p => fs.existsSync(p));
    if (!sourcePath) return;

    try {
        const list = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
        if (!Array.isArray(list) || list.length === 0) return;

        const existing = new Set(
            [...WEBGL_CATALOG.windows, ...WEBGL_CATALOG.mac, ...WEBGL_CATALOG.linux]
                .map(item => String(item.renderer || '').trim())
                .filter(Boolean)
        );

        list.forEach((renderer, idx) => {
            const cleanRenderer = String(renderer || '').trim();
            if (!cleanRenderer || existing.has(cleanRenderer)) return;
            const { bucket, profile } = buildExternalWebglProfile(cleanRenderer, idx + 1);
            if (!WEBGL_CATALOG[bucket]) return;
            WEBGL_CATALOG[bucket].push(profile);
            existing.add(cleanRenderer);
        });
    } catch (err) {
        void err;
    }
}

augmentWebglCatalogFromExternalDataset();

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function asNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function deriveProfileNoiseSeed(noiseSeed, profileId) {
    const baseSeed = asNumber(noiseSeed);
    if (!baseSeed) return null;
    const idText = String(profileId || '').trim();
    if (!idText) return Math.floor(baseSeed);

    let hash = 2166136261;
    for (let i = 0; i < idText.length; i++) {
        hash ^= idText.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return ((Math.floor(baseSeed) ^ (hash >>> 0)) % 9000000 + 9000000) % 9000000 + 1000;
}

function applyProfileScopedNoiseSeed(fingerprint, profileId) {
    if (!fingerprint || typeof fingerprint !== 'object') return fingerprint;
    const idText = String(profileId || '').trim();
    if (!idText || fingerprint.noiseSeedProfileId === idText) return fingerprint;

    const nextSeed = deriveProfileNoiseSeed(fingerprint.noiseSeed, idText);
    if (!nextSeed) return fingerprint;
    return {
        ...fingerprint,
        noiseSeed: nextSeed,
        noiseSeedProfileId: idText
    };
}

function normalizeNoiseSeedValue(value) {
    const seed = asNumber(value);
    return seed ? Math.floor(seed) : null;
}

function createProfileScopedNoiseSeed(profileId) {
    const baseSeed = randInt(1000, 9999999);
    return deriveProfileNoiseSeed(baseSeed, profileId) || baseSeed;
}

function ensureProfileScopedNoiseSeed(fingerprint, profileId, options = {}) {
    if (!fingerprint || typeof fingerprint !== 'object') return fingerprint;
    const idText = String(profileId || '').trim();
    const currentSeed = normalizeNoiseSeedValue(fingerprint.noiseSeed);

    if (!idText) {
        return currentSeed ? fingerprint : { ...fingerprint, noiseSeed: randInt(1000, 9999999) };
    }

    const marker = String(fingerprint.noiseSeedProfileId || '').trim();
    if (currentSeed && marker === idText) return fingerprint;
    if (!currentSeed) return rotateProfileNoiseSeed(fingerprint, idText);

    const shouldDerive = (!marker && options.deriveOnMissingProfileId === true) ||
        (marker && marker !== idText && options.deriveOnProfileMismatch === true);
    const nextSeed = shouldDerive
        ? (deriveProfileNoiseSeed(currentSeed, idText) || currentSeed)
        : currentSeed;

    return {
        ...fingerprint,
        noiseSeed: nextSeed,
        noiseSeedProfileId: idText
    };
}

function rotateProfileNoiseSeed(fingerprint, profileId) {
    if (!fingerprint || typeof fingerprint !== 'object') return fingerprint;
    const idText = String(profileId || '').trim();
    const currentSeed = normalizeNoiseSeedValue(fingerprint.noiseSeed);
    let nextSeed = null;

    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = idText ? createProfileScopedNoiseSeed(idText) : randInt(1000, 9999999);
        if (!currentSeed || candidate !== currentSeed) {
            nextSeed = candidate;
            break;
        }
    }

    const seed = nextSeed || (idText ? createProfileScopedNoiseSeed(idText) : randInt(1000, 9999999));
    return {
        ...fingerprint,
        noiseSeed: seed,
        ...(idText ? { noiseSeedProfileId: idText } : {})
    };
}

function hashCanvasPreviewText(text) {
    let h1 = 2166136261;
    let h2 = 16777619;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        h1 ^= code;
        h1 = Math.imul(h1, 16777619);
        h2 ^= code + i;
        h2 = Math.imul(h2, 2246822519);
    }
    return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

function buildCanvasFingerprintPreview(fingerprint, profileId) {
    const normalizedFp = generateFingerprint(fingerprint || {});
    const scopedFp = ensureProfileScopedNoiseSeed(normalizedFp, profileId, {
        deriveOnMissingProfileId: false,
        deriveOnProfileMismatch: false
    });
    const idText = String(profileId || '').trim();
    const previewPayload = {
        profileId: idText,
        noiseSeed: Number(scopedFp.noiseSeed) || 0,
        noiseSeedProfileId: scopedFp.noiseSeedProfileId || '',
        canvasNoise: scopedFp.canvasNoise || {},
        screen: scopedFp.screen || {},
        webglProfile: scopedFp.webglProfile || 'none'
    };

    return {
        ...previewPayload,
        canvasPreviewHash: `canvas-${hashCanvasPreviewText(JSON.stringify(previewPayload))}`,
        previewType: 'offline-simulated',
        launchRequired: false
    };
}

function resolveRuntimePlatform(explicitPlatform) {
    if (explicitPlatform === 'Win32') return 'windows';
    if (explicitPlatform === 'MacIntel') return 'mac';
    if (explicitPlatform === 'Linux x86_64') return 'linux';

    const platform = os.platform();
    if (platform === 'win32') return 'windows';
    if (platform === 'darwin') return 'mac';
    return 'linux';
}

function getPlatformValues(runtimePlatform) {
    if (runtimePlatform === 'windows') {
        return {
            navigatorPlatform: 'Win32',
            uaPlatformToken: 'Windows NT 10.0; Win64; x64',
            uaMetadataPlatform: 'Windows',
            platformVersion: '10.0.0',
            architecture: 'x86',
            bitness: '64'
        };
    }

    if (runtimePlatform === 'mac') {
        return {
            navigatorPlatform: 'MacIntel',
            uaPlatformToken: 'Macintosh; Intel Mac OS X 10_15_7',
            uaMetadataPlatform: 'macOS',
            platformVersion: '13.0.0',
            architecture: 'x86',
            bitness: '64'
        };
    }

    return {
        navigatorPlatform: 'Linux x86_64',
        uaPlatformToken: 'X11; Linux x86_64',
        uaMetadataPlatform: 'Linux',
        platformVersion: '6.0.0',
        architecture: 'x86',
        bitness: '64'
    };
}

function resolveBrowserType(type) {
    return BROWSER_TYPES.includes(type) ? type : getRandom(BROWSER_TYPES);
}

function resolveUaMode(mode) {
    return mode === 'none' ? 'none' : 'spoof';
}

function resolveBrowserMajorVersion(major) {
    const parsed = asNumber(major);
    if (parsed && parsed >= 100 && parsed <= 200) return Math.floor(parsed);
    return getRandom(BROWSER_MAJOR_VERSIONS);
}

function resolveBrowserFullVersion(fullVersion, majorVersion) {
    if (typeof fullVersion === 'string' && /^\d+\.\d+\.\d+\.\d+$/.test(fullVersion.trim())) {
        const normalized = fullVersion.trim();
        if (Number(normalized.split('.')[0]) === Number(majorVersion)) {
            return normalized;
        }
    }
    const known = BROWSER_FULL_VERSION_BY_MAJOR[String(majorVersion)];
    if (Array.isArray(known) && known.length > 0) {
        return getRandom(known);
    }
    return `${majorVersion}.0.0.0`;
}

function mapBrowserMajorToUtls(browserType, majorVersion) {
    // Xray supports a limited set of uTLS signatures, so we map major versions to those
    // signatures to keep TLS handshake style closer to the chosen browser family.
    if (browserType === 'edge') {
        if (majorVersion >= 132) return 'edge';
        if (majorVersion >= 126) return 'chrome';
        return 'randomized';
    }

    if (majorVersion >= 134) return 'chrome';
    if (majorVersion >= 128) return 'randomized';
    if (majorVersion >= 123) return 'hellorandomizednoalpn';
    return 'chrome';
}

function resolveTlsClientHello(value, browserType, majorVersion, uaMode) {
    if (uaMode === 'none') return 'none';
    // Keep TLS ClientHello aligned with the selected UA family/version.
    return mapBrowserMajorToUtls(browserType, majorVersion);
}

function buildBrowserBrands(browserType, majorVersion, fullVersion) {
    const browserBrand = browserType === 'edge' ? 'Microsoft Edge' : 'Google Chrome';
    const brands = [
        { brand: 'Not.A/Brand', version: '99' },
        { brand: 'Chromium', version: String(majorVersion) },
        { brand: browserBrand, version: String(majorVersion) }
    ];

    return {
        brands,
        fullVersionList: [
            { brand: 'Not.A/Brand', version: '99.0.0.0' },
            { brand: 'Chromium', version: fullVersion },
            { brand: browserBrand, version: fullVersion }
        ]
    };
}

function buildUserAgent(browserType, fullVersion, uaPlatformToken) {
    const base = `Mozilla/5.0 (${uaPlatformToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullVersion} Safari/537.36`;
    if (browserType === 'edge') return `${base} Edg/${fullVersion}`;
    return base;
}

function normalizeLanguages(language, languages) {
    if (Array.isArray(languages) && languages.length > 0) {
        return languages.filter(Boolean).map(v => String(v));
    }

    if (typeof language === 'string' && language && language !== 'auto') {
        const shortLang = language.split('-')[0];
        return shortLang && shortLang !== language ? [language, shortLang] : [language];
    }

    return ['en-US', 'en'];
}

function resolveScreen(screen, width, height) {
    if (screen && asNumber(screen.width) && asNumber(screen.height)) {
        return {
            width: Math.floor(asNumber(screen.width)),
            height: Math.floor(asNumber(screen.height))
        };
    }

    if (asNumber(width) && asNumber(height)) {
        return {
            width: Math.floor(asNumber(width)),
            height: Math.floor(asNumber(height))
        };
    }

    const randomRes = getRandom(RESOLUTIONS);
    return { width: randomRes.w, height: randomRes.h };
}

function getWebglProfilesByRuntime(runtimePlatform) {
    if (runtimePlatform === 'windows') return WEBGL_CATALOG.windows;
    if (runtimePlatform === 'mac') return WEBGL_CATALOG.mac;
    return WEBGL_CATALOG.linux;
}

function resolveWebglProfile(runtimePlatform, requestedProfile, explicitWebgl) {
    if (requestedProfile === 'none') {
        return {
            profileId: 'none',
            disabled: true
        };
    }

    if (explicitWebgl && typeof explicitWebgl === 'object') {
        return {
            profileId: explicitWebgl.profileId || requestedProfile || 'custom',
            disabled: !!explicitWebgl.disabled,
            vendor: explicitWebgl.vendor || 'Google Inc.',
            renderer: explicitWebgl.renderer || 'ANGLE (Unknown GPU)',
            unmaskedVendor: explicitWebgl.unmaskedVendor || explicitWebgl.vendor || 'Google Inc.',
            unmaskedRenderer: explicitWebgl.unmaskedRenderer || explicitWebgl.renderer || 'ANGLE (Unknown GPU)',
            version: explicitWebgl.version || 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
            shadingLanguageVersion: explicitWebgl.shadingLanguageVersion || 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'
        };
    }

    const runtimeCatalog = getWebglProfilesByRuntime(runtimePlatform);
    const allCatalog = [...WEBGL_CATALOG.windows, ...WEBGL_CATALOG.mac, ...WEBGL_CATALOG.linux];
    const exact = allCatalog.find(item => item.id === requestedProfile);
    const selected = exact || getRandom(runtimeCatalog);

    return {
        profileId: selected.id,
        vendor: selected.vendor,
        renderer: selected.renderer,
        unmaskedVendor: selected.unmaskedVendor,
        unmaskedRenderer: selected.unmaskedRenderer,
        version: selected.version,
        shadingLanguageVersion: selected.shadingLanguageVersion
    };
}

function buildSecChUa(brands) {
    if (!Array.isArray(brands) || brands.length === 0) return '';
    return brands.map(item => `"${item.brand}";v="${item.version}"`).join(', ');
}

function generateFingerprint(options = {}) {
    const runtimePlatform = resolveRuntimePlatform(options.platform);
    const platformValues = getPlatformValues(runtimePlatform);
    const uaMode = resolveUaMode(options.uaMode);

    const resolvedBrowserType = resolveBrowserType(options.browserType);
    const resolvedBrowserMajorVersion = resolveBrowserMajorVersion(options.browserMajorVersion);
    const resolvedBrowserFullVersion = resolveBrowserFullVersion(options.browserFullVersion, resolvedBrowserMajorVersion);
    const browserType = uaMode === 'none' ? null : resolvedBrowserType;
    const browserMajorVersion = uaMode === 'none' ? null : resolvedBrowserMajorVersion;
    const browserFullVersion = uaMode === 'none' ? null : resolvedBrowserFullVersion;

    const brandInfo = buildBrowserBrands(resolvedBrowserType, resolvedBrowserMajorVersion, resolvedBrowserFullVersion);
    const defaultUaMetadata = {
        brands: brandInfo.brands,
        fullVersionList: brandInfo.fullVersionList,
        mobile: false,
        platform: platformValues.uaMetadataPlatform,
        platformVersion: platformValues.platformVersion,
        architecture: platformValues.architecture,
        bitness: platformValues.bitness,
        model: '',
        wow64: false,
        uaFullVersion: resolvedBrowserFullVersion
    };

    const screen = resolveScreen(options.screen, options.resW, options.resH);
    const hasLanguageOverride = typeof options.language === 'string' && options.language && options.language !== 'auto';
    const language = hasLanguageOverride ? options.language : 'auto';
    const languages = hasLanguageOverride ? normalizeLanguages(language, options.languages) : [];

    const webgl = resolveWebglProfile(runtimePlatform, options.webglProfile || options.webglProfileId, options.webgl);
    const tlsClientHello = resolveTlsClientHello(options.tlsClientHello, resolvedBrowserType, resolvedBrowserMajorVersion, uaMode);
    const userAgentMetadata = uaMode === 'none'
        ? null
        : {
            ...defaultUaMetadata,
            ...(options.userAgentMetadata || {})
        };
    const userAgent = uaMode === 'none'
        ? null
        : (options.userAgent || buildUserAgent(resolvedBrowserType, resolvedBrowserFullVersion, platformValues.uaPlatformToken));

    const fingerprint = {
        uaMode,
        platform: platformValues.navigatorPlatform,
        screen,
        window: { ...screen },
        language,
        languages,
        hardwareConcurrency: asNumber(options.hardwareConcurrency) || getRandom([4, 8, 12, 16]),
        deviceMemory: asNumber(options.deviceMemory) || getRandom([2, 4, 8, 16]),
        canvasNoise: options.canvasNoise || {
            r: randInt(-5, 5),
            g: randInt(-5, 5),
            b: randInt(-5, 5),
            a: randInt(-5, 5)
        },
        audioNoise: typeof options.audioNoise === 'number' ? options.audioNoise : (Math.random() * 0.000001),
        noiseSeed: asNumber(options.noiseSeed) || randInt(1000, 9999999),
        timezone: options.timezone || 'America/Los_Angeles',
        city: options.city || null,
        geolocation: options.geolocation || null,
        browserType,
        browserMajorVersion,
        browserFullVersion,
        userAgent,
        userAgentMetadata,
        secChUa: userAgentMetadata ? buildSecChUa(userAgentMetadata.brands) : '',
        tlsClientHello,
        webgl,
        webglProfile: webgl?.profileId || 'none'
    };

    return fingerprint;
}


function buildWorkerFingerprintPayload(fp) {
    const normalizedFp = generateFingerprint(fp || {});
    const enableUaSpoof = normalizedFp.uaMode !== 'none';
    const targetUa = (enableUaSpoof && normalizedFp.userAgent) ? normalizedFp.userAgent : '';
    const targetMeta = normalizedFp.userAgentMetadata || {};
    const hasLanguageOverride = typeof normalizedFp.language === 'string' && normalizedFp.language && normalizedFp.language !== 'auto';
    const targetLanguage = hasLanguageOverride ? normalizedFp.language : 'en-US';
    const targetLanguages = hasLanguageOverride
        ? (Array.isArray(normalizedFp.languages) && normalizedFp.languages.length > 0 ? normalizedFp.languages : [targetLanguage])
        : [targetLanguage];
    const targetPlatform = normalizedFp.platform || '';
    const webglInfo = normalizedFp.webgl || {};
    const enableWebglSpoof = !!(normalizedFp.webgl && !normalizedFp.webgl.disabled && normalizedFp.webglProfile !== 'none');

    return {
        uaMode: normalizedFp.uaMode || 'spoof',
        enableWebglSpoof,
        userAgent: targetUa,
        userAgentMetadata: targetMeta,
        languageOverrideEnabled: hasLanguageOverride,
        language: targetLanguage,
        languages: targetLanguages,
        platform: targetPlatform,
        webgl: webglInfo,
        noiseSeed: Number(normalizedFp.noiseSeed) || 0,
        canvasNoise: normalizedFp.canvasNoise || {},
        audioNoise: normalizedFp.audioNoise || 0.0000001,
        workerSourceUrl: ''
    };
}

function applyWorkerFingerprintPatch(workerPayload) {
                        try {
                            const workerHookedFunctions = new WeakSet();
                            const workerPatchMarkers = new WeakMap();
                            const markWorkerHook = (func) => {
                                try { workerHookedFunctions.add(func); } catch (e) { }
                                return func;
                            };
                            const isWorkerHookedFunction = (func) => {
                                try {
                                    return !!func && workerHookedFunctions.has(func);
                                } catch (e) {
                                    return false;
                                }
                            };
                            const markWorkerPatch = (target, key, verify) => {
                                if (!target || !key) return false;
                                try {
                                    if (typeof verify === 'function' && verify() !== true) return false;
                                } catch (e) {
                                    return false;
                                }
                                try {
                                    let markers = workerPatchMarkers.get(target);
                                    if (!markers) {
                                        markers = Object.create(null);
                                        workerPatchMarkers.set(target, markers);
                                    }
                                    markers[key] = true;
                                } catch (e) { }
                                return true;
                            };
                            const hasWorkerPatchMarker = (target, key) => {
                                if (!target || !key) return false;
                                try {
                                    const markers = workerPatchMarkers.get(target);
                                    return !!(markers && markers[key] === true);
                                } catch (e) {
                                    return false;
                                }
                            };
                            const getWorkerGetter = (target, key) => {
                                try {
                                    const descriptor = Object.getOwnPropertyDescriptor(target, key);
                                    return descriptor && descriptor.get;
                                } catch (e) {
                                    return null;
                                }
                            };
                            const hasWorkerGetterHook = (target, key) => isWorkerHookedFunction(getWorkerGetter(target, key));
                            const isWorkerFunctionHook = (target, key) => {
                                try { return isWorkerHookedFunction(target && target[key]); } catch (e) { return false; }
                            };
                            const defineWorkerFunction = (target, key, func) => {
                                if (!target || !key || typeof func !== 'function') return false;
                                try {
                                    Object.defineProperty(target, key, { value: func, configurable: true, writable: true });
                                } catch (e) {
                                    try { target[key] = func; } catch (fallbackError) { }
                                }
                                try { return target[key] === func; } catch (e) { return false; }
                            };
                            const makeNative = (func, name) => {
                                const nativeStr = 'function ' + name + '() { [native code] }';
                                markWorkerHook(func);
                                try {
                                    Object.defineProperty(func, 'toString', {
                                        value: function() { return nativeStr; },
                                        configurable: true
                                    });
                                } catch (e) { }
                                return func;
                            };

                            const defineGetter = (target, key, value, nativeName) => {
                                if (!target) return;
                                try {
                                    const getter = makeNative(function() { return value; }, nativeName || key);
                                    Object.defineProperty(target, key, { get: getter, configurable: true });
                                } catch (e) { }
                            };

                            const nav = self.navigator || {};
                            const navProto = Object.getPrototypeOf(nav);
                            const hasWorkerLanguageOverride = !!workerPayload.languageOverrideEnabled;
                            const targetLang = hasWorkerLanguageOverride
                                ? (workerPayload.language || 'en-US')
                                : (nav.language || 'en-US');
                            const targetLangs = hasWorkerLanguageOverride
                                ? (Array.isArray(workerPayload.languages) && workerPayload.languages.length > 0
                                    ? workerPayload.languages
                                    : [targetLang])
                                : (Array.isArray(nav.languages) && nav.languages.length > 0 ? nav.languages : [targetLang]);
                            const targetPlatform = workerPayload.platform || '';

                            const enableWorkerUaSpoof = workerPayload.uaMode !== 'none';
                            if (enableWorkerUaSpoof) {
                                defineGetter(navProto, 'userAgent', workerPayload.userAgent || nav.userAgent, 'get userAgent');
                                defineGetter(navProto, 'appVersion', String(workerPayload.userAgent || nav.userAgent || '').replace(/^Mozilla\//, ''), 'get appVersion');
                                defineGetter(navProto, 'platform', targetPlatform || nav.platform, 'get platform');
                            }
                            if (hasWorkerLanguageOverride) {
                                defineGetter(navProto, 'language', targetLang, 'get language');
                                defineGetter(navProto, 'languages', targetLangs, 'get languages');
                            }

                            if (enableWorkerUaSpoof) {
                                const targetMeta = workerPayload.userAgentMetadata || {};
                                const uaDataSnapshot = {
                                    brands: Array.isArray(targetMeta.brands) ? targetMeta.brands : [],
                                    mobile: !!targetMeta.mobile,
                                    platform: targetMeta.platform || (String(targetPlatform).includes('Mac') ? 'macOS' : (String(targetPlatform).includes('Win') ? 'Windows' : 'Linux'))
                                };
                                const highEntropyValues = {
                                    architecture: targetMeta.architecture || 'x86',
                                    bitness: targetMeta.bitness || '64',
                                    model: targetMeta.model || '',
                                    platformVersion: targetMeta.platformVersion || '10.0.0',
                                    uaFullVersion: targetMeta.uaFullVersion || '',
                                    wow64: !!targetMeta.wow64,
                                    fullVersionList: Array.isArray(targetMeta.fullVersionList) ? targetMeta.fullVersionList : []
                                };
                                const uaData = {
                                    brands: uaDataSnapshot.brands,
                                    mobile: uaDataSnapshot.mobile,
                                    platform: uaDataSnapshot.platform,
                                    getHighEntropyValues: makeNative(async function getHighEntropyValues(hints) {
                                        const out = { ...uaDataSnapshot };
                                        if (Array.isArray(hints)) {
                                            hints.forEach((hint) => {
                                                if (Object.prototype.hasOwnProperty.call(highEntropyValues, hint)) {
                                                    out[hint] = highEntropyValues[hint];
                                                }
                                            });
                                        }
                                        return out;
                                    }, 'getHighEntropyValues'),
                                    toJSON: makeNative(function toJSON() {
                                        return { ...uaDataSnapshot };
                                    }, 'toJSON')
                                };
                                defineGetter(navProto, 'userAgentData', uaData, 'get userAgentData');
                            }

                            if (hasWorkerLanguageOverride) {
                                ['DateTimeFormat', 'NumberFormat', 'Collator', 'DisplayNames', 'ListFormat', 'PluralRules', 'RelativeTimeFormat', 'Segmenter']
                                    .forEach((ctorName) => {
                                        try {
                                            const OriginalCtor = Intl[ctorName];
                                            if (typeof OriginalCtor !== 'function') return;
                                            const HookedCtor = function(locales, options) {
                                                return new OriginalCtor(locales || targetLang, options);
                                            };
                                            HookedCtor.prototype = OriginalCtor.prototype;
                                            if (typeof OriginalCtor.supportedLocalesOf === 'function') {
                                                HookedCtor.supportedLocalesOf = OriginalCtor.supportedLocalesOf.bind(OriginalCtor);
                                            }
                                            Intl[ctorName] = makeNative(HookedCtor, ctorName);
                                        } catch (e) { }
                                    });
                            }

                            try {
                                const audioProto = self.AudioBuffer && self.AudioBuffer.prototype;
                                if (audioProto && audioProto.getChannelData && !hasWorkerPatchMarker(audioProto, '__geekezAudioPatched__')) {
                                    const originalGetChannelData = audioProto.getChannelData;
                                    const originalCopyFromChannel = audioProto.copyFromChannel;
                                    const noisedAudioChannels = new WeakMap();
                                    const getAudioNoise = () => Number(workerPayload.audioNoise) || 0.0000001;
                                    const ensureAudioChannelNoised = (buffer, channel) => {
                                        const channelKey = String(channel || 0);
                                        let appliedChannels = noisedAudioChannels.get(buffer);
                                        if (!appliedChannels) {
                                            appliedChannels = new Set();
                                            noisedAudioChannels.set(buffer, appliedChannels);
                                        }
                                        if (appliedChannels.has(channelKey)) return;
                                        const samples = originalGetChannelData.call(buffer, channel);
                                        const noise = getAudioNoise();
                                        for (let i = 0; i < 100 && i < samples.length; i++) {
                                            samples[i] = samples[i] + noise;
                                        }
                                        appliedChannels.add(channelKey);
                                    };
                                    defineWorkerFunction(audioProto, 'getChannelData', makeNative(function getChannelData(channel) {
                                        ensureAudioChannelNoised(this, channel);
                                        return originalGetChannelData.apply(this, arguments);
                                    }, 'getChannelData'));
                                    if (originalCopyFromChannel) {
                                        defineWorkerFunction(audioProto, 'copyFromChannel', makeNative(function copyFromChannel(destination, channelNumber, startInChannel) {
                                            ensureAudioChannelNoised(this, channelNumber);
                                            return originalCopyFromChannel.apply(this, arguments);
                                        }, 'copyFromChannel'));
                                    }
                                    markWorkerPatch(audioProto, '__geekezAudioPatched__', () => isWorkerFunctionHook(audioProto, 'getChannelData')
                                        && (!originalCopyFromChannel || isWorkerFunctionHook(audioProto, 'copyFromChannel')));
                                }
                            } catch (e) { }

                            const workerCanvasSeed = Number(workerPayload.noiseSeed) || 0;
                            const workerCanvasNoise = workerPayload.canvasNoise || {};
                            const clampColor = (value) => Math.max(0, Math.min(255, value));
                            const channelNoise = (key) => Number(workerCanvasNoise[key]) || 0;
                            const mixWorkerCanvasNoiseIndex = (index) => {
                                const value = (Math.imul((Number(index) || 0) ^ workerCanvasSeed, 2654435761) ^ Math.imul(workerCanvasSeed, 1597334677)) >>> 0;
                                return value ^ (value >>> 16);
                            };
                            const shouldTouchPixel = (index) => workerCanvasSeed && (mixWorkerCanvasNoiseIndex(index) % 53 === 0);
                            const applyNoiseToPixels = (data, startOffset, maxLength, noiseIndexOffset) => {
                                if (!data || !workerCanvasSeed) return;
                                if (maxLength !== undefined && Number(maxLength) <= 0) return;
                                const start = Math.max(0, Number(startOffset) || 0);
                                const length = maxLength === undefined ? data.length : Math.max(0, Number(maxLength) || 0);
                                const limit = Math.min(data.length, start + length);
                                const offset = Math.max(0, Number(noiseIndexOffset) || 0);
                                for (let i = start; i < limit; i++) {
                                    const relativeIndex = i - start + offset;
                                    const channel = relativeIndex % 4;
                                    if (!shouldTouchPixel(relativeIndex - channel)) continue;
                                    if (channel === 0) data[i] = clampColor(data[i] + channelNoise('r'));
                                    if (channel === 1) data[i] = clampColor(data[i] + channelNoise('g'));
                                    if (channel === 2) data[i] = clampColor(data[i] + channelNoise('b'));
                                    if (channel === 3) data[i] = clampColor(data[i] + channelNoise('a'));
                                }
                            };
                            const workerOriginalGetImageDataByProto = new WeakMap();
                            const readWorkerCanvasImageData = (ctx, x, y, width, height) => {
                                const proto = ctx && Object.getPrototypeOf(ctx);
                                const originalGetImageData = proto ? workerOriginalGetImageDataByProto.get(proto) : null;
                                return (originalGetImageData || ctx.getImageData).call(ctx, x, y, width, height);
                            };
                            const hookWorkerCanvasGetImageData = (ctxProto) => {
                                if (!ctxProto || !ctxProto.getImageData) return;
                                if (!workerOriginalGetImageDataByProto.has(ctxProto)) {
                                    workerOriginalGetImageDataByProto.set(ctxProto, ctxProto.getImageData);
                                }
                                if (hasWorkerPatchMarker(ctxProto, '__geekezCanvasPatched__')) return;
                                const originalGetImageData = workerOriginalGetImageDataByProto.get(ctxProto);
                                defineWorkerFunction(ctxProto, 'getImageData', makeNative(function getImageData() {
                                    const imageData = originalGetImageData.apply(this, arguments);
                                    applyNoiseToPixels(imageData.data, 0, imageData.data.length);
                                    return imageData;
                                }, 'getImageData'));
                                markWorkerPatch(ctxProto, '__geekezCanvasPatched__', () => isWorkerFunctionHook(ctxProto, 'getImageData'));
                            };
                            try {
                                hookWorkerCanvasGetImageData(self.CanvasRenderingContext2D && self.CanvasRenderingContext2D.prototype);
                                hookWorkerCanvasGetImageData(self.OffscreenCanvasRenderingContext2D && self.OffscreenCanvasRenderingContext2D.prototype);
                            } catch (e) { }

                            const applyNoiseToOffscreenCanvas = (canvas) => {
                                if (!canvas || !workerCanvasSeed || !canvas.width || !canvas.height) return null;
                                try {
                                    const originalCanvas = canvas;
                                    let targetCanvas = canvas;
                                    let ctx = targetCanvas.getContext && targetCanvas.getContext('2d');
                                    if (!ctx || !ctx.getImageData || !ctx.putImageData) {
                                        if (!self.OffscreenCanvas) return null;
                                        targetCanvas = new self.OffscreenCanvas(canvas.width, canvas.height);
                                        ctx = targetCanvas.getContext && targetCanvas.getContext('2d');
                                        if (!ctx || !ctx.drawImage || !ctx.getImageData || !ctx.putImageData) return null;
                                        ctx.drawImage(canvas, 0, 0);
                                    }
                                    const width = Math.max(1, Math.min(targetCanvas.width, 4096));
                                    const height = Math.max(1, Math.min(targetCanvas.height, 4096));
                                    const imageData = readWorkerCanvasImageData(ctx, 0, 0, width, height);
                                    const shouldRestore = targetCanvas === originalCanvas;
                                    const original = shouldRestore
                                        ? new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)
                                        : null;
                                    applyNoiseToPixels(imageData.data, 0, imageData.data.length);
                                    ctx.putImageData(imageData, 0, 0);
                                    return {
                                        canvas: targetCanvas,
                                        restore: shouldRestore
                                            ? function restoreCanvasNoise() {
                                                try { ctx.putImageData(original, 0, 0); } catch (e) { }
                                            }
                                            : null
                                    };
                                } catch (e) {
                                    return null;
                                }
                            };
                            try {
                                const offscreenProto = self.OffscreenCanvas && self.OffscreenCanvas.prototype;
                                if (offscreenProto && offscreenProto.convertToBlob && !hasWorkerPatchMarker(offscreenProto, '__geekezCanvasSerializePatched__')) {
                                    const originalConvertToBlob = offscreenProto.convertToBlob;
                                    defineWorkerFunction(offscreenProto, 'convertToBlob', makeNative(function convertToBlob() {
                                        const noiseTarget = applyNoiseToOffscreenCanvas(this);
                                        try {
                                            const result = originalConvertToBlob.apply((noiseTarget && noiseTarget.canvas) || this, arguments);
                                            if (result && typeof result.finally === 'function') {
                                                return result.finally(() => { if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore(); });
                                            }
                                            if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                                            return result;
                                        } catch (e) {
                                            if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                                            throw e;
                                        }
                                    }, 'convertToBlob'));
                                    markWorkerPatch(offscreenProto, '__geekezCanvasSerializePatched__', () => isWorkerFunctionHook(offscreenProto, 'convertToBlob'));
                                }
                            } catch (e) { }

                            const workerWebgl = workerPayload.webgl || {};
                            const workerReadPixelsKey = '__geekezReadPixelsPatched__';
                            const workerNoisyPackBuffers = new WeakMap();
                            const workerBufferOwners = new WeakMap();
                            const workerBufferSizes = new WeakMap();
                            const workerPendingReadPixelsErrors = new WeakMap();
                            const workerArrayBufferIsView = ArrayBuffer.isView;
                            const workerTypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
                            const getWorkerDescriptorGetter = (target, key) => {
                                const descriptor = Object.getOwnPropertyDescriptor(target, key);
                                return descriptor && descriptor.get;
                            };
                            const workerTypedArrayTagGetter = getWorkerDescriptorGetter(workerTypedArrayPrototype, Symbol.toStringTag);
                            const workerTypedArrayBufferGetter = getWorkerDescriptorGetter(workerTypedArrayPrototype, 'buffer');
                            const workerTypedArrayByteOffsetGetter = getWorkerDescriptorGetter(workerTypedArrayPrototype, 'byteOffset');
                            const workerTypedArrayByteLengthGetter = getWorkerDescriptorGetter(workerTypedArrayPrototype, 'byteLength');
                            const workerDataViewBufferGetter = getWorkerDescriptorGetter(DataView.prototype, 'buffer');
                            const workerDataViewByteOffsetGetter = getWorkerDescriptorGetter(DataView.prototype, 'byteOffset');
                            const workerDataViewByteLengthGetter = getWorkerDescriptorGetter(DataView.prototype, 'byteLength');
                            const workerArrayBufferByteLengthGetter = getWorkerDescriptorGetter(ArrayBuffer.prototype, 'byteLength');
                            const workerSharedArrayBufferByteLengthGetter = typeof SharedArrayBuffer !== 'undefined'
                                ? getWorkerDescriptorGetter(SharedArrayBuffer.prototype, 'byteLength')
                                : null;
                            const isWorkerOwnedBuffer = (gl, buffer) => !!buffer && (!workerBufferOwners.has(buffer) || workerBufferOwners.get(buffer) === gl);
                            const getWorkerTypedArrayElementSize = (view) => {
                                try {
                                    switch (workerTypedArrayTagGetter.call(view)) {
                                        case 'Int8Array':
                                        case 'Uint8Array':
                                        case 'Uint8ClampedArray':
                                            return 1;
                                        case 'Int16Array':
                                        case 'Uint16Array':
                                        case 'Float16Array':
                                            return 2;
                                        case 'Int32Array':
                                        case 'Uint32Array':
                                        case 'Float32Array':
                                            return 4;
                                        case 'BigInt64Array':
                                        case 'BigUint64Array':
                                        case 'Float64Array':
                                            return 8;
                                        default:
                                            return 1;
                                    }
                                } catch (e) {
                                    return 1;
                                }
                            };
                            const getWorkerViewByteMetadata = (view) => {
                                if (!view || !workerArrayBufferIsView(view)) return null;
                                try {
                                    const buffer = workerTypedArrayBufferGetter.call(view);
                                    const byteOffset = workerTypedArrayByteOffsetGetter.call(view);
                                    const byteLength = workerTypedArrayByteLengthGetter.call(view);
                                    if (buffer && Number.isInteger(byteOffset) && Number.isInteger(byteLength) && byteOffset >= 0 && byteLength >= 0) {
                                        return { buffer, byteOffset, byteLength, elementSize: getWorkerTypedArrayElementSize(view) };
                                    }
                                } catch (e) { }
                                try {
                                    const buffer = workerDataViewBufferGetter.call(view);
                                    const byteOffset = workerDataViewByteOffsetGetter.call(view);
                                    const byteLength = workerDataViewByteLengthGetter.call(view);
                                    if (buffer && Number.isInteger(byteOffset) && Number.isInteger(byteLength) && byteOffset >= 0 && byteLength >= 0) {
                                        return { buffer, byteOffset, byteLength, elementSize: 1 };
                                    }
                                } catch (e) { }
                                return null;
                            };
                            const getWorkerViewBytes = (view) => {
                                const metadata = getWorkerViewByteMetadata(view);
                                if (!metadata) return null;
                                return new Uint8Array(metadata.buffer, metadata.byteOffset, metadata.byteLength);
                            };
                            const getWorkerArrayBufferByteLength = (value) => {
                                if (!value || typeof value !== 'object') return null;
                                try {
                                    if (typeof workerArrayBufferByteLengthGetter === 'function') {
                                        const byteLength = workerArrayBufferByteLengthGetter.call(value);
                                        if (Number.isFinite(byteLength) && byteLength >= 0) return byteLength;
                                    }
                                } catch (e) { }
                                try {
                                    if (typeof workerSharedArrayBufferByteLengthGetter === 'function') {
                                        const byteLength = workerSharedArrayBufferByteLengthGetter.call(value);
                                        if (Number.isFinite(byteLength) && byteLength >= 0) return byteLength;
                                    }
                                } catch (e) { }
                                return null;
                            };
                            const getWorkerBufferDestinationBytes = (source) => {
                                const viewBytes = getWorkerViewBytes(source);
                                if (viewBytes) return viewBytes;
                                const byteLength = getWorkerArrayBufferByteLength(source);
                                if (byteLength === null) return null;
                                return new Uint8Array(source, 0, byteLength);
                            };
                            const getWorkerViewElementSize = (view) => {
                                const metadata = getWorkerViewByteMetadata(view);
                                return metadata ? metadata.elementSize : 1;
                            };
                            const applyWorkerViewNoise = (view, startOffset, maxLength, noiseIndexOffset) => {
                                const bytes = getWorkerBufferDestinationBytes(view);
                                if (bytes) applyNoiseToPixels(bytes, startOffset, maxLength, noiseIndexOffset);
                            };
                            const getWorkerVideoFrameCopySize = (frame, options) => {
                                const rect = options && options.rect ? options.rect : (frame && frame.visibleRect ? frame.visibleRect : null);
                                const width = Number(rect && rect.width ? rect.width : (frame && (frame.displayWidth || frame.codedWidth)));
                                const height = Number(rect && rect.height ? rect.height : (frame && (frame.displayHeight || frame.codedHeight)));
                                if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
                                return { width: Math.ceil(width), height: Math.ceil(height) };
                            };
                            const getWorkerVideoFramePlaneShapes = (format, width, height) => {
                                const value = String(format || '').toUpperCase();
                                const halfWidth = Math.ceil(width / 2);
                                const halfHeight = Math.ceil(height / 2);
                                if (['RGBA', 'RGBX', 'BGRA', 'BGRX'].includes(value)) return [{ rows: height, rowBytes: width * 4 }];
                                if (value === 'I420') return [
                                    { rows: height, rowBytes: width },
                                    { rows: halfHeight, rowBytes: halfWidth },
                                    { rows: halfHeight, rowBytes: halfWidth }
                                ];
                                if (value === 'I420A') return [
                                    { rows: height, rowBytes: width },
                                    { rows: halfHeight, rowBytes: halfWidth },
                                    { rows: halfHeight, rowBytes: halfWidth },
                                    { rows: height, rowBytes: width }
                                ];
                                if (value === 'I422') return [
                                    { rows: height, rowBytes: width },
                                    { rows: height, rowBytes: halfWidth },
                                    { rows: height, rowBytes: halfWidth }
                                ];
                                if (value === 'I444') return [
                                    { rows: height, rowBytes: width },
                                    { rows: height, rowBytes: width },
                                    { rows: height, rowBytes: width }
                                ];
                                if (value === 'NV12') return [
                                    { rows: height, rowBytes: width },
                                    { rows: halfHeight, rowBytes: halfWidth * 2 }
                                ];
                                return null;
                            };
                            const getWorkerVideoFramePlaneLayouts = (frame, options, resolvedLayouts) => {
                                const size = getWorkerVideoFrameCopySize(frame, options);
                                if (!size) return null;
                                const format = (options && options.format) || (frame && frame.format);
                                const shapes = getWorkerVideoFramePlaneShapes(format, size.width, size.height);
                                const layouts = Array.isArray(resolvedLayouts) ? resolvedLayouts : (options && Array.isArray(options.layout) ? options.layout : null);
                                if (!shapes || !layouts || layouts.length < shapes.length) return null;
                                return shapes.map((shape, index) => {
                                    const layout = layouts[index] || {};
                                    const offset = Number(layout.offset);
                                    const stride = Number(layout.stride);
                                    if (!Number.isInteger(offset) || !Number.isInteger(stride) || offset < 0 || stride < shape.rowBytes) return null;
                                    return { offset, stride, rows: shape.rows, rowBytes: shape.rowBytes };
                                });
                            };
                            const applyWorkerVideoFrameCopyNoise = (destination, frame, options, resolvedLayouts) => {
                                const bytes = getWorkerBufferDestinationBytes(destination);
                                const layouts = bytes ? getWorkerVideoFramePlaneLayouts(frame, options, resolvedLayouts) : null;
                                if (!bytes || !layouts || layouts.some((layout) => !layout)) return;
                                let logicalNoiseOffset = 0;
                                for (const layout of layouts) {
                                    for (let row = 0; row < layout.rows; row++) {
                                        const rowOffset = layout.offset + row * layout.stride;
                                        if (rowOffset < 0 || rowOffset + layout.rowBytes > bytes.length) return;
                                        applyNoiseToPixels(bytes, rowOffset, layout.rowBytes, logicalNoiseOffset);
                                        logicalNoiseOffset += layout.rowBytes;
                                    }
                                }
                            };
                            try {
                                const videoFrameProto = self.VideoFrame && self.VideoFrame.prototype;
                                if (videoFrameProto && videoFrameProto.copyTo && !hasWorkerPatchMarker(videoFrameProto, '__geekezVideoFramePatched__')) {
                                    const originalCopyTo = videoFrameProto.copyTo;
                                    defineWorkerFunction(videoFrameProto, 'copyTo', makeNative(function copyTo(destination, options) {
                                        const frame = this;
                                        const result = originalCopyTo.apply(this, arguments);
                                        if (result && typeof result.then === 'function') {
                                            return result.then((value) => {
                                                try { applyWorkerVideoFrameCopyNoise(destination, frame, options, value); } catch (e) { }
                                                return value;
                                            });
                                        }
                                        try { applyWorkerVideoFrameCopyNoise(destination, frame, options); } catch (e) { }
                                        return result;
                                    }, 'copyTo'));
                                    markWorkerPatch(videoFrameProto, '__geekezVideoFramePatched__', () => isWorkerFunctionHook(videoFrameProto, 'copyTo'));
                                }
                            } catch (e) { }
                            try {
                                const videoEncoderProto = self.VideoEncoder && self.VideoEncoder.prototype;
                                const noisedWorkerVideoFrames = new WeakSet();
                                const makeWorkerVideoEncoderIsolationError = () => typeof DOMException === 'function'
                                    ? new DOMException('VideoEncoder frame isolation failed', 'OperationError')
                                    : new Error('VideoEncoder frame isolation failed');
                                const createNoisedWorkerVideoFrame = (frame) => {
                                    if (!frame || noisedWorkerVideoFrames.has(frame) || typeof self.VideoFrame !== 'function') return frame;
                                    const visibleRect = frame && frame.visibleRect;
                                    const width = Number(frame.displayWidth || frame.codedWidth || (visibleRect && visibleRect.width) || 0);
                                    const height = Number(frame.displayHeight || frame.codedHeight || (visibleRect && visibleRect.height) || 0);
                                    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !self.OffscreenCanvas) return null;
                                    const canvas = new self.OffscreenCanvas(width, height);
                                    const ctx = canvas.getContext && canvas.getContext('2d');
                                    if (!ctx || !ctx.drawImage) return null;
                                    ctx.drawImage(frame, 0, 0, width, height);
                                    const noiseTarget = applyNoiseToOffscreenCanvas(canvas);
                                    try {
                                        const options = {};
                                        const timestamp = Number(frame.timestamp);
                                        const duration = Number(frame.duration);
                                        if (Number.isFinite(timestamp)) options.timestamp = timestamp;
                                        if (Number.isFinite(duration)) options.duration = duration;
                                        const replacement = new self.VideoFrame((noiseTarget && noiseTarget.canvas) || canvas, options);
                                        noisedWorkerVideoFrames.add(replacement);
                                        return replacement;
                                    } finally {
                                        if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                                    }
                                };
                                if (videoEncoderProto && videoEncoderProto.encode && !hasWorkerPatchMarker(videoEncoderProto, '__geekezVideoEncoderPatched__')) {
                                    const originalEncode = videoEncoderProto.encode;
                                    defineWorkerFunction(videoEncoderProto, 'encode', makeNative(function encode(frame, options) {
                                        const replacement = createNoisedWorkerVideoFrame(frame);
                                        if (!replacement) throw makeWorkerVideoEncoderIsolationError();
                                        try {
                                            return originalEncode.call(this, replacement, options);
                                        } finally {
                                            if (replacement !== frame && replacement && typeof replacement.close === 'function') {
                                                try { replacement.close(); } catch (e) { }
                                            }
                                        }
                                    }, 'encode'));
                                    markWorkerPatch(videoEncoderProto, '__geekezVideoEncoderPatched__', () => isWorkerFunctionHook(videoEncoderProto, 'encode'));
                                }
                            } catch (e) { }
                            const isValidWorkerBufferUsageEnum = (gl, usage) => {
                                const value = Number(usage);
                                if (!gl || !Number.isFinite(value)) return false;
                                return [
                                    gl.STREAM_DRAW,
                                    gl.STATIC_DRAW,
                                    gl.DYNAMIC_DRAW,
                                    gl.STREAM_READ,
                                    gl.STREAM_COPY,
                                    gl.STATIC_READ,
                                    gl.STATIC_COPY,
                                    gl.DYNAMIC_READ,
                                    gl.DYNAMIC_COPY
                                ].filter((item) => typeof item === 'number').includes(value);
                            };
                            const getWorkerBufferSourceByteLength = (source, srcOffset, length) => {
                                const bufferByteLength = getWorkerArrayBufferByteLength(source);
                                const isArrayBuffer = bufferByteLength !== null;
                                const viewMetadata = isArrayBuffer ? null : getWorkerViewByteMetadata(source);
                                if (!isArrayBuffer && !viewMetadata) return null;
                                const elementSize = isArrayBuffer ? 1 : viewMetadata.elementSize;
                                const sourceLength = isArrayBuffer ? bufferByteLength : viewMetadata.byteLength;
                                const offsetValue = srcOffset === undefined ? 0 : Number(srcOffset);
                                if (!Number.isFinite(offsetValue) || offsetValue < 0) return null;
                                const offset = offsetValue * elementSize;
                                if (offset > sourceLength) return null;
                                const available = sourceLength - offset;
                                if (length === undefined || Number(length) === 0) return available;
                                const lengthValue = Number(length);
                                if (!Number.isFinite(lengthValue) || lengthValue < 0) return null;
                                const byteLength = lengthValue * elementSize;
                                return byteLength <= available ? byteLength : null;
                            };
                            const getWorkerBufferDataByteLength = (sizeOrData, srcOffset, length) => {
                                if (typeof sizeOrData === 'number') {
                                    const size = Number(sizeOrData);
                                    return Number.isFinite(size) && size >= 0 ? size : null;
                                }
                                if (sizeOrData === null) return 0;
                                return getWorkerBufferSourceByteLength(sizeOrData, srcOffset, length);
                            };
                            const getWorkerBufferSubDataByteLength = (dstBuffer, dstOffset, length) => getWorkerBufferSourceByteLength(dstBuffer, dstOffset, length);
                            const canWriteWorkerReadPixelsResult = (bytes, dstOffset, byteLength) => Number.isInteger(dstOffset)
                                && Number.isInteger(byteLength)
                                && dstOffset >= 0
                                && byteLength > 0
                                && dstOffset + byteLength <= bytes.length;
                            const getWorkerTypedArrayView = (tag, buffer, byteOffset, length) => {
                                try {
                                    if (tag === 'Int16Array') return new Int16Array(buffer, byteOffset, length);
                                    if (tag === 'Uint16Array') return new Uint16Array(buffer, byteOffset, length);
                                    if (tag === 'Int32Array') return new Int32Array(buffer, byteOffset, length);
                                    if (tag === 'Uint32Array') return new Uint32Array(buffer, byteOffset, length);
                                    if (tag === 'Float16Array' && typeof Float16Array === 'function') return new Float16Array(buffer, byteOffset, length);
                                    if (tag === 'Float32Array') return new Float32Array(buffer, byteOffset, length);
                                    if (tag === 'Float64Array') return new Float64Array(buffer, byteOffset, length);
                                } catch (e) { }
                                return null;
                            };
                            const clampWorkerTypedNoiseValue = (tag, value) => {
                                if (tag === 'Int16Array') return Math.max(-32768, Math.min(32767, Math.round(value)));
                                if (tag === 'Uint16Array') return Math.max(0, Math.min(65535, Math.round(value)));
                                if (tag === 'Int32Array') return Math.max(-2147483648, Math.min(2147483647, Math.round(value)));
                                if (tag === 'Uint32Array') return Math.max(0, Math.min(4294967295, Math.round(value)));
                                return value;
                            };
                            const getWorkerTypedChannelNoise = (channel, tag) => {
                                const key = ['r', 'g', 'b', 'a'][channel] || 'r';
                                const noise = channelNoise(key);
                                return tag === 'Float16Array' || tag === 'Float32Array' || tag === 'Float64Array'
                                    ? noise / 255
                                    : noise;
                            };
                            const applyWorkerTypedReadPixelsNoise = (view, startOffset, byteLength, noiseIndexOffset) => {
                                const metadata = getWorkerViewByteMetadata(view);
                                if (!metadata || metadata.elementSize <= 1) return false;
                                const tag = typeof workerTypedArrayTagGetter === 'function' ? workerTypedArrayTagGetter.call(view) : '';
                                const start = Math.max(0, Number(startOffset) || 0);
                                const length = Math.max(0, Number(byteLength) || 0);
                                if (!length || start % metadata.elementSize !== 0) return false;
                                const elementCount = Math.floor(length / metadata.elementSize);
                                if (!elementCount) return false;
                                const typed = getWorkerTypedArrayView(tag, metadata.buffer, metadata.byteOffset + start, elementCount);
                                if (!typed) return false;
                                const indexOffset = Math.floor((Number(noiseIndexOffset) || 0) / metadata.elementSize);
                                for (let i = 0; i < typed.length; i++) {
                                    const componentIndex = indexOffset + i;
                                    const channel = componentIndex % 4;
                                    if (!shouldTouchPixel((componentIndex - channel) * 4)) continue;
                                    typed[i] = clampWorkerTypedNoiseValue(tag, typed[i] + getWorkerTypedChannelNoise(channel, tag));
                                }
                                return true;
                            };
                            const applyWorkerBufferDestinationNoise = (destination, bytes, startOffset, byteLength, noiseIndexOffset) => {
                                if (applyWorkerTypedReadPixelsNoise(destination, startOffset, byteLength, noiseIndexOffset)) return;
                                applyNoiseToPixels(bytes, startOffset, byteLength, noiseIndexOffset);
                            };
                            const isWorkerUint8ArrayView = (view) => {
                                try {
                                    return !!view && typeof workerTypedArrayTagGetter === 'function' && workerTypedArrayTagGetter.call(view) === 'Uint8Array';
                                } catch (e) {
                                    return false;
                                }
                            };
                            const canNoiseWorkerReadPixelsType = (gl, type) => Number.isFinite(Number(type));
                            const canReadWorkerPixelPackBuffer = (gl) => !!gl && typeof gl.PIXEL_PACK_BUFFER === 'number' && typeof gl.PIXEL_PACK_BUFFER_BINDING === 'number';
                            const canWriteWorkerReadPixelsArray = (gl, pixels, type) => !!getWorkerViewByteMetadata(pixels)
                                && canNoiseWorkerReadPixelsType(gl, type)
                                && (!canReadWorkerPixelPackBuffer(gl) || !getWorkerBoundBuffer(gl, gl.PIXEL_PACK_BUFFER));
                            const getWorkerPackParameter = (gl, key, fallback) => {
                                try {
                                    if (!gl || typeof key !== 'number' || typeof gl.getParameter !== 'function') return fallback;
                                    const value = Number(gl.getParameter(key));
                                    return Number.isInteger(value) && value >= 0 ? value : fallback;
                                } catch (e) {
                                    return fallback;
                                }
                            };
                            const canWorkerReadPixelsSucceed = (gl) => {
                                try {
                                    if (!gl || typeof gl.getParameter !== 'function') return false;
                                    if (typeof gl.isContextLost === 'function' && gl.isContextLost()) return false;
                                    if (typeof gl.READ_BUFFER === 'number') {
                                        const readBuffer = gl.getParameter(gl.READ_BUFFER);
                                        const NONE = gl.NONE || 0;
                                        if (readBuffer === NONE) return false;
                                    }
                                    return true;
                                } catch (e) {
                                    return false;
                                }
                            };
                            const queueWorkerGlErrors = (gl, errors) => {
                                const filtered = errors.filter((error) => Number(error) !== (gl.NO_ERROR || 0));
                                if (!filtered.length) return;
                                workerPendingReadPixelsErrors.set(gl, (workerPendingReadPixelsErrors.get(gl) || []).concat(filtered));
                            };
                            const takeWorkerGlErrors = (gl, originalGetError) => {
                                const errors = [];
                                if (typeof originalGetError !== 'function') return errors;
                                for (let i = 0; i < 16; i++) {
                                    const error = originalGetError.call(gl);
                                    errors.push(error);
                                    if (Number(error) === (gl.NO_ERROR || 0)) break;
                                }
                                queueWorkerGlErrors(gl, errors);
                                return errors;
                            };
                            const hasWorkerGlError = (gl, errors) => errors.some((error) => Number(error) !== (gl.NO_ERROR || 0));
                            const hasReadableWorkerFramebuffer = (gl) => {
                                try {
                                    if (!canWorkerReadPixelsSucceed(gl)) return false;
                                    const framebufferBinding = typeof gl.READ_FRAMEBUFFER_BINDING === 'number'
                                        ? gl.READ_FRAMEBUFFER_BINDING
                                        : (gl.FRAMEBUFFER_BINDING || 36006);
                                    const framebuffer = gl.getParameter(framebufferBinding);
                                    if (!framebuffer) return true;
                                    return typeof gl.checkFramebufferStatus === 'function'
                                        && gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER || gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
                                } catch (e) {
                                    return false;
                                }
                            };
                            const getWorkerReadPixelsComponentCount = (gl, format) => {
                                const value = Number(format);
                                if ([gl.ALPHA || 6406, gl.LUMINANCE || 6409, gl.RED || 6403, gl.RED_INTEGER || 36244, gl.DEPTH_COMPONENT || 6402].includes(value)) return 1;
                                if ([gl.LUMINANCE_ALPHA || 6410, gl.RG || 33319, gl.RG_INTEGER || 33320, gl.DEPTH_STENCIL || 34041].includes(value)) return 2;
                                if ([gl.RGB || 6407, gl.RGB_INTEGER || 36248].includes(value)) return 3;
                                if ([gl.RGBA || 6408, gl.RGBA_INTEGER || 36249].includes(value)) return 4;
                                return null;
                            };
                            const getWorkerReadPixelsBytesPerPixel = (gl, format, type) => {
                                const value = Number(type);
                                if ([gl.UNSIGNED_SHORT_5_6_5 || 33635, gl.UNSIGNED_SHORT_4_4_4_4 || 32819, gl.UNSIGNED_SHORT_5_5_5_1 || 32820].includes(value)) return 2;
                                if ([gl.UNSIGNED_INT_2_10_10_10_REV || 33640, gl.UNSIGNED_INT_10F_11F_11F_REV || 35899, gl.UNSIGNED_INT_5_9_9_9_REV || 35902, gl.UNSIGNED_INT_24_8 || 34042].includes(value)) return 4;
                                if ([gl.FLOAT_32_UNSIGNED_INT_24_8_REV || 36269].includes(value)) return 8;
                                const componentCount = getWorkerReadPixelsComponentCount(gl, format);
                                if (!componentCount) return null;
                                if ([gl.BYTE || 5120, gl.UNSIGNED_BYTE || 5121].includes(value)) return componentCount;
                                if ([gl.SHORT || 5122, gl.UNSIGNED_SHORT || 5123, gl.HALF_FLOAT || 5131, 36193].includes(value)) return componentCount * 2;
                                if ([gl.INT || 5124, gl.UNSIGNED_INT || 5125, gl.FLOAT || 5126].includes(value)) return componentCount * 4;
                                return null;
                            };
                            const getWorkerReadPixelsByteLength = (gl, x, y, width, height, format, type) => {
                                const widthValue = Number(width);
                                const heightValue = Number(height);
                                if (!Number.isInteger(widthValue) || !Number.isInteger(heightValue) || widthValue <= 0 || heightValue <= 0) return null;
                                if (!hasReadableWorkerFramebuffer(gl)) return null;
                                const bytesPerPixel = getWorkerReadPixelsBytesPerPixel(gl, format, type);
                                if (!bytesPerPixel) return null;
                                const rowByteLength = widthValue * bytesPerPixel;
                                const packAlignment = getWorkerPackParameter(gl, (gl && gl.PACK_ALIGNMENT) || 3333, 4);
                                if (![1, 2, 4, 8].includes(packAlignment)) return null;
                                const packRowLength = getWorkerPackParameter(gl, gl && gl.PACK_ROW_LENGTH, 0);
                                const packSkipRows = getWorkerPackParameter(gl, gl && gl.PACK_SKIP_ROWS, 0);
                                const packSkipPixels = getWorkerPackParameter(gl, gl && gl.PACK_SKIP_PIXELS, 0);
                                const rowPixels = packRowLength > 0 ? packRowLength : widthValue;
                                if (rowPixels < widthValue) return null;
                                const rowStride = Math.ceil((rowPixels * bytesPerPixel) / packAlignment) * packAlignment;
                                const byteOffset = packSkipRows * rowStride + packSkipPixels * bytesPerPixel;
                                const byteLength = byteOffset + (heightValue - 1) * rowStride + rowByteLength;
                                if (!Number.isSafeInteger(byteLength)) return null;
                                return { byteLength, byteOffset, rowByteLength, rowStride, height: heightValue };
                            };
                            const applyWorkerReadPixelsNoise = (destination, bytes, dstOffset, layout) => {
                                for (let row = 0; row < layout.height; row++) {
                                    const rowOffset = dstOffset + layout.byteOffset + row * layout.rowStride;
                                    applyWorkerBufferDestinationNoise(destination, bytes, rowOffset, layout.rowByteLength, row * layout.rowByteLength);
                                }
                            };
                            const addWorkerReadPixelsNoisyRanges = (buffer, packOffset, layout) => {
                                for (let row = 0; row < layout.height; row++) {
                                    addWorkerNoisyPackBufferRange(
                                        buffer,
                                        packOffset + layout.byteOffset + row * layout.rowStride,
                                        layout.rowByteLength,
                                        row * layout.rowByteLength
                                    );
                                }
                            };
                            const mergeWorkerNoisyRanges = (ranges) => {
                                const sorted = ranges
                                    .filter((range) => range && range.length > 0)
                                    .map((range) => ({
                                        offset: range.offset,
                                        length: range.length,
                                        noiseIndexOffset: Number(range.noiseIndexOffset) || 0
                                    }))
                                    .slice()
                                    .sort((a, b) => a.offset - b.offset);
                                return sorted.reduce((merged, range) => {
                                    const last = merged[merged.length - 1];
                                    if (!last) return [range];
                                    const lastEnd = last.offset + last.length;
                                    const hasSameNoiseBase = last.noiseIndexOffset - last.offset === range.noiseIndexOffset - range.offset;
                                    if (range.offset > lastEnd || !hasSameNoiseBase) return merged.concat([range]);
                                    const end = Math.max(lastEnd, range.offset + range.length);
                                    return merged.slice(0, -1).concat([{ offset: last.offset, length: end - last.offset, noiseIndexOffset: last.noiseIndexOffset }]);
                                }, []);
                            };
                            const clearWorkerNoisyPackBufferRange = (buffer, offset, length) => {
                                const start = Math.max(0, Number(offset) || 0);
                                const size = Math.max(0, Number(length) || 0);
                                if (!buffer || !size) return;
                                const end = start + size;
                                const ranges = workerNoisyPackBuffers.get(buffer) || [];
                                const kept = ranges.flatMap((range) => {
                                    const rangeStart = range.offset;
                                    const rangeEnd = range.offset + range.length;
                                    if (end <= rangeStart || start >= rangeEnd) return [range];
                                    const noiseIndexOffset = Number(range.noiseIndexOffset) || 0;
                                    const before = start > rangeStart
                                        ? [{ offset: rangeStart, length: start - rangeStart, noiseIndexOffset }]
                                        : [];
                                    const after = end < rangeEnd
                                        ? [{ offset: end, length: rangeEnd - end, noiseIndexOffset: noiseIndexOffset + end - rangeStart }]
                                        : [];
                                    return before.concat(after);
                                });
                                const merged = mergeWorkerNoisyRanges(kept);
                                if (merged.length) {
                                    workerNoisyPackBuffers.set(buffer, merged);
                                } else {
                                    workerNoisyPackBuffers.delete(buffer);
                                }
                            };
                            const addWorkerNoisyPackBufferRange = (buffer, offset, length, noiseIndexOffset) => {
                                const start = Math.max(0, Number(offset) || 0);
                                const size = Math.max(0, Number(length) || 0);
                                const noiseStart = Math.max(0, Number(noiseIndexOffset) || 0);
                                if (!buffer || !size) return;
                                clearWorkerNoisyPackBufferRange(buffer, start, size);
                                const ranges = workerNoisyPackBuffers.get(buffer) || [];
                                workerNoisyPackBuffers.set(buffer, mergeWorkerNoisyRanges(ranges.concat([{ offset: start, length: size, noiseIndexOffset: noiseStart }])));
                            };
                            const getWorkerBufferBindingEnum = (gl, target) => {
                                if (typeof gl.PIXEL_PACK_BUFFER === 'number' && target === gl.PIXEL_PACK_BUFFER) {
                                    return typeof gl.PIXEL_PACK_BUFFER_BINDING === 'number' ? gl.PIXEL_PACK_BUFFER_BINDING : null;
                                }
                                if (typeof gl.PIXEL_UNPACK_BUFFER === 'number' && target === gl.PIXEL_UNPACK_BUFFER) {
                                    return typeof gl.PIXEL_UNPACK_BUFFER_BINDING === 'number' ? gl.PIXEL_UNPACK_BUFFER_BINDING : null;
                                }
                                if (target === (gl.ARRAY_BUFFER || 34962)) return gl.ARRAY_BUFFER_BINDING || 34964;
                                if (target === (gl.ELEMENT_ARRAY_BUFFER || 34963)) return gl.ELEMENT_ARRAY_BUFFER_BINDING || 34965;
                                if (target === (gl.COPY_READ_BUFFER || 36662)) return gl.COPY_READ_BUFFER_BINDING || 36662;
                                if (target === (gl.COPY_WRITE_BUFFER || 36663)) return gl.COPY_WRITE_BUFFER_BINDING || 36663;
                                if (target === (gl.TRANSFORM_FEEDBACK_BUFFER || 35982)) return gl.TRANSFORM_FEEDBACK_BUFFER_BINDING || 35983;
                                if (target === (gl.UNIFORM_BUFFER || 35345)) return gl.UNIFORM_BUFFER_BINDING || 35368;
                                return null;
                            };
                            const getWorkerBoundBuffer = (gl, target) => {
                                if (!gl || typeof gl.getParameter !== 'function') return null;
                                const bindingEnum = getWorkerBufferBindingEnum(gl, target);
                                return bindingEnum ? gl.getParameter(bindingEnum) : null;
                            };
                            const isValidWorkerBufferUsage = (buffer, offset, size) => {
                                const start = Number(offset);
                                const length = Number(size);
                                const knownSize = workerBufferSizes.get(buffer);
                                return !!buffer
                                    && Number.isFinite(start)
                                    && Number.isFinite(length)
                                    && start >= 0
                                    && length > 0
                                    && typeof knownSize === 'number'
                                    && start + length <= knownSize;
                            };
                            const canCopyWorkerBufferRange = (gl, sourceBuffer, targetBuffer, readOffset, writeOffset, size) => {
                                const readStart = Number(readOffset);
                                const writeStart = Number(writeOffset);
                                const length = Number(size);
                                if (!isWorkerOwnedBuffer(gl, sourceBuffer) || !isWorkerOwnedBuffer(gl, targetBuffer)) return false;
                                if (!isValidWorkerBufferUsage(sourceBuffer, readStart, length) || !isValidWorkerBufferUsage(targetBuffer, writeStart, length)) return false;
                                return sourceBuffer !== targetBuffer || readStart + length <= writeStart || writeStart + length <= readStart;
                            };
                            const isTrackedWorkerRange = (buffer, offset, size) => {
                                const ranges = buffer ? workerNoisyPackBuffers.get(buffer) : null;
                                if (!ranges || !ranges.length || !isValidWorkerBufferUsage(buffer, offset, size)) return false;
                                const start = Number(offset);
                                const end = start + Number(size);
                                return ranges.some((range) => start < range.offset + range.length && end > range.offset);
                            };
                            const applyWorkerNoisyBufferRanges = (buffer, srcByteOffset, dstBuffer, dstOffset, length) => {
                                const ranges = buffer ? workerNoisyPackBuffers.get(buffer) : null;
                                const bytes = getWorkerViewBytes(dstBuffer);
                                const readLength = getWorkerBufferSubDataByteLength(dstBuffer, dstOffset, length);
                                if (!ranges || !ranges.length || !bytes || readLength === null || !isValidWorkerBufferUsage(buffer, srcByteOffset, readLength)) return;
                                const elementSize = getWorkerViewElementSize(dstBuffer);
                                const dstStart = Number(dstOffset || 0) * elementSize;
                                const srcStart = Number(srcByteOffset);
                                const srcEnd = srcStart + readLength;
                                ranges.forEach((range) => {
                                    const rangeStart = range.offset;
                                    const rangeEnd = range.offset + range.length;
                                    const overlapStart = Math.max(srcStart, rangeStart);
                                    const overlapEnd = Math.min(srcEnd, rangeEnd);
                                    if (overlapEnd <= overlapStart) return;
                                    const targetOffset = dstStart + overlapStart - srcStart;
                                    const noiseIndexOffset = (Number(range.noiseIndexOffset) || 0) + overlapStart - rangeStart;
                                    applyWorkerBufferDestinationNoise(dstBuffer, bytes, targetOffset, overlapEnd - overlapStart, noiseIndexOffset);
                                });
                            };
                            const propagateWorkerNoisyBufferRanges = (sourceBuffer, targetBuffer, readOffset, writeOffset, size) => {
                                const ranges = sourceBuffer ? workerNoisyPackBuffers.get(sourceBuffer) : null;
                                if (!ranges || !ranges.length || !targetBuffer) return;
                                const readStart = Math.max(0, Number(readOffset) || 0);
                                const readEnd = readStart + Math.max(0, Number(size) || 0);
                                const writeStart = Math.max(0, Number(writeOffset) || 0);
                                ranges.forEach((range) => {
                                    const overlapStart = Math.max(readStart, range.offset);
                                    const overlapEnd = Math.min(readEnd, range.offset + range.length);
                                    if (overlapEnd <= overlapStart) return;
                                    const noiseIndexOffset = (Number(range.noiseIndexOffset) || 0) + overlapStart - range.offset;
                                    addWorkerNoisyPackBufferRange(targetBuffer, writeStart + overlapStart - readStart, overlapEnd - overlapStart, noiseIndexOffset);
                                });
                            };
                            const hookWorkerReadPixels = (proto) => {
                                if (!proto || hasWorkerPatchMarker(proto, workerReadPixelsKey) || !proto.readPixels) return;
                                try {
                                    const origReadPixels = proto.readPixels;
                                    const origGetError = proto.getError;
                                    const origGetBufferSubData = proto.getBufferSubData;
                                    const origCopyBufferSubData = proto.copyBufferSubData;
                                    const origBufferData = proto.bufferData;
                                    const origBufferSubData = proto.bufferSubData;
                                    const origDeleteBuffer = proto.deleteBuffer;
                                    const origCreateBuffer = proto.createBuffer;
                                    if (origGetError) {
                                        proto.getError = makeNative(function getError() {
                                            const queued = workerPendingReadPixelsErrors.get(this);
                                            if (queued && queued.length) {
                                                const error = queued[0];
                                                const rest = queued.slice(1);
                                                if (rest.length) workerPendingReadPixelsErrors.set(this, rest);
                                                else workerPendingReadPixelsErrors.delete(this);
                                                return error;
                                            }
                                            return origGetError.apply(this, arguments);
                                        }, 'getError');
                                    }
                                    if (origCreateBuffer) {
                                        proto.createBuffer = makeNative(function createBuffer() {
                                            const buffer = origCreateBuffer.apply(this, arguments);
                                            try { if (buffer) workerBufferOwners.set(buffer, this); } catch (e) { }
                                            return buffer;
                                        }, 'createBuffer');
                                    }
                                    proto.readPixels = makeNative(function readPixels(x, y, width, height, format, type, pixels, offset) {
                                        const layout = getWorkerReadPixelsByteLength(this, x, y, width, height, format, type);
                                        const byteLength = layout ? layout.byteLength : 0;
                                        const bytes = getWorkerViewBytes(pixels);
                                        const offsetValue = offset === undefined ? 0 : Number(offset);
                                        const dstOffset = offsetValue * getWorkerViewElementSize(pixels);
                                        const boundPackBuffer = canReadWorkerPixelPackBuffer(this) ? getWorkerBoundBuffer(this, this.PIXEL_PACK_BUFFER) : null;
                                        const packOffset = Number(pixels);
                                        const canNoiseBytes = layout && bytes
                                            && canWriteWorkerReadPixelsArray(this, pixels, type)
                                            && Number.isInteger(offsetValue)
                                            && canWriteWorkerReadPixelsResult(bytes, dstOffset, byteLength);
                                        const canTrackPackBuffer = layout && !bytes
                                            && canNoiseWorkerReadPixelsType(this, type)
                                            && isWorkerOwnedBuffer(this, boundPackBuffer)
                                            && isValidWorkerBufferUsage(boundPackBuffer, packOffset, byteLength);
                                        takeWorkerGlErrors(this, origGetError);
                                        const result = origReadPixels.apply(this, arguments);
                                        const readPixelsErrors = takeWorkerGlErrors(this, origGetError);
                                        if (hasWorkerGlError(this, readPixelsErrors) || (!canNoiseBytes && !canTrackPackBuffer)) return result;
                                        try {
                                            if (canNoiseBytes) {
                                                applyWorkerReadPixelsNoise(pixels, bytes, dstOffset, layout);
                                            } else {
                                                addWorkerReadPixelsNoisyRanges(boundPackBuffer, packOffset, layout);
                                            }
                                        } catch (e) { }
                                        return result;
                                    }, 'readPixels');
                                    if (origGetBufferSubData) {
                                        proto.getBufferSubData = makeNative(function getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length) {
                                            const result = origGetBufferSubData.apply(this, arguments);
                                            try {
                                                applyWorkerNoisyBufferRanges(getWorkerBoundBuffer(this, target), srcByteOffset, dstBuffer, dstOffset, length);
                                            } catch (e) { }
                                            return result;
                                        }, 'getBufferSubData');
                                    }
                                    if (origCopyBufferSubData) {
                                        proto.copyBufferSubData = makeNative(function copyBufferSubData(readTarget, writeTarget, readOffset, writeOffset, size) {
                                            const sourceBuffer = getWorkerBoundBuffer(this, readTarget);
                                            const targetBuffer = getWorkerBoundBuffer(this, writeTarget);
                                            const result = origCopyBufferSubData.apply(this, arguments);
                                            try {
                                                if (canCopyWorkerBufferRange(this, sourceBuffer, targetBuffer, readOffset, writeOffset, size)) {
                                                    clearWorkerNoisyPackBufferRange(targetBuffer, writeOffset, size);
                                                    if (isTrackedWorkerRange(sourceBuffer, readOffset, size)) {
                                                        propagateWorkerNoisyBufferRanges(sourceBuffer, targetBuffer, readOffset, writeOffset, size);
                                                    }
                                                }
                                            } catch (e) { }
                                            return result;
                                        }, 'copyBufferSubData');
                                    }
                                    if (origBufferData) {
                                        proto.bufferData = makeNative(function bufferData(target, sizeOrData, usage, srcOffset, length) {
                                            const targetBuffer = getWorkerBoundBuffer(this, target);
                                            const result = origBufferData.apply(this, arguments);
                                            try {
                                                const size = getWorkerBufferDataByteLength(sizeOrData, srcOffset, length);
                                                if (isWorkerOwnedBuffer(this, targetBuffer) && isValidWorkerBufferUsageEnum(this, usage) && size !== null) {
                                                    workerNoisyPackBuffers.delete(targetBuffer);
                                                    workerBufferSizes.set(targetBuffer, size);
                                                }
                                            } catch (e) { }
                                            return result;
                                        }, 'bufferData');
                                    }
                                    if (origBufferSubData) {
                                        proto.bufferSubData = makeNative(function bufferSubData(target, dstByteOffset, srcData, srcOffset, length) {
                                            const targetBuffer = getWorkerBoundBuffer(this, target);
                                            const result = origBufferSubData.apply(this, arguments);
                                            try {
                                                const size = getWorkerBufferSourceByteLength(srcData, srcOffset, length);
                                                if (size !== null && isWorkerOwnedBuffer(this, targetBuffer) && isValidWorkerBufferUsage(targetBuffer, dstByteOffset, size)) {
                                                    clearWorkerNoisyPackBufferRange(targetBuffer, dstByteOffset, size);
                                                }
                                            } catch (e) { }
                                            return result;
                                        }, 'bufferSubData');
                                    }
                                    if (origDeleteBuffer) {
                                        proto.deleteBuffer = makeNative(function deleteBuffer(buffer) {
                                            const result = origDeleteBuffer.apply(this, arguments);
                                            try {
                                                if (isWorkerOwnedBuffer(this, buffer)) {
                                                    workerNoisyPackBuffers.delete(buffer);
                                                    workerBufferSizes.delete(buffer);
                                                    workerBufferOwners.delete(buffer);
                                                }
                                            } catch (e) { }
                                            return result;
                                        }, 'deleteBuffer');
                                    }
                                    markWorkerPatch(proto, workerReadPixelsKey, () => isWorkerFunctionHook(proto, 'readPixels')
                                        && (!origGetError || isWorkerFunctionHook(proto, 'getError'))
                                        && (!origCreateBuffer || isWorkerFunctionHook(proto, 'createBuffer'))
                                        && (!origGetBufferSubData || isWorkerFunctionHook(proto, 'getBufferSubData'))
                                        && (!origCopyBufferSubData || isWorkerFunctionHook(proto, 'copyBufferSubData'))
                                        && (!origBufferData || isWorkerFunctionHook(proto, 'bufferData'))
                                        && (!origBufferSubData || isWorkerFunctionHook(proto, 'bufferSubData'))
                                        && (!origDeleteBuffer || isWorkerFunctionHook(proto, 'deleteBuffer')));
                                } catch (e) { }
                            };
                            const patchWorkerReadPixelsContext = (context) => {
                                if (!context) return context;
                                try { hookWorkerReadPixels(Object.getPrototypeOf(context)); } catch (e) { }
                                return context;
                            };
                            const hookWorkerReadPixelsFactory = (canvasProto) => {
                                if (!canvasProto || !canvasProto.getContext || hasWorkerPatchMarker(canvasProto, '__geekezReadPixelsFactoryPatched__')) return;
                                try {
                                    const origGetContext = canvasProto.getContext;
                                    canvasProto.getContext = makeNative(function getContext(type) {
                                        const ctx = origGetContext.apply(this, arguments);
                                        const name = String(type || '').toLowerCase();
                                        if (name === 'webgl' || name === 'experimental-webgl' || name === 'webgl2') {
                                            return patchWorkerReadPixelsContext(ctx);
                                        }
                                        return ctx;
                                    }, 'getContext');
                                    markWorkerPatch(canvasProto, '__geekezReadPixelsFactoryPatched__', () => isWorkerFunctionHook(canvasProto, 'getContext'));
                                } catch (e) { }
                            };
                            if (workerCanvasSeed) {
                                hookWorkerReadPixels(self.WebGLRenderingContext && self.WebGLRenderingContext.prototype);
                                hookWorkerReadPixels(self.WebGL2RenderingContext && self.WebGL2RenderingContext.prototype);
                                hookWorkerReadPixelsFactory(self.OffscreenCanvas && self.OffscreenCanvas.prototype);
                            }

                            const enableWorkerWebglSpoof = !!workerPayload.enableWebglSpoof;
                            if (enableWorkerWebglSpoof) {
                                const patchKey = '__geekezWebglPatched__';
                                const debugExt = { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
                                const deriveWorkerCaps = () => {
                                    const renderer = String(workerWebgl.unmaskedRenderer || workerWebgl.renderer || '').toLowerCase();
                                    const vendor = String(workerWebgl.unmaskedVendor || workerWebgl.vendor || '').toLowerCase();
                                    const isApple = renderer.includes('apple') || vendor.includes('apple');
                                    const isNvidia = renderer.includes('nvidia') || vendor.includes('nvidia');
                                    const isAmd = renderer.includes('amd') || renderer.includes('radeon') || vendor.includes('ati');
                                    const isIntel = renderer.includes('intel') || vendor.includes('intel');

                                    let textureSize = 16384;
                                    let renderbufferSize = 16384;
                                    let vertexUniforms = 1024;
                                    let fragmentUniforms = 1024;
                                    let varyingVectors = 30;

                                    if (isApple || isNvidia || isAmd) {
                                        textureSize = 32768;
                                        renderbufferSize = 32768;
                                        vertexUniforms = 4096;
                                        fragmentUniforms = 2048;
                                        varyingVectors = 32;
                                    } else if (isIntel) {
                                        textureSize = 16384;
                                        renderbufferSize = 16384;
                                        vertexUniforms = 2048;
                                        fragmentUniforms = 1024;
                                        varyingVectors = 30;
                                    }

                                    return {
                                        3379: textureSize,
                                        34076: textureSize,
                                        34024: renderbufferSize,
                                        34921: 16,
                                        34930: 16,
                                        35660: 16,
                                        35661: 32,
                                        36347: vertexUniforms,
                                        36348: varyingVectors,
                                        36349: fragmentUniforms,
                                        3386: new Int32Array([textureSize, textureSize]),
                                        33901: new Float32Array([1, 1024]),
                                        33902: new Float32Array([1, 1]),
                                        34852: 8,
                                        36063: 8
                                    };
                                };
                                const workerCaps = deriveWorkerCaps();
                                const cloneWorkerCap = (value) => {
                                    if (value instanceof Int32Array) return new Int32Array(value);
                                    if (value instanceof Float32Array) return new Float32Array(value);
                                    if (Array.isArray(value)) return value.slice();
                                    return value;
                                };
                                const hookProto = (proto) => {
                                    if (!proto || hasWorkerPatchMarker(proto, patchKey)) return;
                                    try {
                                        const origGetParameter = proto.getParameter;
                                        const origGetExtension = proto.getExtension;
                                        const origGetSupportedExtensions = proto.getSupportedExtensions;
                                        proto.getParameter = makeNative(function getParameter(param) {
                                            if (param === 37445) return workerWebgl.unmaskedVendor || workerWebgl.vendor || 'Google Inc.';
                                            if (param === 37446) return workerWebgl.unmaskedRenderer || workerWebgl.renderer || 'ANGLE (Unknown GPU)';
                                            if (param === 7936) return workerWebgl.vendor || 'Google Inc.';
                                            if (param === 7937) return workerWebgl.renderer || 'ANGLE (Unknown GPU)';
                                            if (param === 7938) return workerWebgl.version || 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
                                            if (param === 35724) return workerWebgl.shadingLanguageVersion || 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
                                            if (Object.prototype.hasOwnProperty.call(workerCaps, param)) return cloneWorkerCap(workerCaps[param]);
                                            return origGetParameter.apply(this, arguments);
                                        }, 'getParameter');
                                        proto.getExtension = makeNative(function getExtension(name) {
                                            if (name === 'WEBGL_debug_renderer_info') return debugExt;
                                            return origGetExtension.apply(this, arguments);
                                        }, 'getExtension');
                                        if (origGetSupportedExtensions) {
                                            proto.getSupportedExtensions = makeNative(function getSupportedExtensions() {
                                                const list = origGetSupportedExtensions.apply(this, arguments) || [];
                                                if (Array.isArray(list) && !list.includes('WEBGL_debug_renderer_info')) {
                                                    return list.concat(['WEBGL_debug_renderer_info']);
                                                }
                                                return list;
                                            }, 'getSupportedExtensions');
                                        }
                                        markWorkerPatch(proto, patchKey, () => isWorkerFunctionHook(proto, 'getParameter')
                                            && isWorkerFunctionHook(proto, 'getExtension')
                                            && (!origGetSupportedExtensions || isWorkerFunctionHook(proto, 'getSupportedExtensions')));
                                    } catch (e) { }
                                };

                                hookProto(self.WebGLRenderingContext && self.WebGLRenderingContext.prototype);
                                hookProto(self.WebGL2RenderingContext && self.WebGL2RenderingContext.prototype);

                                if (self.OffscreenCanvas && self.OffscreenCanvas.prototype && self.OffscreenCanvas.prototype.getContext) {
                                    try {
                                        const canvasProto = self.OffscreenCanvas.prototype;
                                        if (!hasWorkerPatchMarker(canvasProto, '__geekezWorkerWebglFactoryPatched__')) {
                                            const origGetContext = canvasProto.getContext;
                                            canvasProto.getContext = makeNative(function getContext(type) {
                                                const ctx = origGetContext.apply(this, arguments);
                                                const name = String(type || '').toLowerCase();
                                                if (name === 'webgl' || name === 'experimental-webgl' || name === 'webgl2') {
                                                    try { hookProto(Object.getPrototypeOf(ctx)); } catch (e) { }
                                                }
                                                return ctx;
                                            }, 'getContext');
                                            markWorkerPatch(canvasProto, '__geekezWorkerWebglFactoryPatched__', () => isWorkerFunctionHook(canvasProto, 'getContext'));
                                        }
                                    } catch (e) { }
                                }

                                if (nav.gpu && typeof nav.gpu.requestAdapter === 'function') {
                                    try {
                                        const gpuProto = Object.getPrototypeOf(nav.gpu);
                                        if (!hasWorkerPatchMarker(gpuProto, '__geekezWebgpuPatched__')) {
                                            const rendererText = String(workerWebgl.unmaskedRenderer || workerWebgl.renderer || '');
                                            const vendorText = String(workerWebgl.unmaskedVendor || workerWebgl.vendor || '');
                                            const fakeAdapterInfo = Object.freeze({
                                                vendor: vendorText || 'Unknown',
                                                architecture: vendorText || 'Unknown',
                                                device: rendererText || 'Generic GPU',
                                                description: rendererText || 'Generic GPU Adapter'
                                            });
                                            const origRequestAdapter = nav.gpu.requestAdapter.bind(nav.gpu);
                                            const wrapped = async function requestAdapter(options) {
                                                const adapter = await origRequestAdapter(options);
                                                if (!adapter || typeof adapter !== 'object') return adapter;
                                                return new Proxy(adapter, {
                                                    get(target, prop, receiver) {
                                                        if (prop === 'requestAdapterInfo') {
                                                            return makeNative(async function requestAdapterInfo() {
                                                                return fakeAdapterInfo;
                                                            }, 'requestAdapterInfo');
                                                        }
                                                        if (prop === 'info') return fakeAdapterInfo;
                                                        const value = Reflect.get(target, prop, receiver);
                                                        return typeof value === 'function' ? value.bind(target) : value;
                                                    }
                                                });
                                            };
                                            Object.defineProperty(gpuProto, 'requestAdapter', {
                                                value: makeNative(wrapped, 'requestAdapter'),
                                                configurable: true,
                                                writable: true
                                            });
                                            markWorkerPatch(gpuProto, '__geekezWebgpuPatched__', () => isWorkerFunctionHook(gpuProto, 'requestAdapter'));
                                        }
                                    } catch (e) { }
                                }
                            }
                            const isWorkerPatchApplied = () => {
                                try {
                                    if (enableWorkerUaSpoof) {
                                        if (!hasWorkerGetterHook(navProto, 'userAgent')) return false;
                                        if (!hasWorkerGetterHook(navProto, 'appVersion')) return false;
                                        if (!hasWorkerGetterHook(navProto, 'platform')) return false;
                                        if (navProto && 'userAgentData' in navProto && !hasWorkerGetterHook(navProto, 'userAgentData')) return false;
                                    }
                                    if (hasWorkerLanguageOverride) {
                                        if (!hasWorkerGetterHook(navProto, 'language')) return false;
                                        if (!hasWorkerGetterHook(navProto, 'languages')) return false;
                                    }
                                    const audioProto = self.AudioBuffer && self.AudioBuffer.prototype;
                                    if (audioProto && audioProto.getChannelData && !hasWorkerPatchMarker(audioProto, '__geekezAudioPatched__')) return false;
                                    const canvasProto = self.OffscreenCanvasRenderingContext2D && self.OffscreenCanvasRenderingContext2D.prototype;
                                    if (canvasProto && canvasProto.getImageData && !hasWorkerPatchMarker(canvasProto, '__geekezCanvasPatched__')) return false;
                                    const offscreenProto = self.OffscreenCanvas && self.OffscreenCanvas.prototype;
                                    if (offscreenProto && offscreenProto.convertToBlob && !hasWorkerPatchMarker(offscreenProto, '__geekezCanvasSerializePatched__')) return false;
                                    const webglProto = self.WebGLRenderingContext && self.WebGLRenderingContext.prototype;
                                    if (workerCanvasSeed && webglProto && webglProto.readPixels && !hasWorkerPatchMarker(webglProto, workerReadPixelsKey)) return false;
                                    const webgl2Proto = self.WebGL2RenderingContext && self.WebGL2RenderingContext.prototype;
                                    if (workerCanvasSeed && webgl2Proto && webgl2Proto.readPixels && !hasWorkerPatchMarker(webgl2Proto, workerReadPixelsKey)) return false;
                                    if (workerCanvasSeed && offscreenProto && offscreenProto.getContext && !hasWorkerPatchMarker(offscreenProto, '__geekezReadPixelsFactoryPatched__')) return false;
                                    const videoFrameProto = self.VideoFrame && self.VideoFrame.prototype;
                                    if (videoFrameProto && videoFrameProto.copyTo && !hasWorkerPatchMarker(videoFrameProto, '__geekezVideoFramePatched__')) return false;
                                    const videoEncoderProto = self.VideoEncoder && self.VideoEncoder.prototype;
                                    if (videoEncoderProto && videoEncoderProto.encode && !hasWorkerPatchMarker(videoEncoderProto, '__geekezVideoEncoderPatched__')) return false;
                                    if (enableWorkerWebglSpoof) {
                                        if (webglProto && webglProto.getParameter && !hasWorkerPatchMarker(webglProto, '__geekezWebglPatched__')) return false;
                                        if (webgl2Proto && webgl2Proto.getParameter && !hasWorkerPatchMarker(webgl2Proto, '__geekezWebglPatched__')) return false;
                                        if (offscreenProto && offscreenProto.getContext && !hasWorkerPatchMarker(offscreenProto, '__geekezWorkerWebglFactoryPatched__')) return false;
                                        const gpuProto = nav.gpu && Object.getPrototypeOf(nav.gpu);
                                        if (gpuProto && nav.gpu && typeof nav.gpu.requestAdapter === 'function' && !hasWorkerPatchMarker(gpuProto, '__geekezWebgpuPatched__')) return false;
                                    }
                                    return true;
                                } catch (e) {
                                    return false;
                                }
                            };
                            return isWorkerPatchApplied();
                        } catch (e) {
                            return false;
                        }
                    }

function getWorkerInjectScript(fp) {
    const payload = JSON.stringify(buildWorkerFingerprintPayload(fp));
    return `
    (function() {
        try {
            if (typeof self === 'undefined') return false;
            const __geekezWorkerPatchApplied = (${applyWorkerFingerprintPatch.toString()})(${payload});
            if (__geekezWorkerPatchApplied === true) {
                try {
                    Object.defineProperty(self, '__geekezWorkerFingerprintInjected__', { value: true, configurable: false, writable: false });
                } catch (e) { }
            }
            return __geekezWorkerPatchApplied === true;
        } catch (e) {
            return false;
        }
    })();
    `;
}

function getInjectScript(fp, profileName, watermarkStyle) {
    const normalizedFp = generateFingerprint(fp || {});
    const fpJson = JSON.stringify(normalizedFp);
    const safeProfileName = (profileName || 'Profile').replace(/[<>"'&]/g, '');
    const style = watermarkStyle === 'banner' ? 'banner' : 'enhanced';
    const styleJson = JSON.stringify(style);
    const profileLabelJson = JSON.stringify(safeProfileName);

    return `
    (function() {
        try {
            const fp = ${fpJson};

            const makeNative = (func, name) => {
                const nativeStr = 'function ' + name + '() { [native code] }';
                Object.defineProperty(func, 'toString', {
                    value: function() { return nativeStr; },
                    configurable: true,
                    writable: true
                });
                Object.defineProperty(func.toString, 'toString', {
                    value: function() { return 'function toString() { [native code] }'; },
                    configurable: true,
                    writable: true
                });
                return func;
            };

            const defineValueGetter = (target, key, value, nativeName) => {
                if (!target) return;
                try {
                    const getter = makeNative(function() { return value; }, nativeName || key);
                    Object.defineProperty(target, key, {
                        get: getter,
                        configurable: true
                    });
                } catch (e) { }
            };

            try {
                Object.defineProperty(window, '__geekezFingerprintInjected__', { value: true, configurable: true });
            } catch (e) { }

            // --- 1. Basic automation markers cleanup ---
            try {
                defineValueGetter(Navigator.prototype, 'webdriver', false, 'get webdriver');
                const cdcRegex = /cdc_[a-zA-Z0-9]+/;
                Object.keys(window).forEach((key) => {
                    if (cdcRegex.test(key)) {
                        try { delete window[key]; } catch (e) { }
                    }
                });
                ['$cdc_asdjflasutopfhvcZLmcfl_', '$chrome_asyncScriptInfo', 'callPhantom', 'webdriver'].forEach((k) => {
                    if (window[k]) {
                        try { delete window[k]; } catch (e) { }
                    }
                });
                if (!window.chrome) {
                    Object.defineProperty(window, 'chrome', {
                        value: {
                            app: {
                                isInstalled: false,
                                InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                                RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
                            },
                            runtime: {
                                OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
                                PlatformArch: { ARM: 'arm', ARM64: 'arm64', X86_32: 'x86-32', X86_64: 'x86-64' },
                                PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' }
                            }
                        },
                        configurable: false,
                        enumerable: true,
                        writable: true
                    });
                }
            } catch (e) { }

            // --- 2. Screen and hardware fingerprint ---
            if (fp.screen && fp.screen.width && fp.screen.height) {
                const screenWidth = fp.screen.width;
                const screenHeight = fp.screen.height;
                defineValueGetter(screen, 'width', screenWidth, 'get width');
                defineValueGetter(screen, 'height', screenHeight, 'get height');
                defineValueGetter(screen, 'availWidth', screenWidth, 'get availWidth');
                defineValueGetter(screen, 'availHeight', Math.max(0, screenHeight - 40), 'get availHeight');
                defineValueGetter(window, 'outerWidth', screenWidth, 'get outerWidth');
                defineValueGetter(window, 'outerHeight', screenHeight, 'get outerHeight');
            }

            if (fp.hardwareConcurrency) {
                defineValueGetter(Navigator.prototype, 'hardwareConcurrency', fp.hardwareConcurrency, 'get hardwareConcurrency');
            }

            if (fp.deviceMemory) {
                defineValueGetter(Navigator.prototype, 'deviceMemory', fp.deviceMemory, 'get deviceMemory');
            }

            // --- 3. UA and User-Agent Client Hints spoof ---
            const enableUaSpoof = fp.uaMode !== 'none';
            const targetUa = (enableUaSpoof && fp.userAgent) ? fp.userAgent : navigator.userAgent;
            const targetMeta = fp.userAgentMetadata || {};
            const hasLanguageOverride = typeof fp.language === 'string' && fp.language && fp.language !== 'auto';
            const targetLanguage = hasLanguageOverride ? fp.language : (navigator.language || 'en-US');
            const targetLanguages = hasLanguageOverride
                ? (Array.isArray(fp.languages) && fp.languages.length > 0 ? fp.languages : [targetLanguage])
                : (Array.isArray(navigator.languages) && navigator.languages.length > 0 ? navigator.languages : [targetLanguage]);
            const targetPlatform = fp.platform || navigator.platform;

            if (hasLanguageOverride) {
                defineValueGetter(Navigator.prototype, 'language', targetLanguage, 'get language');
                defineValueGetter(Navigator.prototype, 'languages', targetLanguages, 'get languages');
            }

            if (enableUaSpoof) {
                defineValueGetter(Navigator.prototype, 'userAgent', targetUa, 'get userAgent');
                defineValueGetter(Navigator.prototype, 'appVersion', targetUa.replace(/^Mozilla\\//, ''), 'get appVersion');
                defineValueGetter(Navigator.prototype, 'platform', targetPlatform, 'get platform');
                defineValueGetter(Navigator.prototype, 'vendor', 'Google Inc.', 'get vendor');

                const uaDataSnapshot = {
                    brands: Array.isArray(targetMeta.brands) ? targetMeta.brands : [],
                    mobile: !!targetMeta.mobile,
                    platform: targetMeta.platform || (targetPlatform.includes('Mac') ? 'macOS' : (targetPlatform.includes('Win') ? 'Windows' : 'Linux'))
                };

                const highEntropyValues = {
                    architecture: targetMeta.architecture || 'x86',
                    bitness: targetMeta.bitness || '64',
                    model: targetMeta.model || '',
                    platformVersion: targetMeta.platformVersion || '10.0.0',
                    uaFullVersion: targetMeta.uaFullVersion || fp.browserFullVersion || '',
                    wow64: !!targetMeta.wow64,
                    fullVersionList: Array.isArray(targetMeta.fullVersionList) ? targetMeta.fullVersionList : []
                };

                const uaData = {
                    brands: uaDataSnapshot.brands,
                    mobile: uaDataSnapshot.mobile,
                    platform: uaDataSnapshot.platform,
                    getHighEntropyValues: makeNative(async function getHighEntropyValues(hints) {
                        const res = { ...uaDataSnapshot };
                        if (Array.isArray(hints)) {
                            hints.forEach((hint) => {
                                if (Object.prototype.hasOwnProperty.call(highEntropyValues, hint)) {
                                    res[hint] = highEntropyValues[hint];
                                }
                            });
                        }
                        return res;
                    }, 'getHighEntropyValues'),
                    toJSON: makeNative(function toJSON() {
                        return { ...uaDataSnapshot };
                    }, 'toJSON')
                };

                defineValueGetter(Navigator.prototype, 'userAgentData', uaData, 'get userAgentData');
            }

            // --- 4. Geolocation ---
            if (fp.geolocation && typeof fp.geolocation.latitude === 'number' && typeof fp.geolocation.longitude === 'number') {
                const latitude = fp.geolocation.latitude;
                const longitude = fp.geolocation.longitude;
                const accuracy = fp.geolocation.accuracy || (500 + Math.floor(Math.random() * 1000));

                const fakeGetCurrentPosition = function getCurrentPosition(success) {
                    const position = {
                        coords: {
                            latitude: latitude + (Math.random() - 0.5) * 0.005,
                            longitude: longitude + (Math.random() - 0.5) * 0.005,
                            accuracy,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading: null,
                            speed: null
                        },
                        timestamp: Date.now()
                    };
                    setTimeout(() => {
                        if (typeof success === 'function') success(position);
                    }, 12);
                };

                const fakeWatchPosition = function watchPosition(success) {
                    fakeGetCurrentPosition(success);
                    return Math.floor(Math.random() * 10000) + 1;
                };

                try {
                    Object.defineProperty(Geolocation.prototype, 'getCurrentPosition', {
                        value: makeNative(fakeGetCurrentPosition, 'getCurrentPosition'),
                        configurable: true,
                        writable: true
                    });
                    Object.defineProperty(Geolocation.prototype, 'watchPosition', {
                        value: makeNative(fakeWatchPosition, 'watchPosition'),
                        configurable: true,
                        writable: true
                    });
                } catch (e) { }
            }

            // --- 5. Intl default language alignment ---
            if (hasLanguageOverride) {
                const hookIntlLocaleCtor = (ctorName) => {
                    try {
                        const OriginalCtor = Intl[ctorName];
                        if (typeof OriginalCtor !== 'function') return;
                        const HookedCtor = function(locales, options) {
                            return new OriginalCtor(locales || targetLanguage, options);
                        };
                        HookedCtor.prototype = OriginalCtor.prototype;
                        if (typeof OriginalCtor.supportedLocalesOf === 'function') {
                            HookedCtor.supportedLocalesOf = OriginalCtor.supportedLocalesOf.bind(OriginalCtor);
                        }
                        Intl[ctorName] = makeNative(HookedCtor, ctorName);
                    } catch (e) { }
                };

                [
                    'DateTimeFormat',
                    'NumberFormat',
                    'Collator',
                    'DisplayNames',
                    'ListFormat',
                    'PluralRules',
                    'RelativeTimeFormat',
                    'Segmenter'
                ].forEach(hookIntlLocaleCtor);
            }

            // --- 6. Canvas, WebGL readback and Audio noise ---
            const canvasSeed = Number(fp.noiseSeed) || 0;
            const canvasNoise = fp.canvasNoise || {};
            const clampColor = (value) => Math.max(0, Math.min(255, value));
            const getChannelNoise = (channel) => Number(canvasNoise[channel]) || 0;
            const mixCanvasNoiseIndex = (index) => {
                const value = (Math.imul((Number(index) || 0) ^ canvasSeed, 2654435761) ^ Math.imul(canvasSeed, 1597334677)) >>> 0;
                return value ^ (value >>> 16);
            };
            const shouldTouchPixel = (index) => canvasSeed && (mixCanvasNoiseIndex(index) % 53 === 0);
            const applyCanvasNoiseToData = (data, startOffset, maxLength, noiseIndexOffset) => {
                if (!data || !canvasSeed) return;
                if (maxLength !== undefined && Number(maxLength) <= 0) return;
                const start = Math.max(0, Number(startOffset) || 0);
                const length = maxLength === undefined ? data.length : Math.max(0, Number(maxLength) || 0);
                const limit = Math.min(data.length, start + length);
                const offset = Math.max(0, Number(noiseIndexOffset) || 0);
                for (let i = start; i < limit; i++) {
                    const relativeIndex = i - start + offset;
                    const channel = relativeIndex % 4;
                    if (!shouldTouchPixel(relativeIndex - channel)) continue;
                    if (channel === 0) data[i] = clampColor(data[i] + getChannelNoise('r'));
                    if (channel === 1) data[i] = clampColor(data[i] + getChannelNoise('g'));
                    if (channel === 2) data[i] = clampColor(data[i] + getChannelNoise('b'));
                    if (channel === 3) data[i] = clampColor(data[i] + getChannelNoise('a'));
                }
            };
            const originalGetImageDataByProto = new WeakMap();
            const readCanvasImageData = (ctx, x, y, width, height) => {
                const proto = ctx && Object.getPrototypeOf(ctx);
                const originalGetImageData = proto ? originalGetImageDataByProto.get(proto) : null;
                return (originalGetImageData || ctx.getImageData).call(ctx, x, y, width, height);
            };

            const applyCanvasNoiseToCanvas = (canvas) => {
                if (!canvas || !canvasSeed || !canvas.width || !canvas.height) return null;
                try {
                    const originalCanvas = canvas;
                    let targetCanvas = canvas;
                    let ctx = targetCanvas.getContext && targetCanvas.getContext('2d');
                    if (!ctx || !ctx.getImageData || !ctx.putImageData) {
                        const isOffscreenCanvas = window.OffscreenCanvas && canvas instanceof window.OffscreenCanvas;
                        if (isOffscreenCanvas && window.OffscreenCanvas) {
                            targetCanvas = new window.OffscreenCanvas(canvas.width, canvas.height);
                        } else if (typeof document !== 'undefined' && document.createElement) {
                            targetCanvas = document.createElement('canvas');
                        } else if (window.OffscreenCanvas) {
                            targetCanvas = new window.OffscreenCanvas(canvas.width, canvas.height);
                        } else {
                            return null;
                        }
                        targetCanvas.width = canvas.width;
                        targetCanvas.height = canvas.height;
                        ctx = targetCanvas.getContext && targetCanvas.getContext('2d');
                        if (!ctx || !ctx.drawImage || !ctx.getImageData || !ctx.putImageData) return null;
                        ctx.drawImage(canvas, 0, 0);
                    }
                    const width = Math.max(1, Math.min(targetCanvas.width, 4096));
                    const height = Math.max(1, Math.min(targetCanvas.height, 4096));
                    const imageData = readCanvasImageData(ctx, 0, 0, width, height);
                    const shouldRestore = targetCanvas === originalCanvas;
                    const original = shouldRestore
                        ? new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)
                        : null;
                    applyCanvasNoiseToData(imageData.data, 0, imageData.data.length);
                    ctx.putImageData(imageData, 0, 0);
                    return {
                        canvas: targetCanvas,
                        restore: shouldRestore
                            ? function restoreCanvasNoise() {
                                try { ctx.putImageData(original, 0, 0); } catch (e) { }
                            }
                            : null
                    };
                } catch (e) {
                    return null;
                }
            };

            const hookCanvasGetImageData = (ctxProto) => {
                if (!ctxProto || !ctxProto.getImageData) return;
                if (!originalGetImageDataByProto.has(ctxProto)) {
                    originalGetImageDataByProto.set(ctxProto, ctxProto.getImageData);
                }
                if (ctxProto.__geekezCanvasPatched__) return;
                const originalGetImageData = originalGetImageDataByProto.get(ctxProto);
                const hookedGetImageData = function getImageData(x, y, w, h) {
                    const imageData = originalGetImageData.apply(this, arguments);
                    applyCanvasNoiseToData(imageData.data, 0, imageData.data.length);
                    return imageData;
                };
                ctxProto.getImageData = makeNative(hookedGetImageData, 'getImageData');
                Object.defineProperty(ctxProto, '__geekezCanvasPatched__', { value: true, configurable: true });
            };
            try {
                hookCanvasGetImageData(window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype);
                hookCanvasGetImageData(window.OffscreenCanvasRenderingContext2D && window.OffscreenCanvasRenderingContext2D.prototype);
            } catch (e) { }

            try {
                const canvasProto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
                if (canvasProto && !canvasProto.__geekezCanvasSerializePatched__) {
                    if (canvasProto.toDataURL) {
                        const originalToDataURL = canvasProto.toDataURL;
                        canvasProto.toDataURL = makeNative(function toDataURL() {
                            const noiseTarget = applyCanvasNoiseToCanvas(this);
                            try {
                                return originalToDataURL.apply((noiseTarget && noiseTarget.canvas) || this, arguments);
                            } finally {
                                if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                            }
                        }, 'toDataURL');
                    }

                    if (canvasProto.toBlob) {
                        const originalToBlob = canvasProto.toBlob;
                        canvasProto.toBlob = makeNative(function toBlob(callback) {
                            if (typeof callback !== 'function') {
                                return originalToBlob.apply(this, arguments);
                            }
                            const noiseTarget = applyCanvasNoiseToCanvas(this);
                            const args = Array.prototype.slice.call(arguments);
                            args[0] = function(blob) {
                                if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                                return callback.apply(this, arguments);
                            };
                            try {
                                return originalToBlob.apply((noiseTarget && noiseTarget.canvas) || this, args);
                            } catch (e) {
                                if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                                throw e;
                            }
                        }, 'toBlob');
                    }
                    Object.defineProperty(canvasProto, '__geekezCanvasSerializePatched__', { value: true, configurable: true });
                }
            } catch (e) { }

            try {
                const offscreenProto = window.OffscreenCanvas && window.OffscreenCanvas.prototype;
                if (offscreenProto && offscreenProto.convertToBlob && !offscreenProto.__geekezCanvasSerializePatched__) {
                    const originalConvertToBlob = offscreenProto.convertToBlob;
                    offscreenProto.convertToBlob = makeNative(function convertToBlob() {
                        const noiseTarget = applyCanvasNoiseToCanvas(this);
                        try {
                            const result = originalConvertToBlob.apply((noiseTarget && noiseTarget.canvas) || this, arguments);
                            if (result && typeof result.finally === 'function') {
                                return result.finally(() => { if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore(); });
                            }
                            if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                            return result;
                        } catch (e) {
                            if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                            throw e;
                        }
                    }, 'convertToBlob');
                    Object.defineProperty(offscreenProto, '__geekezCanvasSerializePatched__', { value: true, configurable: true });
                }
            } catch (e) { }

            try {
                const PATCHED_READ_PIXELS_KEY = '__geekezReadPixelsPatched__';
                const noisyPackBuffers = new WeakMap();
                const bufferOwners = new WeakMap();
                const bufferSizes = new WeakMap();
                const pendingReadPixelsErrors = new WeakMap();
                const arrayBufferIsView = ArrayBuffer.isView;
                const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
                const getDescriptorGetter = (target, key) => {
                    const descriptor = Object.getOwnPropertyDescriptor(target, key);
                    return descriptor && descriptor.get;
                };
                const typedArrayTagGetter = getDescriptorGetter(typedArrayPrototype, Symbol.toStringTag);
                const typedArrayBufferGetter = getDescriptorGetter(typedArrayPrototype, 'buffer');
                const typedArrayByteOffsetGetter = getDescriptorGetter(typedArrayPrototype, 'byteOffset');
                const typedArrayByteLengthGetter = getDescriptorGetter(typedArrayPrototype, 'byteLength');
                const dataViewBufferGetter = getDescriptorGetter(DataView.prototype, 'buffer');
                const dataViewByteOffsetGetter = getDescriptorGetter(DataView.prototype, 'byteOffset');
                const dataViewByteLengthGetter = getDescriptorGetter(DataView.prototype, 'byteLength');
                const arrayBufferByteLengthGetter = getDescriptorGetter(ArrayBuffer.prototype, 'byteLength');
                const sharedArrayBufferByteLengthGetter = typeof SharedArrayBuffer !== 'undefined'
                    ? getDescriptorGetter(SharedArrayBuffer.prototype, 'byteLength')
                    : null;
                const isOwnedBuffer = (gl, buffer) => !!buffer && (!bufferOwners.has(buffer) || bufferOwners.get(buffer) === gl);
                const getTypedArrayElementSize = (view) => {
                    try {
                        switch (typedArrayTagGetter.call(view)) {
                            case 'Int8Array':
                            case 'Uint8Array':
                            case 'Uint8ClampedArray':
                                return 1;
                            case 'Int16Array':
                            case 'Uint16Array':
                            case 'Float16Array':
                                return 2;
                            case 'Int32Array':
                            case 'Uint32Array':
                            case 'Float32Array':
                                return 4;
                            case 'BigInt64Array':
                            case 'BigUint64Array':
                            case 'Float64Array':
                                return 8;
                            default:
                                return 1;
                        }
                    } catch (e) {
                        return 1;
                    }
                };
                const getViewByteMetadata = (view) => {
                    if (!view || !arrayBufferIsView(view)) return null;
                    try {
                        const buffer = typedArrayBufferGetter.call(view);
                        const byteOffset = typedArrayByteOffsetGetter.call(view);
                        const byteLength = typedArrayByteLengthGetter.call(view);
                        if (buffer && Number.isInteger(byteOffset) && Number.isInteger(byteLength) && byteOffset >= 0 && byteLength >= 0) {
                            return { buffer, byteOffset, byteLength, elementSize: getTypedArrayElementSize(view) };
                        }
                    } catch (e) { }
                    try {
                        const buffer = dataViewBufferGetter.call(view);
                        const byteOffset = dataViewByteOffsetGetter.call(view);
                        const byteLength = dataViewByteLengthGetter.call(view);
                        if (buffer && Number.isInteger(byteOffset) && Number.isInteger(byteLength) && byteOffset >= 0 && byteLength >= 0) {
                            return { buffer, byteOffset, byteLength, elementSize: 1 };
                        }
                    } catch (e) { }
                    return null;
                };
                const getViewBytes = (view) => {
                    const metadata = getViewByteMetadata(view);
                    if (!metadata) return null;
                    return new Uint8Array(metadata.buffer, metadata.byteOffset, metadata.byteLength);
                };
                const getArrayBufferByteLength = (value) => {
                    if (!value || typeof value !== 'object') return null;
                    try {
                        if (typeof arrayBufferByteLengthGetter === 'function') {
                            const byteLength = arrayBufferByteLengthGetter.call(value);
                            if (Number.isFinite(byteLength) && byteLength >= 0) return byteLength;
                        }
                    } catch (e) { }
                    try {
                        if (typeof sharedArrayBufferByteLengthGetter === 'function') {
                            const byteLength = sharedArrayBufferByteLengthGetter.call(value);
                            if (Number.isFinite(byteLength) && byteLength >= 0) return byteLength;
                        }
                    } catch (e) { }
                    return null;
                };
                const getBufferDestinationBytes = (source) => {
                    const viewBytes = getViewBytes(source);
                    if (viewBytes) return viewBytes;
                    const byteLength = getArrayBufferByteLength(source);
                    if (byteLength === null) return null;
                    return new Uint8Array(source, 0, byteLength);
                };
                const getViewElementSize = (view) => {
                    const metadata = getViewByteMetadata(view);
                    return metadata ? metadata.elementSize : 1;
                };
                const applyViewNoise = (view, startOffset, maxLength, noiseIndexOffset) => {
                    const bytes = getBufferDestinationBytes(view);
                    if (bytes) applyCanvasNoiseToData(bytes, startOffset, maxLength, noiseIndexOffset);
                };
                const getVideoFrameCopySize = (frame, options) => {
                    const rect = options && options.rect ? options.rect : (frame && frame.visibleRect ? frame.visibleRect : null);
                    const width = Number(rect && rect.width ? rect.width : (frame && (frame.displayWidth || frame.codedWidth)));
                    const height = Number(rect && rect.height ? rect.height : (frame && (frame.displayHeight || frame.codedHeight)));
                    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
                    return { width: Math.ceil(width), height: Math.ceil(height) };
                };
                const getVideoFramePlaneShapes = (format, width, height) => {
                    const value = String(format || '').toUpperCase();
                    const halfWidth = Math.ceil(width / 2);
                    const halfHeight = Math.ceil(height / 2);
                    if (['RGBA', 'RGBX', 'BGRA', 'BGRX'].includes(value)) return [{ rows: height, rowBytes: width * 4 }];
                    if (value === 'I420') return [
                        { rows: height, rowBytes: width },
                        { rows: halfHeight, rowBytes: halfWidth },
                        { rows: halfHeight, rowBytes: halfWidth }
                    ];
                    if (value === 'I420A') return [
                        { rows: height, rowBytes: width },
                        { rows: halfHeight, rowBytes: halfWidth },
                        { rows: halfHeight, rowBytes: halfWidth },
                        { rows: height, rowBytes: width }
                    ];
                    if (value === 'I422') return [
                        { rows: height, rowBytes: width },
                        { rows: height, rowBytes: halfWidth },
                        { rows: height, rowBytes: halfWidth }
                    ];
                    if (value === 'I444') return [
                        { rows: height, rowBytes: width },
                        { rows: height, rowBytes: width },
                        { rows: height, rowBytes: width }
                    ];
                    if (value === 'NV12') return [
                        { rows: height, rowBytes: width },
                        { rows: halfHeight, rowBytes: halfWidth * 2 }
                    ];
                    return null;
                };
                const getVideoFramePlaneLayouts = (frame, options, resolvedLayouts) => {
                    const size = getVideoFrameCopySize(frame, options);
                    if (!size) return null;
                    const format = (options && options.format) || (frame && frame.format);
                    const shapes = getVideoFramePlaneShapes(format, size.width, size.height);
                    const layouts = Array.isArray(resolvedLayouts) ? resolvedLayouts : (options && Array.isArray(options.layout) ? options.layout : null);
                    if (!shapes || !layouts || layouts.length < shapes.length) return null;
                    return shapes.map((shape, index) => {
                        const layout = layouts[index] || {};
                        const offset = Number(layout.offset);
                        const stride = Number(layout.stride);
                        if (!Number.isInteger(offset) || !Number.isInteger(stride) || offset < 0 || stride < shape.rowBytes) return null;
                        return { offset, stride, rows: shape.rows, rowBytes: shape.rowBytes };
                    });
                };
                const applyVideoFrameCopyNoise = (destination, frame, options, resolvedLayouts) => {
                    const bytes = getBufferDestinationBytes(destination);
                    const layouts = bytes ? getVideoFramePlaneLayouts(frame, options, resolvedLayouts) : null;
                    if (!bytes || !layouts || layouts.some((layout) => !layout)) return;
                    let logicalNoiseOffset = 0;
                    for (const layout of layouts) {
                        for (let row = 0; row < layout.rows; row++) {
                            const rowOffset = layout.offset + row * layout.stride;
                            if (rowOffset < 0 || rowOffset + layout.rowBytes > bytes.length) return;
                            applyCanvasNoiseToData(bytes, rowOffset, layout.rowBytes, logicalNoiseOffset);
                            logicalNoiseOffset += layout.rowBytes;
                        }
                    }
                };
                try {
                    const videoFrameProto = window.VideoFrame && window.VideoFrame.prototype;
                    if (videoFrameProto && videoFrameProto.copyTo && !videoFrameProto.__geekezVideoFramePatched__) {
                        const originalCopyTo = videoFrameProto.copyTo;
                        videoFrameProto.copyTo = makeNative(function copyTo(destination, options) {
                            const frame = this;
                            const result = originalCopyTo.apply(this, arguments);
                            if (result && typeof result.then === 'function') {
                                return result.then((value) => {
                                    try { applyVideoFrameCopyNoise(destination, frame, options, value); } catch (e) { }
                                    return value;
                                });
                            }
                            try { applyVideoFrameCopyNoise(destination, frame, options); } catch (e) { }
                            return result;
                        }, 'copyTo');
                        Object.defineProperty(videoFrameProto, '__geekezVideoFramePatched__', { value: true, configurable: true });
                    }
                } catch (e) { }
                try {
                    const videoEncoderProto = window.VideoEncoder && window.VideoEncoder.prototype;
                    const noisedVideoFrames = new WeakSet();
                    const makeVideoEncoderIsolationError = () => typeof DOMException === 'function'
                        ? new DOMException('VideoEncoder frame isolation failed', 'OperationError')
                        : new Error('VideoEncoder frame isolation failed');
                    const createNoisedVideoFrame = (frame) => {
                        if (!frame || noisedVideoFrames.has(frame) || typeof window.VideoFrame !== 'function') return frame;
                        const visibleRect = frame && frame.visibleRect;
                        const width = Number(frame.displayWidth || frame.codedWidth || (visibleRect && visibleRect.width) || 0);
                        const height = Number(frame.displayHeight || frame.codedHeight || (visibleRect && visibleRect.height) || 0);
                        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
                        const canvas = window.OffscreenCanvas
                            ? new window.OffscreenCanvas(width, height)
                            : (document && document.createElement ? document.createElement('canvas') : null);
                        if (!canvas) return null;
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext && canvas.getContext('2d');
                        if (!ctx || !ctx.drawImage) return null;
                        ctx.drawImage(frame, 0, 0, width, height);
                        const noiseTarget = applyCanvasNoiseToCanvas(canvas);
                        try {
                            const options = {};
                            const timestamp = Number(frame.timestamp);
                            const duration = Number(frame.duration);
                            if (Number.isFinite(timestamp)) options.timestamp = timestamp;
                            if (Number.isFinite(duration)) options.duration = duration;
                            const replacement = new window.VideoFrame((noiseTarget && noiseTarget.canvas) || canvas, options);
                            noisedVideoFrames.add(replacement);
                            return replacement;
                        } finally {
                            if ((noiseTarget && noiseTarget.restore)) noiseTarget.restore();
                        }
                    };
                    if (videoEncoderProto && videoEncoderProto.encode && !videoEncoderProto.__geekezVideoEncoderPatched__) {
                        const originalEncode = videoEncoderProto.encode;
                        videoEncoderProto.encode = makeNative(function encode(frame, options) {
                            const replacement = createNoisedVideoFrame(frame);
                            if (!replacement) throw makeVideoEncoderIsolationError();
                            try {
                                return originalEncode.call(this, replacement, options);
                            } finally {
                                if (replacement !== frame && replacement && typeof replacement.close === 'function') {
                                    try { replacement.close(); } catch (e) { }
                                }
                            }
                        }, 'encode');
                        Object.defineProperty(videoEncoderProto, '__geekezVideoEncoderPatched__', { value: true, configurable: true });
                    }
                } catch (e) { }
                const isValidBufferUsageEnum = (gl, usage) => {
                    const value = Number(usage);
                    if (!gl || !Number.isFinite(value)) return false;
                    return [
                        gl.STREAM_DRAW,
                        gl.STATIC_DRAW,
                        gl.DYNAMIC_DRAW,
                        gl.STREAM_READ,
                        gl.STREAM_COPY,
                        gl.STATIC_READ,
                        gl.STATIC_COPY,
                        gl.DYNAMIC_READ,
                        gl.DYNAMIC_COPY
                    ].filter((item) => typeof item === 'number').includes(value);
                };
                const getBufferSourceByteLength = (source, srcOffset, length) => {
                    const bufferByteLength = getArrayBufferByteLength(source);
                    const isArrayBuffer = bufferByteLength !== null;
                    const viewMetadata = isArrayBuffer ? null : getViewByteMetadata(source);
                    if (!isArrayBuffer && !viewMetadata) return null;
                    const elementSize = isArrayBuffer ? 1 : viewMetadata.elementSize;
                    const sourceLength = isArrayBuffer ? bufferByteLength : viewMetadata.byteLength;
                    const offsetValue = srcOffset === undefined ? 0 : Number(srcOffset);
                    if (!Number.isFinite(offsetValue) || offsetValue < 0) return null;
                    const offset = offsetValue * elementSize;
                    if (offset > sourceLength) return null;
                    const available = sourceLength - offset;
                    if (length === undefined || Number(length) === 0) return available;
                    const lengthValue = Number(length);
                    if (!Number.isFinite(lengthValue) || lengthValue < 0) return null;
                    const byteLength = lengthValue * elementSize;
                    return byteLength <= available ? byteLength : null;
                };
                const getBufferDataByteLength = (sizeOrData, srcOffset, length) => {
                    if (typeof sizeOrData === 'number') {
                        const size = Number(sizeOrData);
                        return Number.isFinite(size) && size >= 0 ? size : null;
                    }
                    if (sizeOrData === null) return 0;
                    return getBufferSourceByteLength(sizeOrData, srcOffset, length);
                };
                const getBufferSubDataByteLength = (dstBuffer, dstOffset, length) => getBufferSourceByteLength(dstBuffer, dstOffset, length);
                const canWriteReadPixelsResult = (bytes, dstOffset, byteLength) => Number.isInteger(dstOffset)
                    && Number.isInteger(byteLength)
                    && dstOffset >= 0
                    && byteLength > 0
                    && dstOffset + byteLength <= bytes.length;
                const getTypedArrayView = (tag, buffer, byteOffset, length) => {
                    try {
                        if (tag === 'Int16Array') return new Int16Array(buffer, byteOffset, length);
                        if (tag === 'Uint16Array') return new Uint16Array(buffer, byteOffset, length);
                        if (tag === 'Int32Array') return new Int32Array(buffer, byteOffset, length);
                        if (tag === 'Uint32Array') return new Uint32Array(buffer, byteOffset, length);
                        if (tag === 'Float16Array' && typeof Float16Array === 'function') return new Float16Array(buffer, byteOffset, length);
                        if (tag === 'Float32Array') return new Float32Array(buffer, byteOffset, length);
                        if (tag === 'Float64Array') return new Float64Array(buffer, byteOffset, length);
                    } catch (e) { }
                    return null;
                };
                const clampTypedNoiseValue = (tag, value) => {
                    if (tag === 'Int16Array') return Math.max(-32768, Math.min(32767, Math.round(value)));
                    if (tag === 'Uint16Array') return Math.max(0, Math.min(65535, Math.round(value)));
                    if (tag === 'Int32Array') return Math.max(-2147483648, Math.min(2147483647, Math.round(value)));
                    if (tag === 'Uint32Array') return Math.max(0, Math.min(4294967295, Math.round(value)));
                    return value;
                };
                const getTypedChannelNoise = (channel, tag) => {
                    const key = ['r', 'g', 'b', 'a'][channel] || 'r';
                    const noise = getChannelNoise(key);
                    return tag === 'Float16Array' || tag === 'Float32Array' || tag === 'Float64Array'
                        ? noise / 255
                        : noise;
                };
                const applyTypedReadPixelsNoise = (view, startOffset, byteLength, noiseIndexOffset) => {
                    const metadata = getViewByteMetadata(view);
                    if (!metadata || metadata.elementSize <= 1) return false;
                    const tag = typeof typedArrayTagGetter === 'function' ? typedArrayTagGetter.call(view) : '';
                    const start = Math.max(0, Number(startOffset) || 0);
                    const length = Math.max(0, Number(byteLength) || 0);
                    if (!length || start % metadata.elementSize !== 0) return false;
                    const elementCount = Math.floor(length / metadata.elementSize);
                    if (!elementCount) return false;
                    const typed = getTypedArrayView(tag, metadata.buffer, metadata.byteOffset + start, elementCount);
                    if (!typed) return false;
                    const indexOffset = Math.floor((Number(noiseIndexOffset) || 0) / metadata.elementSize);
                    for (let i = 0; i < typed.length; i++) {
                        const componentIndex = indexOffset + i;
                        const channel = componentIndex % 4;
                        if (!shouldTouchPixel((componentIndex - channel) * 4)) continue;
                        typed[i] = clampTypedNoiseValue(tag, typed[i] + getTypedChannelNoise(channel, tag));
                    }
                    return true;
                };
                const applyBufferDestinationNoise = (destination, bytes, startOffset, byteLength, noiseIndexOffset) => {
                    if (applyTypedReadPixelsNoise(destination, startOffset, byteLength, noiseIndexOffset)) return;
                    applyCanvasNoiseToData(bytes, startOffset, byteLength, noiseIndexOffset);
                };
                const isUint8ArrayView = (view) => {
                    try {
                        return !!view && typeof typedArrayTagGetter === 'function' && typedArrayTagGetter.call(view) === 'Uint8Array';
                    } catch (e) {
                        return false;
                    }
                };
                const canNoiseReadPixelsType = (gl, type) => Number.isFinite(Number(type));
                const canReadPixelPackBuffer = (gl) => !!gl && typeof gl.PIXEL_PACK_BUFFER === 'number' && typeof gl.PIXEL_PACK_BUFFER_BINDING === 'number';
                const canWriteReadPixelsArray = (gl, pixels, type) => !!getViewByteMetadata(pixels)
                    && canNoiseReadPixelsType(gl, type)
                    && (!canReadPixelPackBuffer(gl) || !getBoundBuffer(gl, gl.PIXEL_PACK_BUFFER));
                const getPackParameter = (gl, key, fallback) => {
                    try {
                        if (!gl || typeof key !== 'number' || typeof gl.getParameter !== 'function') return fallback;
                        const value = Number(gl.getParameter(key));
                        return Number.isInteger(value) && value >= 0 ? value : fallback;
                    } catch (e) {
                        return fallback;
                    }
                };
                const canReadPixelsSucceed = (gl) => {
                    try {
                        if (!gl || typeof gl.getParameter !== 'function') return false;
                        if (typeof gl.isContextLost === 'function' && gl.isContextLost()) return false;
                        if (typeof gl.READ_BUFFER === 'number') {
                            const readBuffer = gl.getParameter(gl.READ_BUFFER);
                            const NONE = gl.NONE || 0;
                            if (readBuffer === NONE) return false;
                        }
                        return true;
                    } catch (e) {
                        return false;
                    }
                };
                const queueGlErrors = (gl, errors) => {
                    const filtered = errors.filter((error) => Number(error) !== (gl.NO_ERROR || 0));
                    if (!filtered.length) return;
                    pendingReadPixelsErrors.set(gl, (pendingReadPixelsErrors.get(gl) || []).concat(filtered));
                };
                const takeGlErrors = (gl, originalGetError) => {
                    const errors = [];
                    if (typeof originalGetError !== 'function') return errors;
                    for (let i = 0; i < 16; i++) {
                        const error = originalGetError.call(gl);
                        errors.push(error);
                        if (Number(error) === (gl.NO_ERROR || 0)) break;
                    }
                    queueGlErrors(gl, errors);
                    return errors;
                };
                const hasGlError = (gl, errors) => errors.some((error) => Number(error) !== (gl.NO_ERROR || 0));
                const hasReadableFramebuffer = (gl) => {
                    try {
                        if (!canReadPixelsSucceed(gl)) return false;
                        const framebufferBinding = typeof gl.READ_FRAMEBUFFER_BINDING === 'number'
                            ? gl.READ_FRAMEBUFFER_BINDING
                            : (gl.FRAMEBUFFER_BINDING || 36006);
                        const framebuffer = gl.getParameter(framebufferBinding);
                        if (!framebuffer) return true;
                        return typeof gl.checkFramebufferStatus === 'function'
                            && gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER || gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
                    } catch (e) {
                        return false;
                    }
                };
                const getReadPixelsComponentCount = (gl, format) => {
                    const value = Number(format);
                    if ([gl.ALPHA || 6406, gl.LUMINANCE || 6409, gl.RED || 6403, gl.RED_INTEGER || 36244, gl.DEPTH_COMPONENT || 6402].includes(value)) return 1;
                    if ([gl.LUMINANCE_ALPHA || 6410, gl.RG || 33319, gl.RG_INTEGER || 33320, gl.DEPTH_STENCIL || 34041].includes(value)) return 2;
                    if ([gl.RGB || 6407, gl.RGB_INTEGER || 36248].includes(value)) return 3;
                    if ([gl.RGBA || 6408, gl.RGBA_INTEGER || 36249].includes(value)) return 4;
                    return null;
                };
                const getReadPixelsBytesPerPixel = (gl, format, type) => {
                    const value = Number(type);
                    if ([gl.UNSIGNED_SHORT_5_6_5 || 33635, gl.UNSIGNED_SHORT_4_4_4_4 || 32819, gl.UNSIGNED_SHORT_5_5_5_1 || 32820].includes(value)) return 2;
                    if ([gl.UNSIGNED_INT_2_10_10_10_REV || 33640, gl.UNSIGNED_INT_10F_11F_11F_REV || 35899, gl.UNSIGNED_INT_5_9_9_9_REV || 35902, gl.UNSIGNED_INT_24_8 || 34042].includes(value)) return 4;
                    if ([gl.FLOAT_32_UNSIGNED_INT_24_8_REV || 36269].includes(value)) return 8;
                    const componentCount = getReadPixelsComponentCount(gl, format);
                    if (!componentCount) return null;
                    if ([gl.BYTE || 5120, gl.UNSIGNED_BYTE || 5121].includes(value)) return componentCount;
                    if ([gl.SHORT || 5122, gl.UNSIGNED_SHORT || 5123, gl.HALF_FLOAT || 5131, 36193].includes(value)) return componentCount * 2;
                    if ([gl.INT || 5124, gl.UNSIGNED_INT || 5125, gl.FLOAT || 5126].includes(value)) return componentCount * 4;
                    return null;
                };
                const getReadPixelsByteLength = (gl, x, y, width, height, format, type) => {
                    const widthValue = Number(width);
                    const heightValue = Number(height);
                    if (!Number.isInteger(widthValue) || !Number.isInteger(heightValue) || widthValue <= 0 || heightValue <= 0) return null;
                    if (!hasReadableFramebuffer(gl)) return null;
                    const bytesPerPixel = getReadPixelsBytesPerPixel(gl, format, type);
                    if (!bytesPerPixel) return null;
                    const rowByteLength = widthValue * bytesPerPixel;
                    const packAlignment = getPackParameter(gl, (gl && gl.PACK_ALIGNMENT) || 3333, 4);
                    if (![1, 2, 4, 8].includes(packAlignment)) return null;
                    const packRowLength = getPackParameter(gl, gl && gl.PACK_ROW_LENGTH, 0);
                    const packSkipRows = getPackParameter(gl, gl && gl.PACK_SKIP_ROWS, 0);
                    const packSkipPixels = getPackParameter(gl, gl && gl.PACK_SKIP_PIXELS, 0);
                    const rowPixels = packRowLength > 0 ? packRowLength : widthValue;
                    if (rowPixels < widthValue) return null;
                    const rowStride = Math.ceil((rowPixels * bytesPerPixel) / packAlignment) * packAlignment;
                    const byteOffset = packSkipRows * rowStride + packSkipPixels * bytesPerPixel;
                    const byteLength = byteOffset + (heightValue - 1) * rowStride + rowByteLength;
                    if (!Number.isSafeInteger(byteLength)) return null;
                    return { byteLength, byteOffset, rowByteLength, rowStride, height: heightValue };
                };
                const applyReadPixelsNoise = (destination, bytes, dstOffset, layout) => {
                    for (let row = 0; row < layout.height; row++) {
                        const rowOffset = dstOffset + layout.byteOffset + row * layout.rowStride;
                        applyBufferDestinationNoise(destination, bytes, rowOffset, layout.rowByteLength, row * layout.rowByteLength);
                    }
                };
                const addReadPixelsNoisyRanges = (buffer, packOffset, layout) => {
                    for (let row = 0; row < layout.height; row++) {
                        addNoisyPackBufferRange(
                            buffer,
                            packOffset + layout.byteOffset + row * layout.rowStride,
                            layout.rowByteLength,
                            row * layout.rowByteLength
                        );
                    }
                };
                const mergeNoisyRanges = (ranges) => {
                    const sorted = ranges
                        .filter((range) => range && range.length > 0)
                        .map((range) => ({
                            offset: range.offset,
                            length: range.length,
                            noiseIndexOffset: Number(range.noiseIndexOffset) || 0
                        }))
                        .slice()
                        .sort((a, b) => a.offset - b.offset);
                    return sorted.reduce((merged, range) => {
                        const last = merged[merged.length - 1];
                        if (!last) return [range];
                        const lastEnd = last.offset + last.length;
                        const hasSameNoiseBase = last.noiseIndexOffset - last.offset === range.noiseIndexOffset - range.offset;
                        if (range.offset > lastEnd || !hasSameNoiseBase) return merged.concat([range]);
                        const end = Math.max(lastEnd, range.offset + range.length);
                        return merged.slice(0, -1).concat([{ offset: last.offset, length: end - last.offset, noiseIndexOffset: last.noiseIndexOffset }]);
                    }, []);
                };
                const clearNoisyPackBufferRange = (buffer, offset, length) => {
                    const start = Math.max(0, Number(offset) || 0);
                    const size = Math.max(0, Number(length) || 0);
                    if (!buffer || !size) return;
                    const end = start + size;
                    const ranges = noisyPackBuffers.get(buffer) || [];
                    const kept = ranges.flatMap((range) => {
                        const rangeStart = range.offset;
                        const rangeEnd = range.offset + range.length;
                        if (end <= rangeStart || start >= rangeEnd) return [range];
                        const noiseIndexOffset = Number(range.noiseIndexOffset) || 0;
                        const before = start > rangeStart
                            ? [{ offset: rangeStart, length: start - rangeStart, noiseIndexOffset }]
                            : [];
                        const after = end < rangeEnd
                            ? [{ offset: end, length: rangeEnd - end, noiseIndexOffset: noiseIndexOffset + end - rangeStart }]
                            : [];
                        return before.concat(after);
                    });
                    const merged = mergeNoisyRanges(kept);
                    if (merged.length) {
                        noisyPackBuffers.set(buffer, merged);
                    } else {
                        noisyPackBuffers.delete(buffer);
                    }
                };
                const addNoisyPackBufferRange = (buffer, offset, length, noiseIndexOffset) => {
                    const start = Math.max(0, Number(offset) || 0);
                    const size = Math.max(0, Number(length) || 0);
                    const noiseStart = Math.max(0, Number(noiseIndexOffset) || 0);
                    if (!buffer || !size) return;
                    clearNoisyPackBufferRange(buffer, start, size);
                    const ranges = noisyPackBuffers.get(buffer) || [];
                    noisyPackBuffers.set(buffer, mergeNoisyRanges(ranges.concat([{ offset: start, length: size, noiseIndexOffset: noiseStart }])));
                };
                const getBufferBindingEnum = (gl, target) => {
                    if (typeof gl.PIXEL_PACK_BUFFER === 'number' && target === gl.PIXEL_PACK_BUFFER) {
                        return typeof gl.PIXEL_PACK_BUFFER_BINDING === 'number' ? gl.PIXEL_PACK_BUFFER_BINDING : null;
                    }
                    if (typeof gl.PIXEL_UNPACK_BUFFER === 'number' && target === gl.PIXEL_UNPACK_BUFFER) {
                        return typeof gl.PIXEL_UNPACK_BUFFER_BINDING === 'number' ? gl.PIXEL_UNPACK_BUFFER_BINDING : null;
                    }
                    if (target === (gl.ARRAY_BUFFER || 34962)) return gl.ARRAY_BUFFER_BINDING || 34964;
                    if (target === (gl.ELEMENT_ARRAY_BUFFER || 34963)) return gl.ELEMENT_ARRAY_BUFFER_BINDING || 34965;
                    if (target === (gl.COPY_READ_BUFFER || 36662)) return gl.COPY_READ_BUFFER_BINDING || 36662;
                    if (target === (gl.COPY_WRITE_BUFFER || 36663)) return gl.COPY_WRITE_BUFFER_BINDING || 36663;
                    if (target === (gl.TRANSFORM_FEEDBACK_BUFFER || 35982)) return gl.TRANSFORM_FEEDBACK_BUFFER_BINDING || 35983;
                    if (target === (gl.UNIFORM_BUFFER || 35345)) return gl.UNIFORM_BUFFER_BINDING || 35368;
                    return null;
                };
                const getBoundBuffer = (gl, target) => {
                    if (!gl || typeof gl.getParameter !== 'function') return null;
                    const bindingEnum = getBufferBindingEnum(gl, target);
                    return bindingEnum ? gl.getParameter(bindingEnum) : null;
                };
                const isValidBufferUsage = (buffer, offset, size) => {
                    const start = Number(offset);
                    const length = Number(size);
                    const knownSize = bufferSizes.get(buffer);
                    return !!buffer
                        && Number.isFinite(start)
                        && Number.isFinite(length)
                        && start >= 0
                        && length > 0
                        && typeof knownSize === 'number'
                        && start + length <= knownSize;
                };
                const canCopyBufferRange = (gl, sourceBuffer, targetBuffer, readOffset, writeOffset, size) => {
                    const readStart = Number(readOffset);
                    const writeStart = Number(writeOffset);
                    const length = Number(size);
                    if (!isOwnedBuffer(gl, sourceBuffer) || !isOwnedBuffer(gl, targetBuffer)) return false;
                    if (!isValidBufferUsage(sourceBuffer, readStart, length) || !isValidBufferUsage(targetBuffer, writeStart, length)) return false;
                    return sourceBuffer !== targetBuffer || readStart + length <= writeStart || writeStart + length <= readStart;
                };
                const isTrackedRange = (buffer, offset, size) => {
                    const ranges = buffer ? noisyPackBuffers.get(buffer) : null;
                    if (!ranges || !ranges.length || !isValidBufferUsage(buffer, offset, size)) return false;
                    const start = Number(offset);
                    const end = start + Number(size);
                    return ranges.some((range) => start < range.offset + range.length && end > range.offset);
                };
                const applyNoisyBufferRanges = (buffer, srcByteOffset, dstBuffer, dstOffset, length) => {
                    const ranges = buffer ? noisyPackBuffers.get(buffer) : null;
                    const bytes = getViewBytes(dstBuffer);
                    const readLength = getBufferSubDataByteLength(dstBuffer, dstOffset, length);
                    if (!ranges || !ranges.length || !bytes || readLength === null || !isValidBufferUsage(buffer, srcByteOffset, readLength)) return;
                    const elementSize = getViewElementSize(dstBuffer);
                    const dstStart = Number(dstOffset || 0) * elementSize;
                    const srcStart = Number(srcByteOffset);
                    const srcEnd = srcStart + readLength;
                    ranges.forEach((range) => {
                        const rangeStart = range.offset;
                        const rangeEnd = range.offset + range.length;
                        const overlapStart = Math.max(srcStart, rangeStart);
                        const overlapEnd = Math.min(srcEnd, rangeEnd);
                        if (overlapEnd <= overlapStart) return;
                        const targetOffset = dstStart + overlapStart - srcStart;
                        const noiseIndexOffset = (Number(range.noiseIndexOffset) || 0) + overlapStart - rangeStart;
                        applyBufferDestinationNoise(dstBuffer, bytes, targetOffset, overlapEnd - overlapStart, noiseIndexOffset);
                    });
                };
                const propagateNoisyBufferRanges = (sourceBuffer, targetBuffer, readOffset, writeOffset, size) => {
                    const ranges = sourceBuffer ? noisyPackBuffers.get(sourceBuffer) : null;
                    if (!ranges || !ranges.length || !targetBuffer) return;
                    const readStart = Math.max(0, Number(readOffset) || 0);
                    const readEnd = readStart + Math.max(0, Number(size) || 0);
                    const writeStart = Math.max(0, Number(writeOffset) || 0);
                    ranges.forEach((range) => {
                        const overlapStart = Math.max(readStart, range.offset);
                        const overlapEnd = Math.min(readEnd, range.offset + range.length);
                        if (overlapEnd <= overlapStart) return;
                        const noiseIndexOffset = (Number(range.noiseIndexOffset) || 0) + overlapStart - range.offset;
                        addNoisyPackBufferRange(targetBuffer, writeStart + overlapStart - readStart, overlapEnd - overlapStart, noiseIndexOffset);
                    });
                };
                const hookReadPixels = (proto) => {
                    if (!proto || proto[PATCHED_READ_PIXELS_KEY] || !proto.readPixels) return;
                    const originalReadPixels = proto.readPixels;
                    const originalGetError = proto.getError;
                    const originalGetBufferSubData = proto.getBufferSubData;
                    const originalCopyBufferSubData = proto.copyBufferSubData;
                    const originalBufferData = proto.bufferData;
                    const originalBufferSubData = proto.bufferSubData;
                    const originalDeleteBuffer = proto.deleteBuffer;
                    const originalCreateBuffer = proto.createBuffer;
                    if (originalGetError) {
                        proto.getError = makeNative(function getError() {
                            const queued = pendingReadPixelsErrors.get(this);
                            if (queued && queued.length) {
                                const error = queued[0];
                                const rest = queued.slice(1);
                                if (rest.length) pendingReadPixelsErrors.set(this, rest);
                                else pendingReadPixelsErrors.delete(this);
                                return error;
                            }
                            return originalGetError.apply(this, arguments);
                        }, 'getError');
                    }
                    if (originalCreateBuffer) {
                        proto.createBuffer = makeNative(function createBuffer() {
                            const buffer = originalCreateBuffer.apply(this, arguments);
                            try { if (buffer) bufferOwners.set(buffer, this); } catch (e) { }
                            return buffer;
                        }, 'createBuffer');
                    }
                    proto.readPixels = makeNative(function readPixels(x, y, width, height, format, type, pixels, offset) {
                        const layout = getReadPixelsByteLength(this, x, y, width, height, format, type);
                        const byteLength = layout ? layout.byteLength : 0;
                        const bytes = getViewBytes(pixels);
                        const offsetValue = offset === undefined ? 0 : Number(offset);
                        const dstOffset = offsetValue * getViewElementSize(pixels);
                        const boundPackBuffer = canReadPixelPackBuffer(this) ? getBoundBuffer(this, this.PIXEL_PACK_BUFFER) : null;
                        const packOffset = Number(pixels);
                        const canNoiseBytes = layout && bytes
                            && canWriteReadPixelsArray(this, pixels, type)
                            && Number.isInteger(offsetValue)
                            && canWriteReadPixelsResult(bytes, dstOffset, byteLength);
                        const canTrackPackBuffer = layout && !bytes
                            && canNoiseReadPixelsType(this, type)
                            && isOwnedBuffer(this, boundPackBuffer)
                            && isValidBufferUsage(boundPackBuffer, packOffset, byteLength);
                        takeGlErrors(this, originalGetError);
                        const result = originalReadPixels.apply(this, arguments);
                        const readPixelsErrors = takeGlErrors(this, originalGetError);
                        if (hasGlError(this, readPixelsErrors) || (!canNoiseBytes && !canTrackPackBuffer)) return result;
                        try {
                            if (canNoiseBytes) {
                                applyReadPixelsNoise(pixels, bytes, dstOffset, layout);
                            } else {
                                addReadPixelsNoisyRanges(boundPackBuffer, packOffset, layout);
                            }
                        } catch (e) { }
                        return result;
                    }, 'readPixels');
                    if (originalGetBufferSubData) {
                        proto.getBufferSubData = makeNative(function getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length) {
                            const result = originalGetBufferSubData.apply(this, arguments);
                            try {
                                applyNoisyBufferRanges(getBoundBuffer(this, target), srcByteOffset, dstBuffer, dstOffset, length);
                            } catch (e) { }
                            return result;
                        }, 'getBufferSubData');
                    }
                    if (originalCopyBufferSubData) {
                        proto.copyBufferSubData = makeNative(function copyBufferSubData(readTarget, writeTarget, readOffset, writeOffset, size) {
                            const sourceBuffer = getBoundBuffer(this, readTarget);
                            const targetBuffer = getBoundBuffer(this, writeTarget);
                            const result = originalCopyBufferSubData.apply(this, arguments);
                            try {
                                if (canCopyBufferRange(this, sourceBuffer, targetBuffer, readOffset, writeOffset, size)) {
                                    clearNoisyPackBufferRange(targetBuffer, writeOffset, size);
                                    if (isTrackedRange(sourceBuffer, readOffset, size)) {
                                        propagateNoisyBufferRanges(sourceBuffer, targetBuffer, readOffset, writeOffset, size);
                                    }
                                }
                            } catch (e) { }
                            return result;
                        }, 'copyBufferSubData');
                    }
                    if (originalBufferData) {
                        proto.bufferData = makeNative(function bufferData(target, sizeOrData, usage, srcOffset, length) {
                            const targetBuffer = getBoundBuffer(this, target);
                            const result = originalBufferData.apply(this, arguments);
                            try {
                                const size = getBufferDataByteLength(sizeOrData, srcOffset, length);
                                if (isOwnedBuffer(this, targetBuffer) && isValidBufferUsageEnum(this, usage) && size !== null) {
                                    noisyPackBuffers.delete(targetBuffer);
                                    bufferSizes.set(targetBuffer, size);
                                }
                            } catch (e) { }
                            return result;
                        }, 'bufferData');
                    }
                    if (originalBufferSubData) {
                        proto.bufferSubData = makeNative(function bufferSubData(target, dstByteOffset, srcData, srcOffset, length) {
                            const targetBuffer = getBoundBuffer(this, target);
                            const result = originalBufferSubData.apply(this, arguments);
                            try {
                                const size = getBufferSourceByteLength(srcData, srcOffset, length);
                                if (size !== null && isOwnedBuffer(this, targetBuffer) && isValidBufferUsage(targetBuffer, dstByteOffset, size)) {
                                    clearNoisyPackBufferRange(targetBuffer, dstByteOffset, size);
                                }
                            } catch (e) { }
                            return result;
                        }, 'bufferSubData');
                    }
                    if (originalDeleteBuffer) {
                        proto.deleteBuffer = makeNative(function deleteBuffer(buffer) {
                            const result = originalDeleteBuffer.apply(this, arguments);
                            try {
                                if (isOwnedBuffer(this, buffer)) {
                                    noisyPackBuffers.delete(buffer);
                                    bufferSizes.delete(buffer);
                                    bufferOwners.delete(buffer);
                                }
                            } catch (e) { }
                            return result;
                        }, 'deleteBuffer');
                    }
                    Object.defineProperty(proto, PATCHED_READ_PIXELS_KEY, { value: true, configurable: true });
                };
                const patchReadPixelsContext = (context) => {
                    if (!context) return context;
                    try { hookReadPixels(Object.getPrototypeOf(context)); } catch (e) { }
                    return context;
                };
                const patchReadPixelsFactory = (canvasProto) => {
                    if (!canvasProto || !canvasProto.getContext || canvasProto.__geekezReadPixelsFactoryPatched__) return;
                    const originalGetContext = canvasProto.getContext;
                    canvasProto.getContext = makeNative(function getContext(type) {
                        const context = originalGetContext.apply(this, arguments);
                        const name = String(type || '').toLowerCase();
                        if (name === 'webgl' || name === 'experimental-webgl' || name === 'webgl2') {
                            return patchReadPixelsContext(context);
                        }
                        return context;
                    }, 'getContext');
                    Object.defineProperty(canvasProto, '__geekezReadPixelsFactoryPatched__', { value: true, configurable: true });
                };
                hookReadPixels(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
                hookReadPixels(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
                patchReadPixelsFactory(window.HTMLCanvasElement && window.HTMLCanvasElement.prototype);
                patchReadPixelsFactory(window.OffscreenCanvas && window.OffscreenCanvas.prototype);
            } catch (e) { }

            try {
                const audioProto = window.AudioBuffer && window.AudioBuffer.prototype;
                if (audioProto && audioProto.getChannelData && !audioProto.__geekezAudioPatched__) {
                    const originalGetChannelData = audioProto.getChannelData;
                    const originalCopyFromChannel = audioProto.copyFromChannel;
                    const noisedAudioChannels = new WeakMap();
                    const getAudioNoise = () => fp.audioNoise || 0.0000001;
                    const ensureAudioChannelNoised = (buffer, channel) => {
                        const channelKey = String(channel || 0);
                        let appliedChannels = noisedAudioChannels.get(buffer);
                        if (!appliedChannels) {
                            appliedChannels = new Set();
                            noisedAudioChannels.set(buffer, appliedChannels);
                        }
                        if (appliedChannels.has(channelKey)) return;
                        const samples = originalGetChannelData.call(buffer, channel);
                        const noise = getAudioNoise();
                        for (let i = 0; i < 100 && i < samples.length; i++) {
                            samples[i] = samples[i] + noise;
                        }
                        appliedChannels.add(channelKey);
                    };
                    const hookedGetChannelData = function getChannelData(channel) {
                        ensureAudioChannelNoised(this, channel);
                        return originalGetChannelData.apply(this, arguments);
                    };
                    audioProto.getChannelData = makeNative(hookedGetChannelData, 'getChannelData');
                    if (originalCopyFromChannel) {
                        audioProto.copyFromChannel = makeNative(function copyFromChannel(destination, channelNumber, startInChannel) {
                            ensureAudioChannelNoised(this, channelNumber);
                            return originalCopyFromChannel.apply(this, arguments);
                        }, 'copyFromChannel');
                    }
                    Object.defineProperty(audioProto, '__geekezAudioPatched__', { value: true, configurable: true });
                }
            } catch (e) { }

            // --- 7. WebGL spoof ---
            const enableWebglSpoof = !!(fp.webgl && !fp.webgl.disabled && fp.webglProfile !== 'none');
            if (enableWebglSpoof || enableUaSpoof || canvasSeed) {
            const webglInfo = fp.webgl || {};
            const PATCHED_WEBGL_PROTO_KEY = '__geekezWebglPatched__';
            const debugExt = {
                UNMASKED_VENDOR_WEBGL: 37445,
                UNMASKED_RENDERER_WEBGL: 37446
            };
            const deriveWebglCaps = () => {
                const renderer = String(webglInfo.unmaskedRenderer || webglInfo.renderer || '').toLowerCase();
                const vendor = String(webglInfo.unmaskedVendor || webglInfo.vendor || '').toLowerCase();
                const isApple = renderer.includes('apple') || vendor.includes('apple');
                const isNvidia = renderer.includes('nvidia') || vendor.includes('nvidia');
                const isAmd = renderer.includes('amd') || renderer.includes('radeon') || vendor.includes('ati');
                const isIntel = renderer.includes('intel') || vendor.includes('intel');

                let textureSize = 16384;
                let renderbufferSize = 16384;
                let vertexUniforms = 1024;
                let fragmentUniforms = 1024;
                let varyingVectors = 30;
                let vertexAttribs = 16;

                if (isApple || isNvidia || isAmd) {
                    textureSize = 32768;
                    renderbufferSize = 32768;
                    vertexUniforms = 4096;
                    fragmentUniforms = 2048;
                    varyingVectors = 32;
                } else if (isIntel) {
                    textureSize = 16384;
                    renderbufferSize = 16384;
                    vertexUniforms = 2048;
                    fragmentUniforms = 1024;
                    varyingVectors = 30;
                }

                return {
                    3379: textureSize, // MAX_TEXTURE_SIZE
                    34076: textureSize, // MAX_CUBE_MAP_TEXTURE_SIZE
                    34024: renderbufferSize, // MAX_RENDERBUFFER_SIZE
                    34921: vertexAttribs, // MAX_VERTEX_ATTRIBS
                    34930: 16, // MAX_TEXTURE_IMAGE_UNITS
                    35660: 16, // MAX_VERTEX_TEXTURE_IMAGE_UNITS
                    35661: 32, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
                    36347: vertexUniforms, // MAX_VERTEX_UNIFORM_VECTORS
                    36348: varyingVectors, // MAX_VARYING_VECTORS
                    36349: fragmentUniforms, // MAX_FRAGMENT_UNIFORM_VECTORS
                    3386: new Int32Array([textureSize, textureSize]), // MAX_VIEWPORT_DIMS
                    33901: new Float32Array([1, 1024]), // ALIASED_POINT_SIZE_RANGE
                    33902: new Float32Array([1, 1]), // ALIASED_LINE_WIDTH_RANGE
                    34852: 8, // MAX_DRAW_BUFFERS
                    36063: 8 // MAX_COLOR_ATTACHMENTS
                };
            };
            const webglCaps = deriveWebglCaps();
            const cloneCapValue = (value) => {
                if (value instanceof Int32Array) return new Int32Array(value);
                if (value instanceof Float32Array) return new Float32Array(value);
                if (Array.isArray(value)) return value.slice();
                return value;
            };

            const hookWebGLPrototype = (proto) => {
                if (!proto || proto[PATCHED_WEBGL_PROTO_KEY]) return;
                try {
                    const originalGetParameter = proto.getParameter;
                    const originalGetExtension = proto.getExtension;
                    const originalGetSupportedExtensions = proto.getSupportedExtensions;

                    const hookedGetParameter = function getParameter(param) {
                        if (param === 37445) return webglInfo.unmaskedVendor || webglInfo.vendor || 'Google Inc.';
                        if (param === 37446) return webglInfo.unmaskedRenderer || webglInfo.renderer || 'ANGLE (Unknown GPU)';
                        if (param === 7936) return webglInfo.vendor || 'Google Inc.';
                        if (param === 7937) return webglInfo.renderer || 'ANGLE (Unknown GPU)';
                        if (param === 7938) return webglInfo.version || 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
                        if (param === 35724) return webglInfo.shadingLanguageVersion || 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
                        if (Object.prototype.hasOwnProperty.call(webglCaps, param)) return cloneCapValue(webglCaps[param]);
                        return originalGetParameter.apply(this, arguments);
                    };

                    const hookedGetExtension = function getExtension(name) {
                        if (name === 'WEBGL_debug_renderer_info') return debugExt;
                        return originalGetExtension.apply(this, arguments);
                    };

                    const hookedGetSupportedExtensions = function getSupportedExtensions() {
                        const list = originalGetSupportedExtensions ? originalGetSupportedExtensions.apply(this, arguments) : [];
                        if (Array.isArray(list) && !list.includes('WEBGL_debug_renderer_info')) {
                            return list.concat(['WEBGL_debug_renderer_info']);
                        }
                        return list;
                    };

                    proto.getParameter = makeNative(hookedGetParameter, 'getParameter');
                    proto.getExtension = makeNative(hookedGetExtension, 'getExtension');
                    if (originalGetSupportedExtensions) {
                        proto.getSupportedExtensions = makeNative(hookedGetSupportedExtensions, 'getSupportedExtensions');
                    }
                    Object.defineProperty(proto, PATCHED_WEBGL_PROTO_KEY, {
                        value: true,
                        configurable: true
                    });
                } catch (e) { }
            };

            const patchContextIfNeeded = (context) => {
                if (!context || typeof context !== 'object') return context;
                try {
                    hookWebGLPrototype(Object.getPrototypeOf(context));
                } catch (e) { }
                return context;
            };

            const hookCanvasContextFactory = (canvasProto) => {
                if (!canvasProto || !canvasProto.getContext || canvasProto.__geekezWebglFactoryPatched__) return;
                try {
                    const originalGetContext = canvasProto.getContext;
                    canvasProto.getContext = makeNative(function getContext(type) {
                        const context = originalGetContext.apply(this, arguments);
                        const name = String(type || '').toLowerCase();
                        if (name === 'webgl' || name === 'experimental-webgl' || name === 'webgl2') {
                            return patchContextIfNeeded(context);
                        }
                        return context;
                    }, 'getContext');
                    Object.defineProperty(canvasProto, '__geekezWebglFactoryPatched__', { value: true, configurable: true });
                } catch (e) { }
            };

            if (enableWebglSpoof) {
                hookWebGLPrototype(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
                hookWebGLPrototype(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
                hookCanvasContextFactory(window.HTMLCanvasElement && window.HTMLCanvasElement.prototype);
                hookCanvasContextFactory(window.OffscreenCanvas && window.OffscreenCanvas.prototype);
            }

            // --- 7.1 WebGPU alignment ---
            // Some detectors compare WebGL renderer with WebGPU adapter info.
            // Keep WebGPU adapter metadata aligned with selected WebGL profile.
            const patchGpuAdapter = (gpuObj) => {
                if (!gpuObj || typeof gpuObj.requestAdapter !== 'function') return;
                try {
                    const rendererText = String(webglInfo.unmaskedRenderer || webglInfo.renderer || '');
                    const vendorText = String(webglInfo.unmaskedVendor || webglInfo.vendor || '');
                    const lowerRenderer = rendererText.toLowerCase();
                    const lowerVendor = vendorText.toLowerCase();

                    const guessVendor = () => {
                        if (lowerVendor.includes('apple') || lowerRenderer.includes('apple')) return 'Apple';
                        if (lowerVendor.includes('nvidia') || lowerRenderer.includes('nvidia')) return 'NVIDIA';
                        if (lowerVendor.includes('intel') || lowerRenderer.includes('intel')) return 'Intel';
                        if (lowerVendor.includes('amd') || lowerVendor.includes('ati') || lowerRenderer.includes('amd') || lowerRenderer.includes('radeon')) return 'AMD';
                        return vendorText || 'Unknown';
                    };

                    const fakeAdapterInfo = Object.freeze({
                        vendor: guessVendor(),
                        architecture: guessVendor(),
                        device: rendererText || 'Generic GPU',
                        description: rendererText || 'Generic GPU Adapter'
                    });

                    const originalRequestAdapter = gpuObj.requestAdapter.bind(gpuObj);
                    const wrapAdapter = (adapter) => {
                        if (!adapter || typeof adapter !== 'object') return adapter;
                        return new Proxy(adapter, {
                            get(target, prop, receiver) {
                                if (prop === 'requestAdapterInfo') {
                                    return makeNative(async function requestAdapterInfo() {
                                        return fakeAdapterInfo;
                                    }, 'requestAdapterInfo');
                                }
                                if (prop === 'info') return fakeAdapterInfo;
                                const value = Reflect.get(target, prop, receiver);
                                return typeof value === 'function' ? value.bind(target) : value;
                            }
                        });
                    };

                    const hookedRequestAdapter = async function requestAdapter(options) {
                        const adapter = await originalRequestAdapter(options);
                        return wrapAdapter(adapter);
                    };

                    try {
                        Object.defineProperty(Object.getPrototypeOf(gpuObj), 'requestAdapter', {
                            value: makeNative(hookedRequestAdapter, 'requestAdapter'),
                            configurable: true,
                            writable: true
                        });
                    } catch (e) {
                        gpuObj.requestAdapter = makeNative(hookedRequestAdapter, 'requestAdapter');
                    }
                } catch (e) { }
            };

            if (enableWebglSpoof) {
                patchGpuAdapter(navigator.gpu);
            }
            }

            // --- 8. WebRTC protection ---
            if (window.RTCPeerConnection) {
                const OriginalRTCPeerConnection = window.RTCPeerConnection;
                const HookedRTCPeerConnection = function RTCPeerConnection(config) {
                    const nextConfig = config || {};
                    nextConfig.iceTransportPolicy = 'relay';
                    return new OriginalRTCPeerConnection(nextConfig);
                };
                HookedRTCPeerConnection.prototype = OriginalRTCPeerConnection.prototype;
                window.RTCPeerConnection = makeNative(HookedRTCPeerConnection, 'RTCPeerConnection');
            }

            // --- 9. Watermark ---
            const watermarkStyle = ${styleJson};
            const profileLabel = ${profileLabelJson};

            function createWatermark() {
                try {
                    if (document.getElementById('geekez-watermark')) return;
                    if (!document.body) {
                        setTimeout(createWatermark, 50);
                        return;
                    }

                    if (watermarkStyle === 'banner') {
                        const banner = document.createElement('div');
                        banner.id = 'geekez-watermark';
                        banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5)); backdrop-filter: blur(10px); color: white; padding: 5px 20px; text-align: center; font-size: 12px; font-weight: 500; z-index: 2147483647; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; gap: 8px; font-family: monospace;';

                        const icon = document.createElement('span');
                        icon.textContent = '🔹';

                        const text = document.createElement('span');
                        text.textContent = '环境：' + profileLabel;

                        const closeBtn = document.createElement('button');
                        closeBtn.textContent = '×';
                        closeBtn.style.cssText = 'position: absolute; right: 10px; background: rgba(255,255,255,0.2); border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 16px; line-height: 1;';
                        closeBtn.onclick = function() { banner.style.display = 'none'; };

                        banner.appendChild(icon);
                        banner.appendChild(text);
                        banner.appendChild(closeBtn);
                        document.body.appendChild(banner);
                    } else {
                        const watermark = document.createElement('div');
                        watermark.id = 'geekez-watermark';
                        watermark.style.cssText = 'position: fixed; bottom: 16px; right: 16px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5)); backdrop-filter: blur(10px); color: white; padding: 10px 16px; border-radius: 8px; font-size: 15px; font-weight: 600; z-index: 2147483647; pointer-events: none; user-select: none; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); display: flex; align-items: center; gap: 8px; font-family: monospace; animation: geekez-pulse 2s ease-in-out infinite;';

                        const icon = document.createElement('span');
                        icon.textContent = '🎯';
                        icon.style.cssText = 'font-size: 18px; animation: geekez-rotate 3s linear infinite;';

                        const text = document.createElement('span');
                        text.textContent = profileLabel;

                        watermark.appendChild(icon);
                        watermark.appendChild(text);
                        document.body.appendChild(watermark);

                        if (!document.getElementById('geekez-watermark-styles')) {
                            const styleNode = document.createElement('style');
                            styleNode.id = 'geekez-watermark-styles';
                            styleNode.textContent = '@keyframes geekez-pulse { 0%, 100% { box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); } 50% { box-shadow: 0 4px 25px rgba(102, 126, 234, 0.6); } } @keyframes geekez-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
                            document.head.appendChild(styleNode);
                        }
                    }
                } catch (e) { }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createWatermark);
            } else {
                createWatermark();
            }
        } catch (e) {
            console.error('FP Error', e);
        }
    })();
    `;
}

function getWatermarkScript(profileName, watermarkStyle) {
    const safeProfileName = (profileName || 'Profile').replace(/[<>"'&]/g, '');
    const style = watermarkStyle || 'enhanced';

    return `
    (function() {
        try {
            if (window.__geekezWatermarkBootstrapped__) return;
            window.__geekezWatermarkBootstrapped__ = true;

            const watermarkStyle = ${JSON.stringify(style)};
            const profileLabel = ${JSON.stringify(safeProfileName)};

            function ensureStyleNode() {
                try {
                    if (document.getElementById('geekez-watermark-styles')) return;
                    const styleNode = document.createElement('style');
                    styleNode.id = 'geekez-watermark-styles';
                    styleNode.textContent = '@keyframes geekez-pulse { 0%, 100% { box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); } 50% { box-shadow: 0 4px 25px rgba(102, 126, 234, 0.6); } } @keyframes geekez-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
                    (document.head || document.documentElement).appendChild(styleNode);
                } catch (e) { }
            }

            function createWatermark() {
                try {
                    if (document.getElementById('geekez-watermark')) return;
                    if (!document.body) {
                        setTimeout(createWatermark, 50);
                        return;
                    }

                    ensureStyleNode();

                    if (watermarkStyle === 'banner') {
                        const banner = document.createElement('div');
                        banner.id = 'geekez-watermark';
                        banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5)); backdrop-filter: blur(10px); color: white; padding: 5px 20px; text-align: center; font-size: 12px; font-weight: 500; z-index: 2147483647; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; gap: 8px; font-family: monospace;';

                        const icon = document.createElement('span');
                        icon.textContent = '🔹';

                        const text = document.createElement('span');
                        text.textContent = '环境：' + profileLabel;

                        const closeBtn = document.createElement('button');
                        closeBtn.textContent = '×';
                        closeBtn.style.cssText = 'position: absolute; right: 10px; background: rgba(255,255,255,0.2); border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 16px; line-height: 1;';
                        closeBtn.onclick = function() { banner.style.display = 'none'; };

                        banner.appendChild(icon);
                        banner.appendChild(text);
                        banner.appendChild(closeBtn);
                        document.body.appendChild(banner);
                        return;
                    }

                    const watermark = document.createElement('div');
                    watermark.id = 'geekez-watermark';
                    watermark.style.cssText = 'position: fixed; bottom: 16px; right: 16px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5)); backdrop-filter: blur(10px); color: white; padding: 10px 16px; border-radius: 8px; font-size: 15px; font-weight: 600; z-index: 2147483647; pointer-events: none; user-select: none; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); display: flex; align-items: center; gap: 8px; font-family: monospace; animation: geekez-pulse 2s ease-in-out infinite;';

                    const icon = document.createElement('span');
                    icon.textContent = '🎯';
                    icon.style.cssText = 'font-size: 18px; animation: geekez-rotate 3s linear infinite;';

                    const text = document.createElement('span');
                    text.textContent = profileLabel;

                    watermark.appendChild(icon);
                    watermark.appendChild(text);
                    document.body.appendChild(watermark);
                } catch (e) { }
            }

            function scheduleWatermark() {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', createWatermark, { once: true });
                } else {
                    createWatermark();
                }
                setTimeout(createWatermark, 250);
                setTimeout(createWatermark, 1000);
            }

            scheduleWatermark();

            try {
                const observer = new MutationObserver(() => {
                    if (!document.getElementById('geekez-watermark')) {
                        createWatermark();
                    }
                });
                observer.observe(document.documentElement || document, { childList: true, subtree: true });
            } catch (e) { }
        } catch (e) { }
    })();
    `;
}

export { generateFingerprint, getInjectScript, getWorkerInjectScript, getWatermarkScript, deriveProfileNoiseSeed, applyProfileScopedNoiseSeed, ensureProfileScopedNoiseSeed, rotateProfileNoiseSeed, buildCanvasFingerprintPreview };
