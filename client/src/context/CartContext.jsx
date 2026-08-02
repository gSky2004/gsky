import { createContext, useContext, useCallback, useState } from 'react';
import { cartApi } from '../services/gskyApi';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (token) => {
    if (!token) {
      setItems([]);
      setSubtotal(0);
      setCount(0);
      return;
    }
    try {
      setLoading(true);
      const data = await cartApi.get();
      setItems(data.items);
      setSubtotal(data.subtotal);
      setCount(data.items.reduce((sum, i) => sum + i.quantity, 0));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (payload) => {
    const data = await cartApi.add(payload);
    setItems(data.items);
    setSubtotal(data.subtotal);
    setCount(data.items.reduce((sum, i) => sum + i.quantity, 0));
    return data;
  }, []);

  const updateQty = useCallback(async (id, quantity) => {
    const data = await cartApi.update(id, quantity);
    setItems(data.items);
    setSubtotal(data.subtotal);
    setCount(data.items.reduce((sum, i) => sum + i.quantity, 0));
  }, []);

  const remove = useCallback(async (id) => {
    const data = await cartApi.remove(id);
    setItems(data.items);
    setSubtotal(data.subtotal);
    setCount(data.items.reduce((sum, i) => sum + i.quantity, 0));
  }, []);

  const clear = useCallback(async () => {
    const data = await cartApi.clear();
    setItems(data.items);
    setSubtotal(data.subtotal);
    setCount(0);
  }, []);

  const value = { items, subtotal, count, loading, load, add, updateQty, remove, clear };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
