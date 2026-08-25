export const APP_CONFIG = {
    name: 'Domasi Hub',
    version: '2.0.0',
    environment:
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
            ? 'development'
            : 'production'
};