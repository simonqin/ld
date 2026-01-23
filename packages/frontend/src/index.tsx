import '@mantine-8/core/styles.css';

// eslint-disable-next-line import/order
import { scan } from 'react-scan'; // react-scan has to be imported before react

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import i18n from './i18n';

// Trigger FE tests
scan({
    enabled: import.meta.env.DEV && REACT_SCAN_ENABLED,
});

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found!');

const root = createRoot(container);

root.render(
    <StrictMode>
        <I18nextProvider i18n={i18n}>
            <App />
        </I18nextProvider>
    </StrictMode>,
);
