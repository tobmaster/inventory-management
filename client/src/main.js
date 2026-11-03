import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './styles/tokens.css'
import './styles/components.css'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Inventory from './views/Inventory.vue'
import Orders from './views/Orders.vue'
import Demand from './views/Demand.vue'
import Spending from './views/Spending.vue'
import Reports from './views/Reports.vue'
import { installUiSounds } from './composables/useSound'

// meta drives the sidebar grouping and the topbar breadcrumb
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard, meta: { titleKey: 'nav.overview', group: 'operations', icon: 'grid' } },
    { path: '/inventory', component: Inventory, meta: { titleKey: 'nav.inventory', group: 'operations', icon: 'box' } },
    { path: '/orders', component: Orders, meta: { titleKey: 'nav.orders', group: 'operations', icon: 'clipboard' } },
    { path: '/demand', component: Demand, meta: { titleKey: 'nav.demandForecast', group: 'operations', icon: 'trend' } },
    { path: '/spending', component: Spending, meta: { titleKey: 'nav.finance', group: 'finance', icon: 'wallet' } },
    { path: '/reports', component: Reports, meta: { titleKey: 'nav.reports', group: 'finance', icon: 'chart' } }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')

installUiSounds()
