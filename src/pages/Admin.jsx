import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// ─── Mini Components ─────────────────────────────────────────────────────────

const STATUS_COLORS = {
    pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6',
    shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
};

function KpiCard({ emoji, label, value, color }) {
    return (
        <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: '1 1 180px',
            borderTop: `4px solid ${color}`, minWidth: '160px',
        }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{emoji}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937' }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '500' }}>{label}</div>
        </div>
    );
}

function StatusBadge({ status }) {
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
            background: (STATUS_COLORS[status] || '#9ca3af') + '18',
            color: STATUS_COLORS[status] || '#6b7280',
        }}>
            {status}
        </span>
    );
}

function SectionTitle({ children }) {
    return (
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', marginTop: '0' }}>
            {children}
        </h2>
    );
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function DashboardTab({ data }) {
    if (!data) return <div className="loading-state">Loading dashboard...</div>;
    const { kpis, orders_by_status, revenue_by_store, recent_orders } = data;
    const maxRev = Math.max(...revenue_by_store.map(r => r.revenue), 1);

    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <KpiCard emoji="💰" label="Total Revenue (Paid)" value={`₹${kpis.total_revenue.toLocaleString('en-IN')}`} color="#10b981" />
                <KpiCard emoji="📦" label="Total Orders" value={kpis.total_orders} color="#3b82f6" />
                <KpiCard emoji="👥" label="Registered Users" value={kpis.total_users} color="#8b5cf6" />
                <KpiCard emoji="🍘" label="Products Listed" value={kpis.total_products} color="#f59e0b" />
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Order Status Breakdown */}
                <div style={{ flex: '1 1 280px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <SectionTitle>📊 Orders by Status</SectionTitle>
                    {Object.entries(orders_by_status).map(([status, count]) => (
                        <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <StatusBadge status={status} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '80px', height: '8px', borderRadius: '4px', background: '#f3f4f6', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${Math.min(count / Math.max(kpis.total_orders, 1) * 100, 100)}%`, background: STATUS_COLORS[status] || '#9ca3af', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#374151', width: '24px', textAlign: 'right' }}>{count}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Revenue by Store */}
                <div style={{ flex: '2 1 320px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <SectionTitle>🏪 Revenue by Store (Top 5)</SectionTitle>
                    {revenue_by_store.length === 0 ? <p style={{ color: '#9ca3af' }}>No revenue data yet.</p> : revenue_by_store.map((r, i) => (
                        <div key={r.store} style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{r.store}</span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>₹{r.revenue.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ height: '8px', borderRadius: '4px', background: '#f3f4f6', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(r.revenue / maxRev) * 100}%`, background: `hsl(${140 + i * 30}, 65%, 48%)`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginTop: '24px' }}>
                <SectionTitle>🕐 Recent Orders</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', color: '#6b7280', textAlign: 'left' }}>
                                {['Order ID', 'Customer', 'Store', 'Total', 'Status', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recent_orders.map(o => (
                                <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#374151' }}>#{o.id}</td>
                                    <td style={{ padding: '10px 12px', color: '#374151' }}>{o.user}</td>
                                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{o.store}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#10b981' }}>₹{o.total.toFixed(2)}</td>
                                    <td style={{ padding: '10px 12px' }}><StatusBadge status={o.status} /></td>
                                    <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '12px' }}>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function OrdersTab() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/api/admin/orders').then(r => setOrders(r.data)).finally(() => setLoading(false));
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (e) { alert('Failed to update status'); }
        finally { setUpdating(null); }
    };

    const filtered = orders.filter(o =>
        o.user.toLowerCase().includes(search.toLowerCase()) ||
        o.store.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search)
    );

    if (loading) return <div className="loading-state">Loading orders...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <SectionTitle>📦 All Orders ({orders.length})</SectionTitle>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by customer, store, ID..." style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', width: '280px', outline: 'none' }} />
            </div>
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', color: '#6b7280' }}>
                            {['ID', 'Customer', 'Store', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1f2937' }}>#{o.id}</td>
                                <td style={{ padding: '12px 14px' }}>
                                    <div style={{ fontWeight: '600', color: '#374151' }}>{o.user}</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{o.user_email}</div>
                                </td>
                                <td style={{ padding: '12px 14px', color: '#6b7280' }}>{o.store}</td>
                                <td style={{ padding: '12px 14px', color: '#374151', maxWidth: '160px' }}>
                                    {o.items.map((item, i) => (
                                        <div key={i} style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.product_name} × {item.quantity}
                                        </div>
                                    ))}
                                </td>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10b981', whiteSpace: 'nowrap' }}>₹{o.total_amount.toFixed(2)}</td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                    {o.payment_method.toUpperCase()}<br/>
                                    <span style={{ color: o.payment_status === 'completed' ? '#10b981' : '#f59e0b' }}>{o.payment_status}</span>
                                </td>
                                <td style={{ padding: '12px 14px' }}><StatusBadge status={o.status} /></td>
                                <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                <td style={{ padding: '12px 14px' }}>
                                    <select
                                        value={o.status}
                                        onChange={e => handleStatusChange(o.id, e.target.value)}
                                        disabled={updating === o.id}
                                        style={{ padding: '5px 8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', cursor: 'pointer', background: '#fff' }}
                                    >
                                        {['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No orders found.</p>}
            </div>
        </div>
    );
}

function UsersTable({ role, title, icon }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get(`/api/admin/users?role=${role}`).then(r => setUsers(r.data)).finally(() => setLoading(false));
    }, [role]);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="loading-state">Loading {title.toLowerCase()}...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <SectionTitle>{icon} {title} ({users.length})</SectionTitle>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`🔍 Search ${title.toLowerCase()}...`} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', width: '280px', outline: 'none' }} />
            </div>
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', color: '#6b7280' }}>
                            {['ID', 'Name', 'Email', 'Phone', 'Country', 'Orders', 'Total Spend', 'Joined'].map(h => (
                                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                <td style={{ padding: '12px 14px', color: '#9ca3af' }}>{u.id}</td>
                                <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1f2937' }}>{u.name}</td>
                                <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: '13px' }}>{u.email}</td>
                                <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: '13px' }}>{u.phone || '—'}</td>
                                <td style={{ padding: '12px 14px', color: '#6b7280' }}>{u.country}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#374151' }}>{u.order_count}</td>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10b981' }}>₹{u.total_spend.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No {title.toLowerCase()} found.</p>}
            </div>
        </div>
    );
}

function CustomersTab() {
    return <UsersTable role="customer" title="Customers" icon="🛍️" />;
}

function PartnersTab() {
    return <UsersTable role="store_owner" title="Partners" icon="🏪" />;
}

function ProductsTab() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/admin/products').then(r => setProducts(r.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state">Loading products...</div>;

    const maxRev = Math.max(...products.map(p => p.total_revenue), 1);

    return (
        <div>
            <SectionTitle>📈 Top Products by Revenue</SectionTitle>
            {products.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>No sales data yet. Place some orders to see analytics!</div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {products.map((p, i) => (
                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <span style={{ fontWeight: '800', fontSize: '20px', color: '#e5e7eb', width: '30px', textAlign: 'center' }}>#{i + 1}</span>
                            {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{p.name}</div>
                                <div style={{ height: '6px', borderRadius: '4px', background: '#f3f4f6', overflow: 'hidden', marginBottom: '4px' }}>
                                    <div style={{ height: '100%', width: `${(p.total_revenue / maxRev) * 100}%`, background: `hsl(${140 + i * 15}, 65%, 48%)`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{p.category} · {p.total_qty} units sold</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: '800', color: '#10b981', fontSize: '18px' }}>₹{p.total_revenue.toLocaleString('en-IN')}</div>
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>revenue</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'orders', label: '📦 Orders' },
    { id: 'customers', label: '🛍️ Customers' },
    { id: 'partners', label: '🏪 Partners' },
    { id: 'products', label: '📈 Products' },
];

export default function Admin() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashData, setDashData] = useState(null);

    useEffect(() => {
        if (user && ['store_owner', 'admin'].includes(user.role)) {
            api.get('/api/admin/dashboard').then(r => setDashData(r.data)).catch(console.error);
        }
    }, [user]);

    if (authLoading) return <div className="page-container"><div className="loading-state">Loading...</div></div>;
    if (!user || !['store_owner', 'admin'].includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* Admin Header */}
            <div style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', padding: '32px 40px', color: '#fff' }}>
                <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: '800' }}>🛡️ Admin Portal</h1>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Welcome back, {user.name}. Here's your business at a glance.</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 40px', display: 'flex', gap: '4px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '14px 20px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.id ? '700' : '400',
                            color: activeTab === tab.id ? '#e67e22' : '#6b7280',
                            borderBottom: activeTab === tab.id ? '2px solid #e67e22' : '2px solid transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
                {activeTab === 'dashboard' && <DashboardTab data={dashData} />}
                {activeTab === 'orders' && <OrdersTab />}
                {activeTab === 'customers' && <CustomersTab />}
                {activeTab === 'partners' && <PartnersTab />}
                {activeTab === 'products' && <ProductsTab />}
            </div>
        </div>
    );
}
