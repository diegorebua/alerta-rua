import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Login from './pages/Login.vue';
import Register from './pages/Register.vue';
import Instructions from './pages/Instructions.vue';
import CreateOccurrence from './pages/CreateOccurrence.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/instructions', component: Instructions },
  { path: '/report', component: CreateOccurrence }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
