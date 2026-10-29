import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    activeSystem: 'PAKKA' | 'GODOWN';
    loginStore: (user: User, token: string) => void;
    logoutStore: () => void;
    setActiveSystem: (system: 'PAKKA' | 'GODOWN') => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            activeSystem: 'PAKKA',
            loginStore: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, activeSystem: user.role === 'GODOWN' ? 'GODOWN' : 'PAKKA' });
            },
            logoutStore: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, activeSystem: 'PAKKA' });
            },
            setActiveSystem: (system) => set({ activeSystem: system }),
            isAuthenticated: () => !!get().token,
        }),
        {
            name: 'auth-storage', // unique name
        }
    )
);
