const form =
    document.querySelector(
        '#globalSearchForm'
    );

const input =
    document.querySelector(
        '#globalSearch'
    );


form?.addEventListener(
    'submit',
    event => {

        event.preventDefault();

        const query =
            input?.value
                .trim()
                .slice(0, 80);

        if (!query) {
            input?.focus();
            return;
        }

        window.location.href =
            `marketplace.html?q=${encodeURIComponent(query)}`;
    }
);