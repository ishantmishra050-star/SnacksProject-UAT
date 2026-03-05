import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function StorePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToCart, cartCount } = useCart();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [groupedProducts, setGroupedProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [addedId, setAddedId] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get(`/api/stores/${id}`),
            api.get(`/api/products/store/${id}`),
        ]).then(([storeRes, prodsRes]) => {
            setStore(storeRes.data);
            const sortedProds = prodsRes.data;
            setProducts(sortedProds);

            // Group the products by their category
            const grouped = sortedProds.reduce((acc, curr) => {
                const category = curr.product.category || 'Other';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(curr);
                return acc;
            }, {});
            setGroupedProducts(grouped);

        }).catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleAdd = (sp) => {
        if (!user) {
            alert('Please login to add items to cart');
            return;
        }
        const success = addToCart(sp, store.name, store.id, store.region);
        if (success) {
            setAddedId(sp.id);
            setTimeout(() => setAddedId(null), 1200);
        }
    };

    if (loading) return <div className="page-container"><div className="loading-state">Loading store...</div></div>;
    if (!store) return <div className="page-container"><div className="empty-state">Store not found</div></div>;

    return (
        <div className="page-container">
            <div className="store-hero">
                {store.image_url ? (
                    <img src={store.image_url} alt={store.name} className="store-hero-logo" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                ) : (
                    <div className="store-hero-avatar">{store.name.charAt(0)}</div>
                )}
                <div>
                    <h1>{store.name}</h1>
                    <p className="store-hero-meta">
                        📍 {store.city}, {store.region}
                        {store.established_year && <> &bull; Est. {store.established_year}</>}
                        &bull; ⭐ {store.rating}
                        {store.is_verified && <span className="verified-badge">✓ Verified</span>}
                    </p>
                    <p className="store-hero-story">{store.story}</p>
                </div>
            </div>

            <h2 className="section-title">Available Snacks</h2>

            {products.length === 0 ? (
                <div className="empty-state"><p>No products listed yet.</p></div>
            ) : (
                Object.entries(groupedProducts).map(([category, items]) => (
                    <div key={category} className="category-section" style={{ marginBottom: '40px' }}>
                        <h3 className="category-title" style={{ color: 'var(--brand-main)', borderBottom: '2px solid var(--border)', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.5em' }}>{category}s</h3>
                        <div className="product-grid">
                            {items.map(sp => (
                                <div key={sp.id} className="product-card">
                                    <div className="product-card-img-wrap">
                                        <img src={sp.product.image_url} alt={sp.product.name} className="product-card-img" />
                                    </div>
                                    <div className="product-card-body">
                                        <h3>{sp.product.name}</h3>
                                        <span className="product-regional">{sp.product.regional_name}</span>
                                        <p className="product-desc">{sp.product.description}</p>
                                        <div className="product-card-footer">
                                            <div className="product-price">
                                                <span className="price-amount">₹{sp.price}</span>
                                                <span className="price-weight">/ {sp.weight_grams}g</span>
                                            </div>
                                            <button
                                                className={`add-to-cart-btn ${addedId === sp.id ? 'added' : ''} ${!sp.in_stock ? 'disabled' : ''}`}
                                                onClick={() => handleAdd(sp)}
                                                disabled={!sp.in_stock}
                                            >
                                                {!sp.in_stock ? 'Out of Stock' : addedId === sp.id ? '✓ Added!' : '+ Add to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {cartCount > 0 && (
                <Link to="/cart" className="floating-cart-btn">
                    🛒 View Cart ({cartCount})
                </Link>
            )}
        </div>
    );
}
