import Uni from '@dcloudio/vite-plugin-uni'
import UniHelperComponents from '@uni-helper/vite-plugin-uni-components'
import UniHelperLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniHelperManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniHelperPages from '@uni-helper/vite-plugin-uni-pages'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default async () => {
  const UnoCSS = (await import('unocss/vite')).default

  return defineConfig({
    plugins: [
      // https://github.com/uni-helper/vite-plugin-uni-manifest
      UniHelperManifest(),
      // https://github.com/uni-helper/vite-plugin-uni-pages
      UniHelperPages({
        dts: 'src/uni-pages.d.ts',
      }),
      // https://github.com/uni-helper/vite-plugin-uni-layouts
      UniHelperLayouts(),
      // https://github.com/uni-helper/vite-plugin-uni-components
      UniHelperComponents({
        dts: 'src/components.d.ts',
        directoryAsNamespace: true,
      }),
      Uni(),
      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: ['vue', '@vueuse/core', 'uni-app'],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/composables', 'src/stores', 'src/utils'],
        vueTemplate: true,
      }),
      // https://github.com/antfu/unocss
      // see unocss.config.ts for config
      UnoCSS(),
    ],
    optimizeDeps: {
      include: ['@dcloudio/uni-ui'],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/, /@dcloudio\/uni-ui/],
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://60.204.222.125:8082',
          changeOrigin: true,
          secure: false,
        },
        '/forum': {
          target: 'http://60.204.222.125:8082',
          changeOrigin: true,
          secure: false,
        },
        '/admin': {
          target: 'http://60.204.222.125:8082',
          changeOrigin: true,
          secure: false,
        },
        '/account': {
          target: 'http://60.204.222.125:8082',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  })
}
