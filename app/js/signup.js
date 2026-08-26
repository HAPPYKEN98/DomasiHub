import { signUp } from './lib/auth.js';

import {
    toast,
    loading,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors
} from './lib/ui.js';

import {
    normalizeReg,
    validReg
} from './lib/security.js';


const form =
    document.querySelector('#signupForm');

const button =
    document.querySelector('#signupButton');


if (!form) {
    console.error(
        'Domasi Hub: signup form was not found.'
    );
}


/*
 * Fields
 */

const fields = {
    fullName:
        document.querySelector('#fullName'),

    email:
        document.querySelector('#email'),

    regNumber:
        document.querySelector('#regNumber'),

    whatsapp:
        document.querySelector('#whatsapp'),

    password:
        document.querySelector('#password'),

    confirm:
        document.querySelector('#confirm')
};


/*
 * Registration number formatting
 */

fields.regNumber?.addEventListener(
    'input',
    () => {
        const start =
            fields.regNumber.selectionStart;

        const value =
            normalizeReg(
                fields.regNumber.value
            );

        fields.regNumber.value =
            value;

        if (
            document.activeElement ===
            fields.regNumber
        ) {
            try {
                fields.regNumber.setSelectionRange(
                    start,
                    start
                );
            } catch {}
        }

        if (
            value &&
            validReg(value)
        ) {
            clearFieldError(
                fields.regNumber
            );
        }
    }
);


/*
 * Live field cleanup.
 */

Object.values(fields)
    .filter(Boolean)
    .forEach(input => {

        input.addEventListener(
            'input',
            () => {
                clearFieldError(input);
            }
        );

        input.addEventListener(
            'blur',
            () => {
                validateField(
                    input,
                    false
                );
            }
        );

    });


/*
 * Password strength UI
 */

createPasswordStrength();


fields.password?.addEventListener(
    'input',
    updatePasswordStrength
);


/*
 * Submit
 */

form?.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        clearAllFieldErrors(form);

        const data = getFormData();

        const valid =
            validateForm(data);

        if (!valid) {

            const firstError =
                form.querySelector(
                    '.has-error input, .has-error'
                );

            firstError?.focus();

            toast(
                'Please correct the highlighted fields before continuing.',
                'error',
                {
                    title: 'Check your details'
                }
            );

            return;
        }


        /*
         * Prevent duplicate submissions.
         */

        if (button?.disabled) {
            return;
        }


        try {

            loading(
                button,
                true,
                'Creating account...'
            );


            const result =
                await signUp({
                    email: data.email,
                    password: data.password,
                    fullName: data.fullName,
                    regNumber: data.regNumber,
                    whatsapp: data.whatsapp
                });


            /*
             * Supabase successfully created
             * the Auth account.
             */

            if (!result?.user) {
                throw new Error(
                    'The account could not be created.'
                );
            }


            /*
             * Email confirmation enabled.
             */

            if (!result.session) {

                toast(
                    'Your account has been created. Check your email to verify your account before signing in.',
                    'success',
                    {
                        title: 'Account created',
                        duration: 6500
                    }
                );


                form.reset();

                setTimeout(() => {

                    const params =
                        new URLSearchParams(
                            window.location.search
                        );

                    const next =
                        params.get('next');

                    const destination =
                        isSafeLocalPage(next)
                            ? next
                            : 'signin.html';

                    window.location.href =
                        destination;

                }, 1800);

                return;
            }


            /*
             * Email confirmation disabled.
             * User already has a session.
             */

            toast(
                'Your Domasi Hub account is ready.',
                'success',
                {
                    title: 'Welcome to Domasi Hub',
                    duration: 3500
                }
            );


            setTimeout(() => {

                const params =
                    new URLSearchParams(
                        window.location.search
                    );

                const next =
                    params.get('next');

                const destination =
                    isSafeLocalPage(next)
                        ? next
                        : 'home.html';

                window.location.href =
                    destination;

            }, 900);


        } catch (error) {

            console.error(
                'Domasi Hub signup error:',
                error
            );


            handleSignupError(error);

        } finally {

            loading(
                button,
                false
            );

        }

    }
);


/*
 * Collect form data.
 */

function getFormData() {

    return {
        fullName:
            String(
                fields.fullName?.value || ''
            ).trim(),

        email:
            String(
                fields.email?.value || ''
            ).trim()
            .toLowerCase(),

        regNumber:
            normalizeReg(
                fields.regNumber?.value || ''
            ),

        whatsapp:
            String(
                fields.whatsapp?.value || ''
            ).trim(),

        password:
            String(
                fields.password?.value || ''
            ),

        confirm:
            String(
                fields.confirm?.value || ''
            )
    };
}


/*
 * Complete client-side validation.
 */

function validateForm(data) {

    let valid = true;


    if (
        !data.fullName ||
        data.fullName.length < 2
    ) {

        setFieldError(
            fields.fullName,
            'Enter your full name.'
        );

        valid = false;

    } else if (
        data.fullName.length > 100
    ) {

        setFieldError(
            fields.fullName,
            'Your name is too long.'
        );

        valid = false;
    }


    /*
     * Email
     */

    if (!data.email) {

        setFieldError(
            fields.email,
            'Email address is required.'
        );

        valid = false;

    } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
            data.email
        )
    ) {

        setFieldError(
            fields.email,
            'Enter a valid email address.'
        );

        valid = false;
    }


    /*
     * Registration number
     */

    if (!data.regNumber) {

        setFieldError(
            fields.regNumber,
            'Registration number is required.'
        );

        valid = false;

    } else if (
        !validReg(data.regNumber)
    ) {

        setFieldError(
            fields.regNumber,
            'Use a valid format such as BED/SCI/1234/26.'
        );

        valid = false;
    }


    /*
     * WhatsApp
     */

    if (data.whatsapp) {

        const digits =
            data.whatsapp.replace(
                /\D/g,
                ''
            );

        if (
            digits.length < 9 ||
            digits.length > 15
        ) {

            setFieldError(
                fields.whatsapp,
                'Enter a valid WhatsApp number, including country code.'
            );

            valid = false;
        }
    }


    /*
     * Password
     */

    if (!data.password) {

        setFieldError(
            fields.password,
            'Create a password.'
        );

        valid = false;

    } else if (
        data.password.length < 8
    ) {

        setFieldError(
            fields.password,
            'Use at least 8 characters.'
        );

        valid = false;
    }


    /*
     * Confirmation
     */

    if (!data.confirm) {

        setFieldError(
            fields.confirm,
            'Confirm your password.'
        );

        valid = false;

    } else if (
        data.password !==
        data.confirm
    ) {

        setFieldError(
            fields.confirm,
            'Passwords do not match.'
        );

        valid = false;
    }


    return valid;
}


/*
 * Individual live validation.
 */

function validateField(
    input,
    show = true
) {

    if (!input?.value && !show) {
        return true;
    }

    const id = input.id;

    clearFieldError(input);

    if (
        id === 'fullName' &&
        input.value.trim().length < 2
    ) {

        if (show) {
            setFieldError(
                input,
                'Enter your full name.'
            );
        }

        return false;
    }


    if (
        id === 'email' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
            input.value.trim()
        )
    ) {

        if (show) {
            setFieldError(
                input,
                'Enter a valid email address.'
            );
        }

        return false;
    }


    if (
        id === 'regNumber' &&
        !validReg(
            normalizeReg(
                input.value
            )
        )
    ) {

        if (show) {
            setFieldError(
                input,
                'Use a valid registration number.'
            );
        }

        return false;
    }


    if (
        id === 'password' &&
        input.value.length < 8
    ) {

        if (show) {
            setFieldError(
                input,
                'Use at least 8 characters.'
            );
        }

        return false;
    }


    if (
        id === 'confirm' &&
        input.value !==
        fields.password?.value
    ) {

        if (show) {
            setFieldError(
                input,
                'Passwords do not match.'
            );
        }

        return false;
    }


    return true;
}


/*
 * Convert Supabase/Auth errors into
 * professional user-facing messages.
 */

function handleSignupError(error) {

    const raw =
        String(
            error?.message || ''
        );

    const message =
        raw.toLowerCase();


    /*
     * Duplicate email.
     */

    if (
        message.includes(
            'user already registered'
        ) ||
        message.includes(
            'already registered'
        )
    ) {

        setFieldError(
            fields.email,
            'This email is already registered.'
        );

        toast(
            'This email already has a Domasi Hub account. Sign in instead or use another email.',
            'warning',
            {
                title: 'Account already exists',
                duration: 6000
            }
        );

        fields.email?.focus();

        return;
    }


    /*
     * Invalid email from Auth.
     */

    if (
        message.includes(
            'invalid email'
        )
    ) {

        setFieldError(
            fields.email,
            'Enter a valid email address.'
        );

        toast(
            'Please check the email address and try again.',
            'error',
            {
                title: 'Invalid email'
            }
        );

        fields.email?.focus();

        return;
    }


    /*
     * Weak password.
     */

    if (
        message.includes(
            'password'
        ) &&
        (
            message.includes('weak') ||
            message.includes('short') ||
            message.includes('characters')
        )
    ) {

        setFieldError(
            fields.password,
            'Choose a stronger password.'
        );

        toast(
            'Your password does not meet the minimum security requirements.',
            'error',
            {
                title: 'Password too weak'
            }
        );

        fields.password?.focus();

        return;
    }


    /*
     * Database registration-number
     * constraint.
     */

    if (
        message.includes(
            'invalid domasi college registration number'
        ) ||
        message.includes(
            'profiles_reg_number_format'
        )
    ) {

        setFieldError(
            fields.regNumber,
            'Enter a valid Domasi College registration number.'
        );

        toast(
            'The registration number could not be verified.',
            'error',
            {
                title: 'Invalid registration number'
            }
        );

        fields.regNumber?.focus();

        return;
    }


    /*
     * Duplicate registration number.
     */

    if (
        message.includes(
            'duplicate'
        ) &&
        message.includes(
            'reg_number'
        )
    ) {

        setFieldError(
            fields.regNumber,
            'This registration number is already registered.'
        );

        toast(
            'An account already exists for this registration number.',
            'warning',
            {
                title: 'Student already registered'
            }
        );

        fields.regNumber?.focus();

        return;
    }


    /*
     * Generic fallback.
     *
     * Never expose raw database internals.
     */

    toast(
        'We could not create your account right now. Please check your details and try again.',
        'error',
        {
            title: 'Account creation failed',
            duration: 6000
        }
    );
}


/*
 * Password strength component.
 */

function createPasswordStrength() {

    const field =
        fields.password?.closest('.field');

    if (!field) return;

    if (
        field.querySelector(
            '.password-strength'
        )
    ) {
        return;
    }

    const element =
        document.createElement('div');

    element.className =
        'password-strength';

    element.innerHTML = `
        <div class="password-strength-head">
            <span>Password strength</span>
            <strong data-strength-label>
                —
            </strong>
        </div>

        <div class="password-strength-bar">
            <span data-strength-fill></span>
        </div>

        <ul class="password-rules">
            <li data-rule="length">
                8+ characters
            </li>

            <li data-rule="upper">
                Uppercase letter
            </li>

            <li data-rule="number">
                Number
            </li>

            <li data-rule="symbol">
                Special character
            </li>
        </ul>
    `;

    field.appendChild(element);
}


function updatePasswordStrength() {

    const password =
        fields.password?.value || '';

    const rules = {
        length:
            password.length >= 8,

        upper:
            /[A-Z]/.test(password),

        number:
            /\d/.test(password),

        symbol:
            /[^A-Za-z0-9]/.test(password)
    };

    const score =
        Object.values(rules)
            .filter(Boolean)
            .length;

    const box =
        document.querySelector(
            '.password-strength'
        );

    if (!box) return;

    const label =
        box.querySelector(
            '[data-strength-label]'
        );

    const fill =
        box.querySelector(
            '[data-strength-fill]'
        );


    const labels = [
        '—',
        'Weak',
        'Fair',
        'Good',
        'Strong'
    ];

    label.textContent =
        labels[score];


    box.dataset.level =
        score;


    fill.style.width =
        `${score * 25}%`;


    Object.entries(rules)
        .forEach(
            ([name, passed]) => {

                const rule =
                    box.querySelector(
                        `[data-rule="${name}"]`
                    );

                rule?.classList.toggle(
                    'passed',
                    passed
                );

            }
        );
}


/*
 * Only permit local HTML destinations.
 * Prevents an open redirect.
 */

function isSafeLocalPage(value) {

    if (!value) {
        return false;
    }

    return (
        /^[a-zA-Z0-9_-]+\.html(?:\?.*)?$/
            .test(value)
    );
}