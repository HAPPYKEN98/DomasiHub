export function escapeHTML(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function normalizeText(value, maxLength = 500) {
    return String(value ?? '')
        .trim()
        .slice(0, maxLength);
}

export function normalizeRegistrationNumber(value) {
    return String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
}

export function isValidRegistrationNumber(value) {
    const normalized = normalizeRegistrationNumber(value);

    return /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i.test(
        normalized
    );
}