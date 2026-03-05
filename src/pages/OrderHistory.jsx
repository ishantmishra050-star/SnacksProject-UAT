import React, { useState, useEffect } from 'react';
import api from '../api';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/orders/')
            .then(res => setOrders(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container"><div className="loading-state">Loading orders...</div></div>;

    return (
        <div className="page-container">
            <h1 className="page-title">📦 My Orders</h1>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h3>No orders yet</h3>
                    <p>Place your first order from a vintage shop!</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-card-header">
                                <div>
                                    <h3>Order #{order.id}</h3>
                                    <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="order-status-badges">
                                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                                    <span className={`status-badge payment-${order.payment_status}`}>{order.payment_status}</span>
                                </div>
                            </div>
                            <div className="order-card-body">
                                <div className="order-items-list">
                                    {order.items.map(item => (
                                        <div key={item.id} className="order-item-row">
                                            <span>Item #{item.store_product_id} × {item.quantity}</span>
                                            <span>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="order-card-footer">
                                <span className="order-payment">💳 {order.payment_method.toUpperCase()}</span>
                                <span className="order-total">Total: ₹{order.total_amount.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
