import '@fontsource/be-vietnam-pro/400.css';import '@fontsource/be-vietnam-pro/500.css';import '@fontsource/be-vietnam-pro/600.css';import '@fontsource/be-vietnam-pro/700.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import '../app/kiosk.css';
import '../app/theme.css';
import '../app/intro.css';
import '../app/room-names.css';
import '../app/language.css';

// Set the language before importing map modules, which initialize localized room data.
const language = new URL(window.location.href).searchParams.get('lang') === 'vi' ? 'vi' : 'en';
document.documentElement.lang = language;
document.querySelector('meta[name="description"]')?.setAttribute('content', language === 'vi'
  ? 'Bản đồ chỉ đường và tham quan 3D Cơ sở E, Technology Convergence Hub, UEH.'
  : 'Interactive 3D wayfinding and room tours for Campus E, Technology Convergence Hub, UEH.');

void import('../components/WayfindingApp').then(({ default: WayfindingApp }) => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode><WayfindingApp /></React.StrictMode>,
  );
});
