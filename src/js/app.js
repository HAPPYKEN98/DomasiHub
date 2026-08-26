import { initializeAuth } from './lib/auth-bootstrap.js';

async function boot() {
    try {
        await initializeAuth();

        document.documentElement.dataset.appReady = 'true';

        console.log('[Domasi Hub] Application initialized.');
    } catch (error) {
        console.error('[Domasi Hub] Initialization failed:', error);

        document.documentElement.dataset.appReady = 'error';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}