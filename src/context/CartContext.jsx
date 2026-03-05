import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [cartStoreId, setCartStoreId] = useState(null);
    const [cartStoreRegion, setCartStoreRegion] = useState(null);

    const addToCart = (storeProduct, storeName, storeId, storeRegion) => {
        // Only allow items from one store at a time
        if (cartStoreId && cartStoreId !== storeId) {
            if (!window.confirm('Your cart has items from another store. Clear cart and add this item?')) {
                return false;
            }
            setCartItems([]);
        }
        setCartStoreId(storeId);
        if (storeRegion) setCartStoreRegion(storeRegion);

        setCartItems(prev => {
            const existing = prev.find(i => i.store_product_id === storeProduct.id);
            if (existing) {
                return prev.map(i =>
                    i.store_product_id === storeProduct.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, {
                store_product_id: storeProduct.id,
                product_name: storeProduct.product.name,
                price: storeProduct.price,
                weight_grams: storeProduct.weight_grams,
                gst_rate: storeProduct.product.gst_rate || 12,
                quantity: 1,
                storeName,
            }];
        });
        return true;
    };

    const removeFromCart = (storeProductId) => {
        setCartItems(prev => prev.filter(i => i.store_product_id !== storeProductId));
    };

    const updateQuantity = (storeProductId, quantity) => {
        if (quantity <= 0) return removeFromCart(storeProductId);
        setCartItems(prev =>
            prev.map(i => i.store_product_id === storeProductId ? { ...i, quantity } : i)
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setCartStoreId(null);
        setCartStoreRegion(null);
    };

    const cartSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // 10% Bulk Order Discount if subtotal > 1500
    const cartDiscount = cartSubtotal > 1500 ? cartSubtotal * 0.10 : 0;
    const discountedSubtotal = cartSubtotal - cartDiscount;

    // Prorate discount across items for accurate GST calculation
    const cartGST = cartItems.reduce((sum, i) => {
        const lineTotal = i.price * i.quantity;
        const proratedDiscount = cartSubtotal > 0 ? cartDiscount * (lineTotal / cartSubtotal) : 0;
        const discountedLineTotal = lineTotal - proratedDiscount;
        return sum + (discountedLineTotal * i.gst_rate / 100);
    }, 0);

    const cartTotal = discountedSubtotal + cartGST;
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems, cartStoreId, cartStoreRegion, cartSubtotal, cartDiscount, cartGST, cartTotal, cartCount,
            addToCart, removeFromCart, updateQuantity, clearCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
