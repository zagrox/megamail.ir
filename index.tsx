import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import App from './src/App';
import CenteredMessage from './src/components/CenteredMessage';
import Loader from './src/components/Loader';
import './src/index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <Suspense fallback={<CenteredMessage style={{height: '100vh'}}><Loader /></CenteredMessage>}>
            <I18nextProvider i18n={i18n}>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <App />
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </I18nextProvider>
        </Suspense>
    </React.StrictMode>
);