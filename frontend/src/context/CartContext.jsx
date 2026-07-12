import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('igf_cart') || '[]');
    } catch {
      return [];
    }
  });

  const saveCart = useCallback((newCart) => {
    setCart(newCart);
    localStorage.setItem('igf_cart', JSON.stringify(newCart));
  }, []);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.productId === (product.id || product._id));
      let newCart;
      if (exists) {
        newCart = prev.map((i) =>
          i.productId === (product.id || product._id)
            ? { ...i, quantity: (i.quantity || 1) + 1 }
            : i
        );
      } else {
        newCart = [
          ...prev,
          {
            productId: product.id || product._id,
            productName: product.name,
            productImage: product.image,
            category: product.categoryName || product.category,
            quantity: 1,
          },
        ];
      }
      localStorage.setItem('igf_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => {
      const newCart = prev.filter((i) => i.productId !== productId);
      localStorage.setItem('igf_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem('igf_cart');
    setCart([]);
  }, []);

  const cartCount = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, clearCart, saveCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
