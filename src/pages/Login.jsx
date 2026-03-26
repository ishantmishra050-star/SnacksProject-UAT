import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(identifier, password);
            navigate('/stores');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to order from vintage snack shops</p>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email or Phone Number</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            placeholder="you@example.com or 9876543210"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="auth-links" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px' }}>
                    <Link to="/forgot-password">Forgot Password?</Link>
                    <span>Don't have an account? <Link to="/register">Create one</Link></span>
                </div>
            </div>
        </div>
    );
}
