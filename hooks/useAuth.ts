import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CurrentUser, UserAccount, UserRole, AppView } from '../types';

export const useAuth = () => {
    // --- Theme State ---
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    // --- User Session State ---
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
        try {
            const saved = localStorage.getItem('currentUser');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    const handleLogin = (user: UserAccount, onSuccess: (view: AppView) => void) => {
        const sessionUser: CurrentUser = {
            id: user.id,
            name: user.name,
            role: user.role,
            teamId: user.teamId,
            email: user.email,
            location: user.location,
            avatar: user.avatar
        };
        setCurrentUser(sessionUser);

        let startView: AppView = 'HOME';
        if (user.role === UserRole.COACH || user.role === UserRole.PLAYER) {
            startView = 'TEAMS';
        }
        onSuccess(startView);
    };

    const handleLogout = async (onSuccess: () => void) => {
        // Optimistic Logout: Clear state immediately
        setCurrentUser(null);
        onSuccess();

        try {
            // Attempt to clear server session in background
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout warning (session might be stuck on server):", error);
        }
    };

    const handleUpdateProfile = async (updatedUser: UserAccount) => {
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser({
                ...currentUser,
                name: updatedUser.name,
                location: updatedUser.location,
                avatar: updatedUser.avatar,
                teamId: updatedUser.teamId,
                role: updatedUser.role
            });
        }

        const { error } = await supabase.from('users').update({
            name: updatedUser.name,
            location: updatedUser.location,
            avatar: updatedUser.avatar,
            team_id: updatedUser.teamId
        }).eq('id', updatedUser.id);

        if (error) {
            console.error("Error updating profile in DB:", error);
            throw error;
        }
    };

    return {
        theme,
        toggleTheme,
        currentUser,
        setCurrentUser,
        handleLogin,
        handleLogout,
        handleUpdateProfile
    };
};
