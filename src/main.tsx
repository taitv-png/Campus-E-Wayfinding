import React from 'react';
import { createRoot } from 'react-dom/client';
import CampusEMap from '../components/CampusEMap';
import '../app/globals.css';
import '../app/kiosk.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><CampusEMap /></React.StrictMode>,
);
