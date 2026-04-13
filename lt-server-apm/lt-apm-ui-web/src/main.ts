import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores/pinia'
import { useUiStore } from './stores/ui'

import './styles/tokens.css'
import './styles/base.css'
import './styles/element.css'

const app = createApp(App).use(pinia).use(router).use(ElementPlus)

// Initialize UI store (theme, sidebar state)
const uiStore = useUiStore()
uiStore.init()

app.mount('#app')
