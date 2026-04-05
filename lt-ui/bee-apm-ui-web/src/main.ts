import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores/pinia'

import './styles/tokens.css'
import './styles/base.css'
import './styles/element.css'

createApp(App).use(pinia).use(router).use(ElementPlus).mount('#app')
