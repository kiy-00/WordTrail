import { createSSRApp } from 'vue'
import App from './App.vue'
import 'uno.css'
// 引入 UniUI 的样式

export function createApp() {
  const app = createSSRApp(App)
  return {
    app,
  }
}
