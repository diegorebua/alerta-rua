import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './index.css';
import { Loader } from '@googlemaps/js-api-loader';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
if (apiKey && apiKey !== 'AIzaSy...') {
  const loader = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places']
  });
  loader.load().then(() => {
    // Maps loaded
  });
}

const app = createApp(App);
app.use(router);
app.mount('#root');
