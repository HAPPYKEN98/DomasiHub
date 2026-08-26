import {
    signIn,
    getCurrentSession
} from '../services/auth.js';


const form =
    document.querySelector('#login-form') ||
    document.querySelector('form');


async function redirectIfAlreadyLoggedIn() {

    const session = await getCurrentSession();

    if (session) {
        window.location.href = 'portal.html';
    }
}


redirectIfAlreadyLoggedIn();


if (!form) {

    console.error(
        '[Domasi Hub] Login form not found.'
    );

} else {

    form.addEventListener('submit', async (event) => {

        event.preventDefault();


        const formData =
            new FormData(form);


        const email =
            String(
                formData.get('email') || ''
            ).trim();


        const password =
            formData.get('password') || '';


        if (!email || !password) {

            showMessage(
                'Please enter your email and password.',
                'error'
            );

            return;
        }


        const submitButton =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );


        try {

            setLoading(
                true,
                submitButton
            );


            await signIn(
                email,
                password
            );


            showMessage(
                'Welcome back to Domasi Hub!',
                'success'
            );


            setTimeout(() => {

                window.location.href =
                    'portal.html';

            }, 500);


        } catch (error) {

            console.error(
                '[Domasi Hub] Login error:',
                error
            );


            let message =
                'Unable to sign in. Please check your credentials.';


            if (
                error?.message
                    ?.toLowerCase()
                    .includes('email not confirmed')
            ) {

                message =
                    'Please confirm your email address before signing in.';

            } else if (
                error?.message
                    ?.toLowerCase()
                    .includes('invalid login credentials')
            ) {

                message =
                    'Incorrect email or password.';
            }


            showMessage(
                message,
                'error'
            );

        } finally {

            setLoading(
                false,
                submitButton
            );
        }
    });
}


function setLoading(
    loading,
    button
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent ||
            button.value ||
            '';


        if ('value' in button) {

            button.value =
                'Signing in...';

        } else {

            button.textContent =
                'Signing in...';
        }

    } else {

        button.disabled = false;

        const original =
            button.dataset.originalText ||
            'Sign in';


        if ('value' in button) {

            button.value =
                original;

        } else {

            button.textContent =
                original;
        }
    }
}


function showMessage(
    message,
    type = 'info'
) {

    let container =
        document.querySelector(
            '#form-message'
        ) ||
        document.querySelector(
            '.form-message'
        ) ||
        document.querySelector(
            '#message'
        );


    if (!container) {

        container =
            document.createElement('div');

        container.id =
            'form-message';

        form.prepend(container);
    }


    container.textContent =
        message;

    container.dataset.type =
        type;

    container.setAttribute(
        'role',
        type === 'error'
            ? 'alert'
            : 'status'
    );
}