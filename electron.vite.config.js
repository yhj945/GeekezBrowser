import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js'),
          'chromium-path': resolve(__dirname, 'src/main/chromium-path.js'),
          'close-behavior': resolve(__dirname, 'src/main/close-behavior.js'),
          'xray-assets': resolve(__dirname, 'src/main/xray-assets.js'),
          'release-check': resolve(__dirname, 'src/main/release-check.js'),
          'profile-proxy': resolve(__dirname, 'src/main/profile-proxy.js'),
          'utils': resolve(__dirname, 'src/main/utils.js'),
          'proxy-probe-targets': resolve(__dirname, 'src/main/proxy-probe-targets.js'),
          'proxy-startup-health-config': resolve(__dirname, 'src/main/proxy-startup-health-config.js'),
          'launch-args': resolve(__dirname, 'src/main/launch-args.js'),
          'dns-leak-protection': resolve(__dirname, 'src/main/dns-leak-protection.js'),
          'proxy-core/core-types': resolve(__dirname, 'src/main/proxy-core/core-types.js'),
          'proxy-core/proxy-core-config': resolve(__dirname, 'src/main/proxy-core/proxy-core-config.js'),
          'proxy-core/xray-core': resolve(__dirname, 'src/main/proxy-core/xray-core.js'),
          'proxy-core/sing-box-assets': resolve(__dirname, 'src/main/proxy-core/sing-box-assets.js'),
          'proxy-core/sing-box-config': resolve(__dirname, 'src/main/proxy-core/sing-box-config.js'),
          'proxy-core/sing-box-core': resolve(__dirname, 'src/main/proxy-core/sing-box-core.js'),
          'proxy-core/proxy-core-runtime': resolve(__dirname, 'src/main/proxy-core/proxy-core-runtime.js')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.js')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
