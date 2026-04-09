import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from './PaymentForm';
import { useCart } from './context/CartContext';
import { useAuth } from '../../day1-auth/client/AuthContext';

// Velox Checkout Page
// Full checkout flow — cart review, coupon, and payment

export default function CheckoutPage() {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [step, setStep] = useState('review'); // review | payment | success
  const [completedOrder, setCompletedOrder] = useState(null);
  const { items, subtotal, discount, total, dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('velox_token');

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');

    const res = await fetch(`/api/coupons/validate?code=${couponCode}&userId=${user._id}`, {
      headers: { Authorization: token }
    });
    const data = await res.json();

    if (data.valid) {
      dispatch({ type: 'SET_COUPON', payload: data.coupon });
    } else {
      setCouponError(data.message || 'Invalid coupon');
    }
    setCouponLoading(false);
  };

  const handlePaymentSuccess = (result) => {
    setCompletedOrder(result);
    setStep('success');
  };

  const handleQtyChange = (itemId, newQty) => {
    if (newQty < 1) {
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    } else {
      dispatch({ type: 'UPDATE_QTY', payload: { id: itemId, qty: newQty } });
    }
  };

  if (step === 'success') {
    return (
      <div className="checkout-success">
        <h2>Payment Successful!</h2>
        <p>Order ID: {completedOrder.orderId}</p>
        <p>Amount: ₹{completedOrder.amount}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <p>Your cart is empty.</p>
        <button onClick={() => navigate('/products')}>Browse Products</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-left">
          {step === 'review' && (
            <div className="cart-review">
              <h3>Order Summary</h3>
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">₹{item.price} each</p>
                  </div>
                  <div className="item-qty">
                    <button onClick={() => handleQtyChange(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => handleQtyChange(item.id, item.qty + 1)}>+</button>
                  </div>
                  <p className="item-total">₹{item.price * item.qty}</p>
                </div>
              ))}

              <div className="coupon-section">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                />
                <button onClick={applyCoupon} disabled={couponLoading}>
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
                {couponError && <p className="error">{couponError}</p>}
              </div>

              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="total-row discount">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => setStep('payment')}
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <button
                className="btn-back"
                onClick={() => setStep('review')}
              >
                ← Back to cart
              </button>
              <PaymentForm onSuccess={handlePaymentSuccess} />
            </div>
          )}
        </div>

        <div className="checkout-right">
          <div className="order-card">
            <h4>Your Order</h4>
            {items.map(item => (
              <div key={item.id} className="mini-item">
                <span>{item.name} x{item.qty}</span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}
            <hr />
            <div className="mini-total">
              <strong>Total: ₹{total}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
