import Vue from 'vue'
import App from './App.vue'
import store from './store'
import "./index.css"
import vuetify from './plugins/vuetify'
import Router from 'vue-router'
import Routes from './routes'
import VueToastify from "vue-toastify";
import '@fortawesome/fontawesome-free/css/all.css'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

Vue.config.productionTip = false
Vue.use(Router);
Vue.use(VueToastify);
// Vue.component('font-awesome-icon', FontAwesomeIcon)

const router = new Router({
  mode: 'history',
  routes: Routes
})

new Vue({
  store,
  vuetify,
  router,
  icons: {
    iconfont: 'fa',
  },
  render: h => h(App)
}).$mount('#app')
