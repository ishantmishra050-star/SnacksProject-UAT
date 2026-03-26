import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/api/auth/me')
                .then(res => setUser(res.data))
                .catch(() => { localStorage.removeItem('token'); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (identifier, password) => {
        const res = await api.post('/api/auth/login', { identifier, password });
        localStorage.setItem('token', res.data.access_token);
        const me = await api.get('/api/auth/me');
        setUser(me.data);
        return me.data;
    };

    const register = async (name, email, password, phone, country) => {
        await api.post('/api/auth/register', { name, email, password, phone, country });
        return login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
