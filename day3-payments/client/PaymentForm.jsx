import { useState } from 'react';
import { usePayment } from './hooks/usePayment';
import { useCart } from './context/CartContext';
import { useAuth } from '../../day1-auth/client/AuthContext';

// Velox Payment Form
// Handles card details and payment submission

export default function PaymentForm({ onSuccess }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [error, setError] = useState('');
  const { initiatePayment, loading } = usePayment();
  const { total, items, dispatch } = useCart();
  const { user } = useAuth();

  const handleSubmit = async () => {
    setError('');

    if (!cardNumber || !cardName || !expiry || !cvv) {
      setError('All card fields are required');
      return;
    }

    const paymentData = {
      userId: user._id,
      amount: total,
      currency: 'INR',
      card: {
        number: cardNumber,
        name: cardName,
        expiry: expiry,
        cvv: cvv
      },
      billingAddress,
      items: items.map(i => ({ id: i.id, qty: i.qty, price: i.price }))
    };

    const result = await initiatePayment(paymentData);

    if (result.success) {
      dispatch({ type: 'CLEAR_CART' });
      onSuccess(result);
    } else {
      setError(result.message || 'Payment failed');
    }
  };

  const formatCardNumber = (val) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="payment-form">
      <h3>Payment Details</h3>
      <p className="total-display">Total: ₹{total}</p>

      {error && <div className="error-msg">{error}</div>}

      <div className="form-group">
        <label>Card Number</label>
        <input
          type="text"
          value={formatCardNumber(cardNumber)}
          onChange={e => setCardNumber(e.target.value.replace(/\s/g, ''))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
      </div>

      <div className="form-group">
        <label>Name on Card</label>
        <input
          type="text"
          value={cardName}
          onChange={e => setCardName(e.target.value)}
          placeholder="Full name"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Expiry (MM/YY)</label>
          <input
            type="text"
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>
        <div className="form-group">
          <label>CVV</label>
          <input
            type="text"
            value={cvv}
            onChange={e => setCvv(e.target.value)}
            placeholder="123"
            maxLength={4}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Billing Address</label>
        <input
          type="text"
          value={billingAddress}
          onChange={e => setBillingAddress(e.target.value)}
          placeholder="Street, City, PIN"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="btn-primary btn-pay"
        disabled={loading}
      >
        {loading ? 'Processing...' : `Pay ₹${total}`}
      </button>

      <p className="security-note">🔒 Secured by Velox Payments</p>
    </div>
  );
}
