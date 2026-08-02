import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const CartSync = () => {
  const { user, token } = useAuth();
  const { load } = useCart();
  const location = useLocation();

  useEffect(() => {
    load(token);
  }, [token, user?.id, location.pathname]);

  return null;
};
