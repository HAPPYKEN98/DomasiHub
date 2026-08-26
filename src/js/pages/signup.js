import { signUpStudent } from '../services/auth.js';
import {
    normalizeRegistrationNumber,
    isValidRegistrationNumber,
    normalizeText
} from '../lib/security.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    if (!form) {
        console.error('[Domasi Hub] Signup form not found in DOM.');
        return;
    }

    console.log('[Domasi Hub] Signup controller attached to form:', form);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('[Domasi Hub] Signup form submit triggered.');

        const submitButton =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

        const formData = new FormData(form);

        const fullName = normalizeText(
            formData.get('fullName') ||
            formData.get('name') ||
            '',
            100
        );

        const email = normalizeText(
            formData.get('email') || '',
            150
        );

        const password = formData.get('password') || '';

        const confirmPassword =
            formData.get('confirmPassword') ||
            formData.get('confirm_password') ||
            '';

        const registrationNumber =
            normalizeRegistrationNumber(
                formData.get('registrationNumber') ||
                formData.get('reg_number') ||
                formData.get('regNumber') ||
                ''
            );

        const whatsappNumber = normalizeText(
            formData.get('whatsappNumber') ||
            formData.get('whatsapp') ||
            '',
            30
        );

        console.log('[Domasi Hub] Parsed form data:', {
            fullName,
            email,
            registrationNumber,
            whatsappNumber,
            passwordLength: password.length
        });

        if (!fullName) {
            showMessage('Please enter your full name.', 'error');
            return;
        }

        if (!email) {
            showMessage('Please enter your email address.', 'error');
            return;
        }

        if (!isValidRegistrationNumber(registrationNumber)) {
            showMessage(
                'Please enter a valid Domasi College registration number (e.g. BED/SCI/1234/26).',
                'error'
            );
            return;
        }

        if (password.length < 8) {
            showMessage(
                'Your password must contain at least 8 characters.',
                'error'
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            setLoading(true, submitButton);

            const result = await signUpStudent({
                email,
                password,
                fullName,
                registrationNumber,
                whatsappNumber
            });

            if (result.session) {
                showMessage(
                    'Account created successfully. Welcome to Domasi Hub!',
                    'success'
                );
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showMessage(
                    'Account created! Please check your email to confirm your account before signing in.',
                    'success'
                );
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2500);
            }
        } catch (error) {
            console.error('[Domasi Hub] Signup submission error:', error);
            let message =
                error?.message ||
                'Unable to create your account. Please try again.';

            if (message.toLowerCase().includes('already registered')) {
                message = 'An account with this email already exists.';
            }

            showMessage(message, 'error');
        } finally {
            setLoading(false, submitButton);
        }
    });
});

function setLoading(loading, button) {
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent || button.value || '';
        if ('value' in button) {
            button.value = 'Creating account...';
        } else {
            button.textContent = 'Creating account...';
        }
    } else {
        button.disabled = false;
        const original = button.dataset.originalText || 'Create account';
        if ('value' in button) {
            button.value = original;
        } else {
            button.textContent = original;
        }
    }
}

function showMessage(message, type = 'info') {
    const form = document.querySelector('form');
    let container =
        document.querySelector('#form-message') ||
        document.querySelector('.form-message') ||
        document.querySelector('#message');

    if (!container && form) {
        container = document.createElement('div');
        container.id = 'form-message';
        container.style.padding = '10px';
        container.style.marginBottom = '15px';
        container.style.borderRadius = '5px';
        container.style.fontSize = '14px';
        form.prepend(container);
    }

    if (container) {
        container.textContent = message;
        container.dataset.type = type;
        container.style.background = type === 'error' ? '#ffe6e6' : '#e6f4ea';
        container.style.color = type === 'error' ? '#c5221f' : '#137333';
        container.setAttribute(
            'role',
            type === 'error' ? 'alert' : 'status'
        );
    }
}