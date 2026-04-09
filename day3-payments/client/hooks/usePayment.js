import { useState } from 'react';

// Velox usePayment hook
// Handles all payment API interactions and state

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  const token = localStorage.getItem('velox_token');

  const initiatePayment = async (paymentData) => {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify(paymentData)
    });

    const data = await res.json();

    if (data.success) {
      setPaymentResult(data);
    } else {
      setError(data.message);
    }

    setLoading(false);
    return data;
  };

  
  const verifyPayment = async (paymentId) => {
    const res = await fetch(`/api/payments/verify/${paymentId}`, {
      headers: { Authorization: token }
    });
    return res.json();
  };

  const getPaymentHistory = async (page = 1) => {
    setLoading(true);
    const res = await fetch(`/api/payments/history?page=${page}`, {
      headers: { Authorization: token }
    });
    const data = await res.json();
    setLoading(false);
    return data;
  };

  const refundPayment = async (paymentId, reason) => {
    const res = await fetch(`/api/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({ reason })
    });
    return res.json();
  };

  return {
    loading,
    error,
    paymentResult,
    initiatePayment,
    verifyPayment,
    getPaymentHistory,
    refundPayment
  };
}
