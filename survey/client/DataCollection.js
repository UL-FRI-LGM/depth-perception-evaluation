import { serverURL } from './Config.js';

export async function post(data) {
    return await fetch(serverURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data),
    });
}
