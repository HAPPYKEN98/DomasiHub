const state = {
    user: null,
    profile: null,
    initialized: false
};

const listeners = new Set();

export function getState() {
    return { ...state };
}

export function setState(updates) {
    Object.assign(state, updates);

    listeners.forEach(listener => {
        try {
            listener(getState());
        } catch (error) {
            console.error('[Domasi Hub] State listener error:', error);
        }
    });
}

export function subscribe(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}