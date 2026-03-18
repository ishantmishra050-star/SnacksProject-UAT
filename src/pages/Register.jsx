import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: 'India' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password, form.phone, form.country);
            navigate('/stores');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Join Us</h2>
                    <p>Create an account to discover vintage Indian snacks</p>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your name" required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Create password" required />
                        <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>Min 8 chars with uppercase, lowercase &amp; number</small>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input type="text" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91-..." />
                        </div>
                        <div className="form-group">
                            <label>Country</label>
                            <select value={form.country} onChange={e => update('country', e.target.value)}>
                                <option value="India">India</option>
                                <option value="USA">USA</option>
                                <option value="UK">UK</option>
                                <option value="Canada">Canada</option>
                                <option value="Australia">Australia</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
