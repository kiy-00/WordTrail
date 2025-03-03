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
    // optimizeDeps: {
    //   include: ['@dcloudio/uni-ui'],
    // },
    // build: {
    //   commonjsOptions: {
    //     include: [/node_modules/, /@dcloudio\/uni-ui/],
    //   },
    // },
    // server: {
    //   port: 4001, // 添加端口配置
    //   proxy: {
    //     '/auth': {
    //       target: 'http://47.120.51.47:8080', // 后端服务地址
    //       changeOrigin: true, // 跨域时需要设置为 true
    //       rewrite: path => path.replace(/^\/auth/, '/auth'), // 可选，调整路径
    //     },
    //     '/system': {
    //       target: 'http://47.120.51.47:8080', // 后端服务地址
    //       changeOrigin: true, // 跨域时需要设置为 true
    //       rewrite: path => path.replace(/^\/system/, '/system'), // 可选，根据需要调整路径
    //     },
    //     '/user': {
    //       target: 'http://47.120.51.47:8080', // 后端服务地址
    //       changeOrigin: true, // 跨域时需要设置为 true
    //       rewrite: path => path.replace(/^\/user/, '/user'), // 可选，根据需要调整路径
    //     },
    //     '/word': {
    //       target: 'http://47.120.51.47:8080', // 后端服务地址
    //       changeOrigin: true, // 跨域时需要设置为 true
    //       rewrite: path => path.replace(/^\/word/, '/word'), // 可选，根据需要调整路径
    //     },
    //     '/forum': {
    //       target: 'http://47.120.51.47:8080', // 后端服务地址
    //       changeOrigin: true, // 跨域时需要设置为 true
    //       rewrite: path => path.replace(/^\/forum/, '/forum'), // 可选，根据需要调整路径
    //     },
    //   },
    // },
  })
}
