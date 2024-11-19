import { createSSRApp } from 'vue'
import App from './App.vue'
import 'uno.css'
// 引入 UniUI 的样式

import PostCard from '@/pages/community/components/PostCard.vue'
// 导入全局组件
import CommunityHeader from '@/pages/community/components/CommunityHeader.vue'

export function createApp() {
  const app = createSSRApp(App)
  // 全局注册组件
  app.component('CommunityHeader', CommunityHeader)
  app.component('PostCard', PostCard)
  return {
    app,
  }
}
