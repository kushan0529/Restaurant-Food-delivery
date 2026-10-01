import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const KEY = 'cart';

export function CartProvider({ children }) {
  // each item: { menuItemId, name, variant, price, quantity }
  // price here is for display only; the server recalculates it
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v) setItems(JSON.parse(v)); })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem = (menuItem, variant) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => x.menuItemId === menuItem._id && x.variant === variant.label);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: copy[i].quantity + 1 };
        return copy;
      }
      return [...prev, {
        menuItemId: menuItem._id,
        name: menuItem.name,
        variant: variant.label,
        price: variant.price,
        quantity: 1,
      }];
    });

  const changeQty = (menuItemId, variant, delta) =>
    setItems((prev) =>
      prev
        .map((x) => (x.menuItemId === menuItemId && x.variant === variant ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0)
    );

  const clearCart = () => setItems([]);
  const total = items.reduce((s, x) => s + x.price * x.quantity, 0);
  const count = items.reduce((s, x) => s + x.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, changeQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);