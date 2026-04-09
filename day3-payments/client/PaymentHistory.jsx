import { useState, useEffect } from 'react';
import { usePayment } from './hooks/usePayment';

// Velox Payment History
// Displays paginated transaction history for the current user

export default function PaymentHistory({ userId }) {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refunding, setRefunding] = useState(null);
  const { getPaymentHistory, refundPayment, loading } = usePayment();

  useEffect(() => {
    loadPayments();
  }, [page]);

  const loadPayments = async () => {
    const data = await getPaymentHistory(page);
    setPayments(data.payments);
    setHasMore(data.hasMore);
  };

  const handleRefund = async (paymentId) => {
    const reason = prompt('Reason for refund?');
    if (!reason) return;

    setRefunding(paymentId);
    const result = await refundPayment(paymentId, reason);

    if (result.success) {
      setPayments(payments.map(p =>
        p._id === paymentId ? { ...p, status: 'refunded' } : p
      ));
    } else {
      alert('Refund failed: ' + result.message);
    }
    setRefunding(null);
  };

  const getStatusColor = (status) => {
    const map = {
      success: 'green',
      failed: 'red',
      pending: 'orange',
      refunded: 'gray'
    };
    return map[status] || 'black';
  };

  return (
    <div className="payment-history">
      <h3>Transaction History</h3>

      {loading && !payments.length ? (
        <p>Loading...</p>
      ) : payments.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>₹{p.amount}</td>
                  <td style={{ color: getStatusColor(p.status) }}>{p.status}</td>
                  <td>{p.referenceId}</td>
                  <td>
                    {p.status === 'success' && (
                      <button
                        onClick={() => handleRefund(p._id)}
                        disabled={refunding === p._id}
                        className="btn-sm"
                      >
                        {refunding === p._id ? 'Processing...' : 'Refund'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={!hasMore}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
