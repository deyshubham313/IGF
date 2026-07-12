import { createContext, useContext, useState, useCallback } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('igf_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const saveWishlist = useCallback((newWishlist) => {
    setWishlist(newWishlist);
    localStorage.setItem('igf_wishlist', JSON.stringify(newWishlist));
  }, []);

  const addToWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const id = product.id || product._id;
      if (prev.find((i) => i.productId === id)) return prev;
      const newList = [
        ...prev,
        {
          productId: id,
          productName: product.name,
          productImage: product.image,
          category: product.categoryName || product.category,
        },
      ];
      localStorage.setItem('igf_wishlist', JSON.stringify(newList));
      return newList;
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist((prev) => {
      const newList = prev.filter((i) => i.productId !== productId);
      localStorage.setItem('igf_wishlist', JSON.stringify(newList));
      return newList;
    });
  }, []);

  const isInWishlist = useCallback(
    (productId) => wishlist.some((i) => i.productId === productId),
    [wishlist]
  );

  const clearWishlist = useCallback(() => {
    localStorage.removeItem('igf_wishlist');
    setWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist, saveWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
