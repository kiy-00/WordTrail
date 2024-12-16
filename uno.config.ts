import { presetUni } from '@uni-helper/unocss-preset-uni'
import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUni(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  rules: [
    // 自定义规则，用于动态背景图片路径
    [/^bgi-\[([\w-]+)\]$/, ([, d]) => ({
      'background-image': `var(--${d})`,
      'background-size': 'cover',
      'background-position': 'center',
      'background-repeat': 'no-repeat',
    })],
    // 自定义毛玻璃样式
    // 自定义毛玻璃样式
    ['frosted-glass', {
      'background-color': 'rgba(255, 255, 255, 0.3)', // 使用 rgba 设置透明度
      'backdrop-filter': 'blur(10px)',
      '-webkit-backdrop-filter': 'blur(10px)',
    }],
    // 新增蓝黑色毛玻璃样式
    ['blue-frosted-glass', {
      'background-color': 'rgba(10, 10, 30, 0.6)', // 蓝黑色半透明背景
      'backdrop-filter': 'blur(10px)',
      '-webkit-backdrop-filter': 'blur(10px)',
    }],
  ],
})
