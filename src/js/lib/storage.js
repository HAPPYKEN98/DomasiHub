const PREFIX = 'domasi_hub_';

export const storage = {
    get(key, fallback = null) {
        try {
            const value = localStorage.getItem(`${PREFIX}${key}`);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        localStorage.setItem(
            `${PREFIX}${key}`,
            JSON.stringify(value)
        );
    },

    remove(key) {
        localStorage.removeItem(`${PREFIX}${key}`);
    },

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(PREFIX))
            .forEach(key => localStorage.removeItem(key));
    }
};