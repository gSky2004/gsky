import { createContext, useContext, useEffect, useState } from 'react';
import { wishlistApi } from '../services/gskyApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { show } = useToast();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!user) { setIds([]); return; }
    wishlistApi.mine().then((d) => setIds(d.products.map((p) => p.id))).catch(() => {});
  }, [user?.id]);

  const isSaved = (productId) => ids.includes(productId);

  const toggle = async (productId) => {
    if (!user) {
      show('Please login to save shoes to your wishlist', 'info');
      return false;
    }
    const saved = ids.includes(productId);
    try {
      if (saved) {
        await wishlistApi.remove(productId);
        setIds((p) => p.filter((i) => i !== productId));
        show('Removed from wishlist');
      } else {
        await wishlistApi.add(productId);
        setIds((p) => [...p, productId]);
        show('Added to wishlist 🤍');
      }
      return true;
    } catch (err) {
      show(err.message, 'error');
      return false;
    }
  };

  return (
    <WishlistContext.Provider value={{ ids, isSaved, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
