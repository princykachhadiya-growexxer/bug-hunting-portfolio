import { createContext, useContext, useReducer, useEffect } from 'react';

// Velox Cart Context
// Manages cart state and persists to localStorage

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, qty: i.qty + 1 }
              : i
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, qty: 1 }]
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload)
      };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, qty: action.payload.qty }
            : i
        )
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_COUPON':
      return { ...state, coupon: action.payload };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  coupon: null
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, () => {
    const saved = localStorage.getItem('velox_cart');
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem('velox_cart', JSON.stringify(state));
  }, [state]);

  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const discount = state.coupon
    ? subtotal * (state.coupon.discountPct / 100)
    : 0;

  const total = subtotal - discount;

  return (
    <CartContext.Provider value={{
      ...state,
      subtotal,
      discount,
      total,
      dispatch
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
