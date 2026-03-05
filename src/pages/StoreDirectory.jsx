import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function StoreDirectory() {
    const [stores, setStores] = useState([]);
    const [search, setSearch] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);

    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (regionFilter) params.region = regionFilter;
        api.get('/api/stores/', { params })
            .then(res => setStores(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search, regionFilter]);

    const handleStateChange = (e) => {
        const state = e.target.value;
        setRegionFilter(state);
        if (state === 'All') {
            setShowPopup(false);
            return;
        }

        const validStates = ['Gujarat', 'Maharashtra', 'Bihar', 'West Bengal', 'Haryana', 'Rajasthan'];
        if (!validStates.includes(state)) {
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 4000);
        } else {
            setShowPopup(false);
        }
    };

    const getBgImage = () => {
        if (regionFilter === 'Gujarat') return '/images/gujarat_bg.png';
        if (regionFilter === 'Maharashtra') return '/images/maharashtra_bg.png';
        if (regionFilter === 'Bihar') return '/images/bihar_bg.png';
        if (regionFilter === 'West Bengal') return '/images/w_bengal_bg.png';
        if (regionFilter === 'Haryana') return '/images/haryana_bg.png';
        if (regionFilter === 'Rajasthan') return '/images/rajasthan_bg.png';
        return '';
    };

    return (
        <div className="page-container store-directory-page" style={{ backgroundImage: `url(${getBgImage()})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh', transition: 'background-image 0.5s ease' }}>
            {showPopup && (
                <div className="coming-soon-popup" style={{
                    position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#fff3cd', color: '#856404', padding: '15px 25px',
                    borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000, fontWeight: 'bold', textAlign: 'center', border: '1px solid #ffeeba'
                }}>
                    🚀 We will be coming soon in your cities!<br />
                    <span style={{ fontSize: '0.9em', fontWeight: 'normal' }}>Till then, please explore our currently open options.</span>
                </div>
            )}

            <div className="page-header" style={getBgImage() ? { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '2rem', borderRadius: '12px' } : {}}>
                <h1>🏪 Vintage Snack Shops</h1>
                <p>Discover legendary shops that have been perfecting their craft for generations</p>
            </div>

            <div className="store-filters">
                <input
                    type="text"
                    className="search-input store-search"
                    placeholder="Search shops by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="filter-dropdown-wrap">
                    <select className="state-select filter-btn" onChange={handleStateChange} value={regionFilter}>
                        <option value="">✨ View All Regions</option>
                        {indianStates.sort().map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading shops...</div>
            ) : stores.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🏪</span>
                    <h3>No shops found</h3>
                </div>
            ) : (
                <div className="store-grid">
                    {stores.map(store => (
                        <Link to={`/stores/${store.id}`} key={store.id} className="store-card" style={getBgImage() ? { backgroundColor: 'rgba(255, 255, 255, 0.95)' } : {}}>
                            <div className="store-card-header">
                                {store.image_url ? (
                                    <img src={store.image_url} alt={store.name} className="store-logo" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="store-avatar">{store.name.charAt(0)}</div>
                                )}
                                <div>
                                    <h3>{store.name}</h3>
                                    <span className="store-location">📍 {store.city}, {store.region}</span>
                                </div>
                            </div>
                            <p className="store-story">{store.story}</p>
                            <div className="store-card-footer">
                                <span className="store-rating">⭐ {store.rating}</span>
                                {store.established_year && (
                                    <span className="store-est">Est. {store.established_year}</span>
                                )}
                                {store.is_verified && <span className="verified-badge">✓ Verified</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
