import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { translate } from '@/utils/i18n';

// The static <html lang> and <title> in index.html are only the zh-CN
// fallback; the real language is the browser UI language, so stamp both from
// `browser.i18n` before the app mounts (screen readers and font matching read
// `lang`, and a mismatched one is an a11y finding).
document.documentElement.lang = browser.i18n.getUILanguage();
document.title = translate('panel.title');

createApp(App).mount('#app');
