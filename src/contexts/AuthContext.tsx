

import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { readMe, registerUser, updateMe, updateUser as sdkUpdateUser, createItem, readItems, updateItem } from '@directus/sdk';
import sdk from '../api/directus';
import { apiFetch } from '../api/elasticEmail';

interface User {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar?: string;
    language?: string;
    status: string;
    role: any;
    last_access?: string;
    email_notifications: boolean;
    theme_dark: boolean;
    theme_light: boolean;
    text_direction: string;
    company?: string;
    website?: string;
    mobile?: string;
    elastickey?: string;
    elasticid?: string;
    isApiKeyUser?: boolean;
    profileId?: string;
    purchasedModules: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    loginWithApiKey: (apiKey: string) => Promise<void>;
    register: (details: any) => Promise<any>;
    logout: () => void;
    updateUser: (data: any) => Promise<void>;
    changePassword: (passwords: { old: string; new: string }) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    createElasticSubaccount: (email: string, password: string) => Promise<any>;
    hasModuleAccess: (moduleName: string) => boolean;
    purchaseModule: (moduleId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // This function ONLY handles fetching and setting a Directus user.
    const getMe = useCallback(async () => {
        try {
            // 1. Get Directus user data
            const me = await sdk.request(readMe({
                fields: [
                    'id', 'first_name', 'last_name', 'email', 'avatar', 'language',
                    'status', 'role.*', 'last_access', 'email_notifications',
                    'theme_dark', 'theme_light', 'text_direction'
                ]
            }));

            // 2. Get the associated user profile from the 'profiles' collection
            const profiles = await sdk.request(readItems('profiles', {
                filter: { user_created: { _eq: me.id } },
                fields: ['id', 'company', 'website', 'mobile', 'elastickey', 'elasticid'],
                limit: 1
            }));
            
            let profileData = profiles?.[0];

            if (!profileData) {
                profileData = await sdk.request(createItem('profiles', { status: 'published', user_created: me.id }));
            }

            // 3. Fetch purchased modules directly from the `profiles_modules` junction collection
            let purchasedModuleIds = new Set<string>();
            if (profileData.id) {
                 const purchasedModulesResponse = await sdk.request(readItems('profiles_modules', {
                    filter: { profile_id: { _eq: profileData.id } },
                    fields: ['module_id'],
                    limit: -1
                }));
                purchasedModuleIds = new Set(purchasedModulesResponse.map((pm: any) => String(pm.module_id)));
            }

            // 4. Get all available modules to map IDs to names
            const allModules = await sdk.request(readItems('modules', { fields: ['id', 'modulename'], limit: -1 }));

            // 5. Map purchased module IDs to module names
            const purchasedModules = allModules
                .filter((module: any) => purchasedModuleIds.has(String(module.id)))
                .map((module: any) => module.modulename);

            // 6. Combine data and set the user state
            const mergedUser: User = {
                ...me,
                ...profileData,
                // Explicitly define required fields from `me` and resolve `id` conflict
                // to satisfy TypeScript when the SDK returns `any` types.
                id: me.id,
                email: me.email,
                status: me.status,
                role: me.role,
                email_notifications: me.email_notifications,
                theme_dark: me.theme_dark,
                theme_light: me.theme_light,
                text_direction: me.text_direction,
                profileId: profileData.id as string,
                purchasedModules,
                isApiKeyUser: false,
            };
            
            setUser(mergedUser);

        } catch (error) {
            console.error("Directus session refresh failed:", error);
            await sdk.logout();
            setUser(null);
        }
    }, []);

    // This function ONLY handles fetching and setting an API Key user.
    const getApiKeyUser = useCallback(async (apiKey: string) => {
         try {
            const accountData = await apiFetch('/account/load', apiKey);
            setUser({
                id: accountData.publicaccountid || `api-user-${apiKey.slice(0, 5)}`,
                email: accountData.email,
                elastickey: apiKey,
                isApiKeyUser: true,
                purchasedModules: [], // API key users have no Directus-managed modules
                first_name: accountData.firstname,
                last_name: accountData.lastname,
                status: 'Active',
                role: { name: 'API User' },
                last_access: new Date().toISOString(),
                email_notifications: false,
                theme_dark: false,
                theme_light: true,
                text_direction: 'ltr',
            });
        } catch (error) {
            console.error("API Key validation failed:", error);
            localStorage.removeItem('elastic_email_api_key');
            setUser(null);
        }
    }, []);

    // On initial app load, determine auth state
    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            const directusToken = await sdk.getToken();
            const apiKey = localStorage.getItem('elastic_email_api_key');

            if (directusToken) {
                await getMe();
            } else if (apiKey) {
                await getApiKeyUser(apiKey);
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        initializeAuth();
    }, [getMe, getApiKeyUser]);
    
    const login = async (credentials: any) => {
        setLoading(true);
        await sdk.login(credentials.email, credentials.password);
        localStorage.removeItem('elastic_email_api_key');
        await getMe();
        setLoading(false);
    };
    
    const loginWithApiKey = async (apiKey: string) => {
        setLoading(true);
        await sdk.logout();
        localStorage.setItem('elastic_email_api_key', apiKey);
        await getApiKeyUser(apiKey);
        setLoading(false);
    };

    const register = async (details: any) => {
        const { email, password, ...otherDetails } = details;
        return await sdk.request(registerUser(email, password, otherDetails));
    };

    const logout = async () => {
        setLoading(true);
        try {
            await sdk.logout();
        } catch (error) {
            console.warn("Directus SDK logout failed, proceeding with client-side cleanup:", error);
        } finally {
            localStorage.removeItem('elastic_email_api_key');
            setUser(null);
            setLoading(false);
        }
    };
    
    const updateUser = async (data: any) => {
        if (!user || !user.id || user.isApiKeyUser) throw new Error("User not authenticated or is an API key user.");

        const userFields = ['first_name', 'last_name', 'avatar', 'language', 'theme_dark', 'theme_light', 'email_notifications', 'text_direction'];
        const profileFields = ['company', 'website', 'mobile', 'elastickey', 'elasticid'];

        const userPayload: any = {};
        const profilePayload: any = {};

        Object.keys(data).forEach(key => {
            if (userFields.includes(key)) userPayload[key] = data[key];
            else if (profileFields.includes(key)) profilePayload[key] = data[key];
        });
        
        const promises = [];
        if (Object.keys(userPayload).length > 0) {
            promises.push(sdk.request(updateMe(userPayload)));
        }
        if (Object.keys(profilePayload).length > 0 && user.profileId) {
            promises.push(sdk.request(updateItem('profiles', user.profileId, profilePayload)));
        }
        
        await Promise.all(promises);
        await getMe(); // Refetch all user data to ensure consistency
    }

    const changePassword = async (passwords: { old: string; new: string }) => {
        if (!user?.id) throw new Error('User not authenticated or ID is missing.');
        await sdk.request(sdkUpdateUser(user.id, { password: passwords.new }));
    };

    const requestPasswordReset = async (email: string) => {
        const reset_url = `${window.location.origin}/#/reset-password`;
        await sdk.request(() => ({
            method: 'POST', path: '/auth/password/request',
            body: JSON.stringify({ email, reset_url }),
            headers: { 'Content-Type': 'application/json' },
        }));
    };

    const resetPassword = async (token: string, password: string) => {
        await sdk.request(() => ({
            method: 'POST', path: '/auth/password/reset',
            body: JSON.stringify({ token, password }),
            headers: { 'Content-Type': 'application/json' },
        }));
    };
    
    const createElasticSubaccount = async (email: string, password: string) => {
        const FLOW_ID = 'ba831cd4-2b5d-494a-aacb-17c934d969a1';
        if (!user || !user.id) throw new Error("Current user not found.");
    
        await sdk.request(() => ({
            method: 'POST', path: `/flows/trigger/${FLOW_ID}`,
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' },
        }));
    
        await new Promise(resolve => setTimeout(resolve, 3000));
        await getMe(); // Re-fetch user data to get new API key
    };

    const hasModuleAccess = (moduleName: string): boolean => {
        const coreModules = ['Dashboard', 'Account', 'Buy Credits'];
        if (coreModules.includes(moduleName)) return true;
        if (user?.isApiKeyUser) return false; // API key users don't have module access
        return user?.purchasedModules.includes(moduleName) ?? false;
    };
    
    const purchaseModule = async (moduleId: string) => {
        const PURCHASE_FLOW_TRIGGER_ID = '3bdc2659-67e7-4fa2-9717-89365b801bef';
        
        try {
            await sdk.request(() => ({
                method: 'POST', path: `/flows/trigger/${PURCHASE_FLOW_TRIGGER_ID}`,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module_id: moduleId }),
            }));

            await new Promise(resolve => setTimeout(resolve, 4000));
            await getMe(); // Refresh user data to reflect new module
        } catch (error: any) {
            console.error('Module purchase failed:', error);
            const errorMessage = error?.errors?.[0]?.message || error.message || 'An unknown error occurred during purchase.';
            throw new Error(errorMessage);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithApiKey,
        register,
        logout,
        updateUser,
        changePassword,
        requestPasswordReset,
        resetPassword,
        createElasticSubaccount,
        hasModuleAccess,
        purchaseModule,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
