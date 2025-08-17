



import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { readMe, registerUser, updateMe, updateUser as sdkUpdateUser, createItem, readItems, updateItem } from '@directus/sdk';
import sdk from '../api/directus';
import { apiFetch } from '../api/elasticEmail';
import { DIRECTUS_URL } from '../api/config';

interface AuthContextType {
    user: any | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const getMe = useCallback(async () => {
        setLoading(true);
        try {
            const me = await sdk.request(readMe({ fields: [
                'id', 
                'first_name', 
                'last_name', 
                'email', 
                'avatar',
                'language',
                'status',
                'role.*',
                'last_access',
                'email_notifications',
                'theme_dark',
                'theme_light',
                'text_direction'
            ] }));
            
            let profileData;
            try {
                const profiles = await sdk.request(readItems('profiles', {
                    filter: { user_created: { _eq: me.id } },
                    fields: [
                        'id',
                        'company',
                        'website',
                        'mobile',
                        'elastickey',
                        'elasticid'
                    ],
                    limit: 1
                }));

                if (profiles && profiles.length > 0) {
                    profileData = profiles[0];
                } else {
                    // Create a new profile. Directus will automatically link it to the
                    // current user via the `user_created` system field.
                    profileData = await sdk.request(createItem('profiles', {}));
                }

                // Merge profile data with the main user record. Spreading `me` last ensures
                // that it is the source of truth for any overlapping fields like `first_name`,
                // `last_name`, and `email`, overwriting any default values from the profile.
                const mergedUser = {
                    ...profileData,
                    ...me,
                };
                
                // The user's ID is me.id. We need the profile's ID for updates,
                // so we store it separately.
                mergedUser.profileId = profileData.id;

                setUser(mergedUser);

            } catch (profileError) {
                console.error("Failed to fetch or create user profile. Logging in with base user data.", profileError);
                setUser(me);
            }

        } catch (directusError) {
            try {
                const apiKey = localStorage.getItem('elastic_email_api_key');
                if (apiKey) {
                    const accountData = await apiFetch('/account/load', apiKey);
                    setUser({
                        elastickey: apiKey,
                        first_name: accountData.firstname,
                        email: accountData.email,
                        isApiKeyUser: true,
                    });
                } else {
                    setUser(null);
                }
            } catch (apiKeyError) {
                console.error("Fallback API key authentication failed:", apiKeyError);
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        getMe();
    }, [getMe]);

    const login = async (credentials: any) => {
        await sdk.login(credentials.email, credentials.password);
        await getMe();
    };
    
    const loginWithApiKey = async (apiKey: string) => {
        await apiFetch('/account/load', apiKey);
        localStorage.setItem('elastic_email_api_key', apiKey);
        await getMe();
    };

    const register = async (details: any) => {
        const { email, password, confirm_password, ...otherDetails } = details;
        return await sdk.request(registerUser(email, password, otherDetails));
    };

    const logoutAsync = async () => {
        if (!user?.isApiKeyUser) {
            try {
                await sdk.logout();
            } catch (error) {
                console.warn("Directus SDK logout failed, proceeding with client-side logout:", error);
            }
        }
        localStorage.removeItem('elastic_email_api_key');
        setUser(null);
    };

    const logout = () => {
        logoutAsync().catch(e => console.error("Logout process failed", e));
    }
    
    const updateUser = async (data: any) => {
        if (!user || !user.id || user.isApiKeyUser) throw new Error("User not authenticated or is an API key user.");

        const userFields = ['first_name', 'last_name', 'avatar', 'language', 'theme_dark', 'theme_light', 'email_notifications', 'text_direction'];
        const profileFields = ['company', 'website', 'mobile', 'elastickey', 'elasticid'];

        const userPayload: any = {};
        const profilePayload: any = {};

        Object.keys(data).forEach(key => {
            if (userFields.includes(key)) {
                userPayload[key] = data[key];
            } else if (profileFields.includes(key)) {
                profilePayload[key] = data[key];
            }
        });
        
        const promises = [];
        if (Object.keys(userPayload).length > 0) {
            promises.push(sdk.request(updateMe(userPayload)));
        }
        if (Object.keys(profilePayload).length > 0 && user.profileId) {
            promises.push(sdk.request(updateItem('profiles', user.profileId, profilePayload)));
        }
        
        await Promise.all(promises);
        
        setUser(currentUser => ({ ...currentUser, ...data }));
    }

    const changePassword = async (passwords: { old: string; new: string }) => {
        if (!user?.id) {
            throw new Error('User not authenticated or ID is missing.');
        }

        const payload = {
            password: passwords.new,
        };

        await sdk.request(sdkUpdateUser(user.id, payload));
    };

    const requestPasswordReset = async (email: string) => {
        const payload = {
            email,
            reset_url: 'https://my.mailzila.com/#/reset-password',
        };
        await sdk.request(() => ({
            method: 'POST',
            path: '/auth/password/request',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    };

    const resetPassword = async (token: string, password: string) => {
        const payload = {
            token,
            password,
        };
        await sdk.request(() => ({
            method: 'POST',
            path: '/auth/password/reset',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    };
    
    const createElasticSubaccount = async (email: string, password: string) => {
        const FLOW_ID = 'ba831cd4-2b5d-494a-aacb-17c934d969a1';
        const currentUser = user;
        if (!currentUser || !currentUser.id) {
            throw new Error("Current user not found, cannot start account creation flow.");
        }
    
        // Trigger the flow
        await sdk.request(() => ({
            method: 'POST',
            path: `/flows/trigger/${FLOW_ID}`,
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' },
        }));
    
        // Wait for a moment to allow the async flow to complete and write data.
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Refetch the user's profile to verify the outcome of the flow.
        const profiles = await sdk.request(readItems('profiles', {
            filter: { user_created: { _eq: currentUser.id } },
            limit: 1
        }));
    
        if (!profiles || profiles.length === 0) {
            throw new Error("User profile not found after account creation flow.");
        }
    
        const newProfile = profiles[0];
        const newApiKey = newProfile.elastickey;
    
        // Check if the key is a valid string. The failing flow writes an object.
        if (typeof newApiKey !== 'string' || newApiKey.length < 20) { // API keys are usually long.
            if (typeof newApiKey === 'object' && newApiKey !== null && (newApiKey as any).error) {
                // Provide a specific error message if the flow returned one.
                throw new Error(`Account setup failed on the server: ${(newApiKey as any).error}`);
            }
            // Provide a generic but helpful error message.
            throw new Error("Failed to create and retrieve a valid API key from the server. Please contact support.");
        }
    
        // If the key is valid, refresh the user state for the whole app.
        await getMe();
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