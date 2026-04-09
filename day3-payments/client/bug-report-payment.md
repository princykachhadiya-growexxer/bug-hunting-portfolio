# Bug Report — P1 / P2 / P3 Issues and User Impact

---

## 🔴 P1 Breakages (Critical)

### 1. Credit Card Details Sent in Plain Text

Card details (number, CVV) are sent directly to the backend without encryption. The input type is also `text`, allowing any string with no validation.

```js
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
```

**User Impact:** If the backend is ever hacked, full card information and CVV can be stolen and used to commit fraud.

---

### 2. Auth Token Stored in `localStorage`

The authentication token is stored in `localStorage`, making it accessible to any JavaScript running on the page.

**User Impact:** Attackers can steal the token and use it for session hijacking or unauthorized actions.

---

### 3. Token Theft Leading to Account Takeover + Missing Null Check

Because the token is in `localStorage`, it can be stolen from a compromised page. Additionally, `user` is not null-checked before use.

```js
const { user } = useAuth();

const paymentData = {
  userId: user._id,   // crashes if user is null
  amount: total,
  currency: 'INR',
  ...
};
```

**User Impact:** A user visiting a hacked page can have their token stolen, their account taken over, and their payments misused.

---

### 4. No Server-Side Amount Validation

The `amount` field is taken directly from the client. Attackers can intercept the network request and modify it.

```js
const paymentData = {
  userId: user._id,
  amount: total,     // attacker can change this value
  currency: 'INR',
  card: { ... }
};
```

**Fix:** Recalculate the total on the server side from the cart using valid product prices.

**User Impact:** A bad actor can pay less than the actual price — effectively stealing products.

---

### 5. Refund Endpoint Has No Ownership Verification

The refund button is only hidden in the UI for non-successful payments, but there is no server-side check that the `paymentId` belongs to the authenticated user.

```js
{p.status === 'success' && (
  <button
    onClick={() => handleRefund(p._id)}
    disabled={refunding === p._id}
    className="btn-sm"
  >
)}

const refundPayment = async (paymentId, reason) => {
  const res = await fetch(`/api/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify({ reason })
  });
};
```

**User Impact:** An unauthenticated or malicious user can request a refund for someone else's payment.

---

### 6. Refund Reason Sent Without Sanitization

The refund reason is passed to the backend without any validation or sanitization.

```js
const handleRefund = async (paymentId) => {
  const reason = prompt('Reason for refund?');
  if (!reason) return;

  setRefunding(paymentId);
  const result = await refundPayment(paymentId, reason);

  if (result.success) {
    setPayments(payments.map(p => ...));
  } else {
    alert('Refund failed: ' + result.message);
  }
};
```

**Fix:** Sanitize and validate the `reason` field on the server before processing.

**User Impact:** A malicious user can inject harmful scripts or unexpected data, potentially corrupting records or escalating privileges.

---

### 7. No Error Handling on API Calls

API calls are made without `try/catch` blocks.

```js
const res = await fetch(`/api/...`, {
  headers: { Authorization: token }
});
const data = await res.json();
```

**Fix:** Wrap all API calls with `try/catch`.

**User Impact:** If the network fails, the app may crash or show undefined behaviour.

---

## 🟠 P2 Breakages (High)

### 1. Payment Success Based on Frontend Response Only

After `initiatePayment`, the UI acts on the response directly without calling `verifyPayment` to confirm with the payment gateway.

```js
const result = await initiatePayment(paymentData);

if (result.success) {
  dispatch({ type: 'CLEAR_CART' });
  onSuccess(result);
} else {
  setError(result.message || 'Payment failed');
}
```

**User Impact:** The UI may show "Payment Successful" even if the payment never went through on the gateway.

---

### 2. Coupon Validation Leaks `userId` in URL

The coupon validation API call includes `userId` as a query parameter.

```js
const res = await fetch(
  `/api/coupons/validate?code=${couponCode}&userId=${user._id}`,
  { headers: { Authorization: token } }
);
const data = await res.json();
```

**Fix:** Use POST request body, or extract `userId` from the authenticated token server-side.

**User Impact:** User ID may leak through browser history, server logs, or referrer headers.

---

### 3. Refund Status Not Refreshed from Server

After a successful refund, the state is updated locally instead of re-fetching from the server.

```js
if (result.success) {
  setPayments(payments.map(p =>
    p._id === paymentId ? { ...p, status: 'refunded' } : p
  ));
} else {
  alert('Refund failed: ' + result.message);
}
```

**Fix:** Call `loadPayments()` after a successful refund to sync with the server.

**User Impact:** The user sees a stale status and may think the refund didn't work.

---

### 4. No Idempotency Key on Payment Submission

Every payment submission creates a new request without a unique identifier, so the backend cannot distinguish a genuine retry from a duplicate charge.

```jsx
<button
  onClick={handleSubmit}
  className="btn-primary btn-pay"
  disabled={loading}
>
  {loading ? 'Processing...' : `Pay ₹${total}`}
</button>
```

**User Impact:** If the network drops, the user refreshes, or double-clicks the button, they can be charged multiple times for the same order.

---

## 🟡 P3 Breakages (Medium)

### 1. No Validation on Billing Address

```jsx
<input
  type="text"
  value={billingAddress}
  onChange={e => setBillingAddress(e.target.value)}
  placeholder="Street, City, PIN"
/>
```

**User Impact:** Users can submit incomplete or invalid addresses, leading to delivery or payment failures.

---

### 2. Expiry Date Has No Validation

The expiry date input is of type `text` with no format enforcement.

**User Impact:** Users can enter an incorrect or malformed expiry date, causing payment failures.

---

### 3. Discount Amount Not Shown in Order Summary

The order summary only displays the final total with no breakdown.

```jsx
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
```

**Fix:** Show the original subtotal, coupon discount, and final total separately.

**User Impact:** Users see a changed total with no explanation — confusing and erodes trust.

---

### 4. Cart Persists Across Users via `localStorage`

The cart is stored in `localStorage` without being scoped to a user ID.

```js
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, () => {
    const saved = localStorage.getItem('velox_cart');
    return saved ? JSON.parse(saved) : initialState;
  });
}
```

**Fix:** Clear `localStorage` on logout.

**User Impact:** If a second user logs in on the same browser tab, they can see the previous user's cart items.

---
