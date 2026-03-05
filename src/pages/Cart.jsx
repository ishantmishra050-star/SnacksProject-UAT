import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman & Nicobar Islands', 'Dadra & Nagar Haveli', 'Lakshadweep',
];

export default function Cart() {
    const { cartItems, cartStoreId, cartStoreRegion, cartSubtotal, cartDiscount, cartGST, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');

    // Address fields (Amazon-style)
    const [address, setAddress] = useState({
        full_name: user?.name || '',
        mobile: '',
        pincode: '',
        flat_building: '',
        area_street: '',
        landmark: '',
        city: '',
        state: '',
        is_default: false
    });

    const [paymentMethod, setPaymentMethod] = useState('');
    const [isGift, setIsGift] = useState(false);
    const [giftMessage, setGiftMessage] = useState('');
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(null);

    useEffect(() => {
        if (user) {
            api.get('/api/users/me/addresses').then(res => {
                setSavedAddresses(res.data);
                if (res.data.length > 0) {
                    const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
                    setSelectedAddressId(defaultAddr.id);
                }
            }).catch(console.error);
        }
    }, [user]);

    const updateAddr = (field, val) => setAddress(prev => ({ ...prev, [field]: val }));

    const isIndia = user?.country?.toLowerCase() === 'india';
    const paymentOptions = isIndia
        ? [{ value: 'cod', label: '🏷️ CASH ON DELIVERY' }, { value: 'card', label: '💳 DEBIT/CREDIT CARD' }, { value: 'upi', label: '📱 UPI' }]
        : [{ value: 'card', label: '💳 CREDIT/DEBIT CARD' }, { value: 'razorpay', label: '🔷 RAZORPAY' }, { value: 'paypal', label: '🅿️ PAYPAL' }];

    // Dynamic GST calculation
    const getSelectedState = () => {
        if (selectedAddressId === 'new') return address.state;
        const a = savedAddresses.find(a => a.id === selectedAddressId);
        return a ? a.state : '';
    };

    const deliveryState = getSelectedState()?.toLowerCase().trim();
    const storeState = cartStoreRegion?.toLowerCase().trim();

    let cgst = 0, sgst = 0, igst = 0;
    if (deliveryState && storeState) {
        if (deliveryState === storeState) {
            cgst = cartGST / 2;
            sgst = cartGST / 2;
        } else {
            igst = cartGST;
        }
    } else {
        // Fallback if no address selected yet
        igst = cartGST;
    }

    const handlePlaceOrder = async () => {
        if (selectedAddressId === 'new') {
            if (!address.full_name.trim()) { setError('Please enter recipient name'); return; }
            if (!address.mobile.trim()) { setError('Please enter mobile number'); return; }
            if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode)) { setError('Please enter a valid 6-digit PIN code'); return; }
            if (!address.flat_building.trim()) { setError('Please enter flat/house no.'); return; }
            if (!address.area_street.trim()) { setError('Please enter area/street'); return; }
            if (!address.city.trim()) { setError('Please enter city'); return; }
            if (!address.state) { setError('Please select a state'); return; }
        }
        if (!paymentMethod) { setError('Please select a payment method'); return; }

        setError('');
        setPlacing(true);
        try {
            // If they used 'new', we save it first
            let finalAddressId = selectedAddressId;
            if (selectedAddressId === 'new') {
                const addrRes = await api.post('/api/users/me/addresses', address);
                finalAddressId = addrRes.data.id;
            }

            const res = await api.post('/api/orders/', {
                store_id: cartStoreId,
                address_id: finalAddressId,
                payment_method: paymentMethod,
                is_gift: isGift,
                gift_message: giftMessage,
                items: cartItems.map(i => ({ store_product_id: i.store_product_id, quantity: i.quantity })),
            });
            setOrderPlaced(res.data);
            clearCart();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to place order');
        } finally {
            setPlacing(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="page-container">
                <div className="order-success">
                    <div className="success-icon">🎉</div>
                    <h2>Order Placed Successfully!</h2>
                    <p>Order #{orderPlaced.id}</p>
                    <div className="order-success-summary">
                        <div className="success-row"><span>Subtotal</span><span>₹{orderPlaced.subtotal.toFixed(2)}</span></div>
                        {orderPlaced.discount_amount > 0 && <div className="success-row discount-row" style={{ color: 'var(--brand-main)' }}><span>Bulk Rate Discount (10%)</span><span>- ₹{orderPlaced.discount_amount.toFixed(2)}</span></div>}
                        {orderPlaced.cgst_amount > 0 && <div className="success-row"><span>CGST (Intra-state)</span><span>₹{orderPlaced.cgst_amount.toFixed(2)}</span></div>}
                        {orderPlaced.sgst_amount > 0 && <div className="success-row"><span>SGST (Intra-state)</span><span>₹{orderPlaced.sgst_amount.toFixed(2)}</span></div>}
                        {orderPlaced.igst_amount > 0 && <div className="success-row"><span>IGST (Inter-state)</span><span>₹{orderPlaced.igst_amount.toFixed(2)}</span></div>}
                        <div className="success-row total"><span>Total</span><span>₹{orderPlaced.total_amount.toFixed(2)}</span></div>
                    </div>
                    {orderPlaced.is_gift && (
                        <div className="gift-confirmation" style={{ marginTop: '20px', padding: '15px', background: 'var(--surface)', border: '1px dashed var(--brand-main)', borderRadius: '8px', textAlign: 'left' }}>
                            <h4 style={{ color: 'var(--brand-main)', marginBottom: '8px' }}>🎁 Heritage Gift Order</h4>
                            <p>A beautifully printed history card of the shop will be included. Prices will be hidden.</p>
                            {orderPlaced.gift_message && <p style={{ fontStyle: 'italic', marginTop: '10px' }}>&ldquo;{orderPlaced.gift_message}&rdquo;</p>}
                        </div>
                    )}
                    <p className="success-status" style={{ marginTop: '20px' }}>Status: {orderPlaced.status} | Payment: {orderPlaced.payment_method} ({orderPlaced.payment_status})</p>
                    <div className="success-actions">
                        <button className="auth-btn" onClick={() => navigate('/orders')}>View My Orders</button>
                        <button className="auth-btn secondary" onClick={() => navigate('/stores')}>Continue Shopping</button>
                    </div>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <span className="empty-icon">🛒</span>
                    <h3>Your cart is empty</h3>
                    <p>Browse our vintage shops to add some delicious snacks!</p>
                    <button className="auth-btn" onClick={() => navigate('/stores')}>Browse Shops</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">🛒 Your Cart</h1>
            <p className="cart-store-name">From: {cartItems[0]?.storeName} ({cartStoreRegion})</p>

            <div className="cart-layout">
                {/* Left — Cart Items */}
                <div className="cart-items">
                    {cartItems.map(item => (
                        <div key={item.store_product_id} className="cart-item">
                            <div className="cart-item-info">
                                <h3>{item.product_name}</h3>
                                <span className="cart-item-weight">{item.weight_grams}g</span>
                                <span className="cart-item-price">₹{item.price}</span>
                                <span className="cart-item-gst">GST {item.gst_rate}%</span>
                            </div>
                            <div className="cart-item-controls">
                                <button className="qty-btn" onClick={() => updateQuantity(item.store_product_id, item.quantity - 1)}>−</button>
                                <span className="qty-value">{item.quantity}</span>
                                <button className="qty-btn" onClick={() => updateQuantity(item.store_product_id, item.quantity + 1)}>+</button>
                                <span className="cart-item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
                                <button className="remove-btn" onClick={() => removeFromCart(item.store_product_id)}>✕</button>
                            </div>
                        </div>
                    ))}

                    {/* Heritage Gifting Section */}
                    <div className="gift-section" style={{ marginTop: '20px', padding: '20px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <label className="gift-toggle" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1em', fontWeight: '500', cursor: 'pointer', color: 'var(--brand-main)' }}>
                            <input type="checkbox" checked={isGift} onChange={e => setIsGift(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                            🎁 Send as a Vintage Heritage Gift
                        </label>
                        {isGift && (
                            <div className="gift-details" style={{ marginTop: '15px' }}>
                                <p style={{ fontSize: '0.9em', color: 'var(--text-light)', marginBottom: '10px' }}>
                                    We will remove the physical invoice and include a beautifully printed Heritage History Card of <strong>{cartItems[0]?.storeName}</strong>.
                                </p>
                                <textarea
                                    value={giftMessage}
                                    onChange={e => setGiftMessage(e.target.value)}
                                    placeholder="Add a personalized message (optional)"
                                    rows="3"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Checkout Panel */}
                <div className="checkout-panel">
                    <h3>Checkout</h3>

                    {/* Price Breakdown */}
                    <div className="cart-summary-row">
                        <span>Subtotal</span><span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    {cartDiscount > 0 && (
                        <div className="cart-summary-row discount-row" style={{ color: 'var(--brand-main)' }}>
                            <span>Bulk Rate Discount (10%)</span><span>- ₹{cartDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    {cgst > 0 && <div className="cart-summary-row gst-row"><span>CGST (Intra-state)</span><span>₹{cgst.toFixed(2)}</span></div>}
                    {sgst > 0 && <div className="cart-summary-row gst-row"><span>SGST (Intra-state)</span><span>₹{sgst.toFixed(2)}</span></div>}
                    {igst > 0 && <div className="cart-summary-row gst-row"><span>IGST (Inter-state)</span><span>₹{igst.toFixed(2)}</span></div>}
                    <div className="cart-summary-row total">
                        <span>Total</span><span>₹{cartTotal.toFixed(2)}</span>
                    </div>

                    {/* Delivery Address — Amazon-style */}
                    <div className="address-section">
                        <h4 className="address-section-title">Delivery Address</h4>

                        {savedAddresses.length > 0 && (
                            <div className="saved-addresses" style={{ marginBottom: '20px' }}>
                                {savedAddresses.map(sa => (
                                    <label key={sa.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', background: selectedAddressId === sa.id ? 'var(--bg-color)' : 'transparent' }}>
                                        <input type="radio" name="address" value={sa.id} checked={selectedAddressId === sa.id} onChange={() => setSelectedAddressId(sa.id)} style={{ marginTop: '4px' }} />
                                        <div>
                                            <strong>{sa.full_name}</strong> {sa.is_default && <span style={{ fontSize: '0.8em', background: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#333' }}>Default</span>}<br />
                                            <span style={{ fontSize: '0.9em', color: 'var(--text-light)' }}>{sa.flat_building}, {sa.area_street}, {sa.city}, {sa.state} - {sa.pincode}</span><br />
                                            <span style={{ fontSize: '0.9em', color: 'var(--text-light)' }}>Phone: {sa.mobile}</span>
                                        </div>
                                    </label>
                                ))}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer' }}>
                                    <input type="radio" name="address" value="new" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')} />
                                    <strong>+ Add a new address</strong>
                                </label>
                            </div>
                        )}

                        {selectedAddressId === 'new' && (
                            <div className="new-address-form">
                                <div className="form-group">
                                    <label>Full Name (First and Last name)</label>
                                    <input type="text" value={address.full_name} onChange={e => updateAddr('full_name', e.target.value)} placeholder="Enter full name" />
                                </div>

                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input type="tel" value={address.mobile} onChange={e => updateAddr('mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                                </div>

                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input type="text" value={address.pincode} onChange={e => updateAddr('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits [0-9] PIN code" maxLength={6} />
                                </div>

                                <div className="form-group">
                                    <label>Flat, House no., Building, Company, Apartment</label>
                                    <input type="text" value={address.flat_building} onChange={e => updateAddr('flat_building', e.target.value)} placeholder="" />
                                </div>

                                <div className="form-group">
                                    <label>Area, Street, Sector, Village</label>
                                    <input type="text" value={address.area_street} onChange={e => updateAddr('area_street', e.target.value)} placeholder="" />
                                </div>

                                <div className="form-group">
                                    <label>Landmark</label>
                                    <input type="text" value={address.landmark} onChange={e => updateAddr('landmark', e.target.value)} placeholder="E.g. near apollo hospital" />
                                </div>

                                <div className="address-row">
                                    <div className="form-group">
                                        <label>Town/City</label>
                                        <input type="text" value={address.city} onChange={e => updateAddr('city', e.target.value)} placeholder="" />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <select value={address.state} onChange={e => updateAddr('state', e.target.value)}>
                                            <option value="">Choose a state</option>
                                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                        <input type="checkbox" checked={address.is_default} onChange={e => updateAddr('is_default', e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
                                        Save as default address
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="form-group">
                        <label>Payment Method {isIndia ? '(India)' : '(International)'}</label>
                        <div className="payment-options">
                            {paymentOptions.map(opt => (
                                <label key={opt.value} className={`payment-option ${paymentMethod === opt.value ? 'selected' : ''}`}>
                                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button className="auth-btn place-order-btn" onClick={handlePlaceOrder} disabled={placing}>
                        {placing ? 'Placing Order...' : `Place Order — ₹${cartTotal.toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
