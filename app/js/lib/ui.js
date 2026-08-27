const TOAST_ROOT_ID = 'dh-toast-root';

function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);

    if (!root) {
        root = document.createElement('div');
        root.id = TOAST_ROOT_ID;
        root.className = 'dh-toast-root';
        root.setAttribute('aria-live', 'polite');
        root.setAttribute('aria-atomic', 'true');

        document.body.appendChild(root);
    }

    return root;
}

const icons = {
    success: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6 9 17l-5-5"></path>
        </svg>
    `,

    error: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
            <circle cx="12" cy="12" r="9"></circle>
        </svg>
    `,

    warning: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m10.3 4.2-7.5 13A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8l-7.5-13a2 2 0 0 0-3.4 0Z"></path>
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
        </svg>
    `,

    info: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 11v5"></path>
            <path d="M12 8h.01"></path>
        </svg>
    `
};

export function toast(
    text,
    type = 'info',
    options = {}
) {
    const root = ensureToastRoot();

    const duration =
        Number.isFinite(options.duration)
            ? options.duration
            : 4200;

    const item = document.createElement('div');

    item.className = `dh-toast ${type}`;

    item.setAttribute(
        'role',
        type === 'error'
            ? 'alert'
            : 'status'
    );

    item.innerHTML = `
        <div class="dh-toast-icon">
            ${icons[type] || icons.info}
        </div>

        <div class="dh-toast-content">
            <strong>${options.title || defaultTitle(type)}</strong>
            <span></span>
        </div>

        <button
            type="button"
            class="dh-toast-close"
            aria-label="Dismiss notification"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12"></path>
                <path d="m18 6-12 12"></path>
            </svg>
        </button>

        <div class="dh-toast-progress"></div>
    `;

    item.querySelector('.dh-toast-content span').textContent =
        text;

    root.appendChild(item);

    requestAnimationFrame(() => {
        item.classList.add('is-visible');
    });

    const close = () => {
        item.classList.remove('is-visible');

        setTimeout(() => {
            item.remove();
        }, 220);
    };

    item.querySelector('.dh-toast-close')
        .addEventListener('click', close);

    const timer = setTimeout(close, duration);

    item.addEventListener('mouseenter', () => {
        clearTimeout(timer);
    });

    return close;
}

function defaultTitle(type) {
    switch (type) {
        case 'success':
            return 'Success';

        case 'error':
            return 'Something went wrong';

        case 'warning':
            return 'Check this';

        default:
            return 'Domasi Hub';
    }
}


/*
 * Legacy inline form message.
 * Kept for compatibility with existing pages.
 */

export function message(
    el,
    text,
    type = 'error'
) {
    if (!el) return;

    el.textContent = text;

    el.className =
        `form-message show ${type}`;

    el.setAttribute(
        'role',
        type === 'error'
            ? 'alert'
            : 'status'
    );
}


/*
 * Field validation helpers.
 */

export function setFieldError(
    input,
    text
) {
    if (!input) return;

    const field =
        input.closest('.field');

    if (!field) return;

    field.classList.add('has-error');

    input.setAttribute(
        'aria-invalid',
        'true'
    );

    let error =
        field.querySelector('.field-error');

    if (!error) {
        error =
            document.createElement('p');

        error.className =
            'field-error';

        error.setAttribute(
            'role',
            'alert'
        );

        field.appendChild(error);
    }

    error.textContent = text;

    input.setAttribute(
        'aria-describedby',
        error.id ||
        (() => {
            const id =
                `error-${input.id}`;

            error.id = id;

            return id;
        })()
    );
}


export function clearFieldError(input) {
    if (!input) return;

    const field =
        input.closest('.field');

    if (!field) return;

    field.classList.remove(
        'has-error'
    );

    input.removeAttribute(
        'aria-invalid'
    );

    input.removeAttribute(
        'aria-describedby'
    );

    field
        .querySelector('.field-error')
        ?.remove();
}


export function clearAllFieldErrors(form) {
    if (!form) return;

    form.querySelectorAll(
        'input, textarea, select'
    ).forEach(clearFieldError);
}


/*
 * Button loading state.
 */

export function loading(
    btn,
    on,
    label = 'Working...'
) {
    if (!btn) return;

    if (on) {
        if (!btn.dataset.label) {
            btn.dataset.label =
                btn.textContent.trim();
        }

        btn.disabled = true;

        btn.setAttribute(
            'aria-busy',
            'true'
        );

        btn.innerHTML = `
            <span class="button-spinner"
                  aria-hidden="true"></span>
            <span>${label}</span>
        `;
    } else {
        btn.disabled = false;

        btn.removeAttribute(
            'aria-busy'
        );

        btn.textContent =
            btn.dataset.label ||
            'Continue';
    }
}


export function theme() {

    const root =
        document.documentElement;

    const saved =
        localStorage.getItem(
            'dh-theme'
        );

    const preferred =
        window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches
            ? 'dark'
            : 'light';

    const initial =
        saved || preferred;

    applyTheme(initial);


    document.addEventListener(
        'click',
        event => {

            const toggle =
                event.target.closest(
                    '[data-theme-toggle]'
                );

            if (!toggle) {
                return;
            }

            const current =
                root.dataset.theme ||
                'light';

            applyTheme(
                current === 'dark'
                    ? 'light'
                    : 'dark'
            );
        }
    );


    function applyTheme(mode) {

        root.dataset.theme =
            mode;

        localStorage.setItem(
            'dh-theme',
            mode
        );

        const dark =
            mode === 'dark';

        document
            .querySelectorAll(
                '[data-theme-toggle]'
            )
            .forEach(button => {

                button.setAttribute(
                    'aria-label',
                    dark
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                );

                button.setAttribute(
                    'title',
                    dark
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                );
            });


        const themeColor =
            document.querySelector(
                'meta[name="theme-color"]'
            );

        if (themeColor) {

            themeColor.setAttribute(
                'content',
                dark
                    ? '#0b0f17'
                    : '#635BFF'
            );
        }
    }
}