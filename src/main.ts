import { createSSRApp } from 'vue'
import App from './App.vue'
import 'uno.css'
import './uni.scss'

export function createApp() {
  const app = createSSRApp(App)

  return {
    app,
  }
}
