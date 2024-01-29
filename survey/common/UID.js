function uid(length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('');
}

export function uid16() {
    return uid(16);
}
