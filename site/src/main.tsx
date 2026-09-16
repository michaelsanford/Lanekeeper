import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './site.css';
import { SiteApp } from './SiteApp.js';
import { SiteErrorBoundary } from './SiteErrorBoundary.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteErrorBoundary>
      <SiteApp />
    </SiteErrorBoundary>
  </StrictMode>
);
