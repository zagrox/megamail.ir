import { createDirectus, rest, authentication, AuthenticationStorage, AuthenticationData } from '@directus/sdk';
import { DIRECTUS_URL } from './config';

// The Directus SDK expects a storage object with get and set methods.
// We'll create a simple adapter for window.localStorage.
const storage: AuthenticationStorage = {
    get: () => {
        const data = window.localStorage.getItem('directus_storage');
        try {
            return data ? (JSON.parse(data) as AuthenticationData) : null;
        } catch {
            return null;
        }
    },
    set: (value) => {
        if (value) {
            window.localStorage.setItem('directus_storage', JSON.stringify(value));
        } else {
            window.localStorage.removeItem('directus_storage');
        }
    },
};

// Create a client with REST and Authentication modules
const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication('json', { storage }));

export default directus;