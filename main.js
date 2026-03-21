import App from './App'
import initUniIdPages from '@/uni_modules/uni-id-pages/init.js'

// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false

initUniIdPages().catch((error) => {
	console.error('initUniIdPages failed', error)
})


App.mpType = 'app'

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {createSSRApp} from 'vue' 
export function createApp() {
	initUniIdPages().catch((error) => {
		console.error('initUniIdPages failed', error)
	})
	const app = createSSRApp(App)
	return {
		app
	}
}
// #endif
