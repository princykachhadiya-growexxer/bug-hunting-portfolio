# Day 3 — "The Feature"

## Your Scenario

Velox's product team wants to launch **payments next week**. The backend is already reviewed and signed off. The frontend team built the entire payment flow over the last sprint using an AI assistant.

Your manager says: **"Backend is fine. Just review the frontend. Tell me if it's safe to ship."**

Your job is to review the frontend payment code carefully. There is at least one critical issue hidden deep that could cause serious harm if it ships.

---

## Files to Review

```
client/hooks/usePayment.js         Payment API hook
client/context/CartContext.jsx     Cart state management
client/PaymentForm.jsx             Card details and submission
client/PaymentHistory.jsx          Transaction history UI
client/CheckoutPage.jsx            Full checkout flow
```

---

## Your Deliverable

1. **Findings list** — every issue with P1/P2/P3 tags
2. **User impact description** — for each issue, describe in plain English what the user actually experiences when that bug fires
   - Example: "If the user's session expires mid-checkout, the payment succeeds on the backend but the frontend shows an error. The user pays twice."

---

## Time

Full day. The CheckoutPage and PaymentForm are the most complex — spend most of your time there.

---

## Hint

The backend is not in scope today. But think about what data is leaving the browser and where it's going.
