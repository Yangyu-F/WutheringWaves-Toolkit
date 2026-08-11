import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './app/App.vue'
import { router } from './app/router'
import { i18n } from './shared/i18n'
import './features/calculator/styles/tokens.css'
import './features/calculator/styles/toolbar.css'
import './features/calculator/styles/workspace.css'
import './features/calculator/styles/primitives.css'
import './features/calculator/styles/overlays.css'
import './features/calculator/styles/scrollbars.css'
import './features/calculator/styles/panels.css'
import './features/calculator/styles/timeline.css'

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
