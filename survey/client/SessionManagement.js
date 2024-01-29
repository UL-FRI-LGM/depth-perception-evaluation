import { uid16 } from '../common/UID.js';

const proxyHandler = {
    set(target, key, value) {
        const ref = Reflect.set(target, key, value);
        saveSession(target);
        return ref;
    }
};

export function saveSession(session) {
    localStorage.setItem('session', JSON.stringify(session));
}

export function loadSession() {
    const session = localStorage.getItem('session');
    if (session) {
        return new Proxy(JSON.parse(session), proxyHandler);
    } else {
        return null;
    }
}

export function createSession() {
    const session = {
        sessionID: uid16(),
        videoIndex: 0,
        replayCount: 0,
        stage: 0,
        demographic: false,
    };
    const proxy = new Proxy(session, proxyHandler);
    saveSession(proxy);
    return proxy;
}

export function beginSession() {
    const session = loadSession();
    return session ?? createSession();
}

export function endSession() {
    localStorage.removeItem('session');
}
