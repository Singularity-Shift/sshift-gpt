import React, { useState } from 'react';

const CoinsV1PaymentBox = () => {
  const [coinType, setCoinType] = useState("APT");
  const [multiPayment, setMultiPayment] = useState(false);
  
  // Single payment fields
  const [singleCollectorAddress, setSingleCollectorAddress] = useState("");
  const [singleAmount, setSingleAmount] = useState("");

  // Multi payment fields: an array of { address, amount }
  const [payments, setPayments] = useState([{ address: "", amount: "" }]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (multiPayment) {
      // Validate multi-payment rows
      for (const payment of payments) {
        const amt = Number(payment.amount);
        if (!payment.address) {
          setError("Please enter collector address for all payments.");
          return;
        }
        if (isNaN(amt) || amt <= 0) {
          setError("Please enter a valid amount for each collector.");
          return;
        }
      }
      setError(null);
      setLoading(true);
      try {
        // Simulate API calls for each payment (sequentially for simulation)
        for (const payment of payments) {
          const amt = Number(payment.amount);
          await new Promise(res => setTimeout(res, 500));
          // In a real implementation, you would call the API to process each payment
        }
        alert(`Multi Payments processed for ${coinType}.`);
      } catch (err) {
        setError("Payment failed.");
      }
      setLoading(false);
    } else {
      const numAmount = Number(singleAmount);
      if (!singleCollectorAddress) {
        setError("Please enter a collector address.");
        return;
      }
      if (isNaN(numAmount) || numAmount <= 0) {
        setError("Please enter a valid amount.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        // Simulate API call for single collector payment processing.
        await new Promise(res => setTimeout(res, 1000));
        alert(`Payment processed for ${coinType} to ${singleCollectorAddress} with amount ${numAmount}`);
      } catch (err) {
        setError("Payment failed.");
      }
      setLoading(false);
    }
  };

  const handleAddPayment = () => {
    setPayments([...payments, { address: "", amount: "" }]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: 'address' | 'amount', value: string) => {
    const newPayments = payments.map((payment, i) =>
      i === index ? { ...payment, [field]: value } : payment
    );
    setPayments(newPayments);
  };

  return (
    <div className="p-4 border rounded-xl shadow-lg bg-white">
      <h3 className="text-xl font-bold mb-4">Coins V1 Payment</h3>
      <form onSubmit={handlePayment}>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Coin Type</label>
          <select
            value={coinType}
            onChange={(e) => setCoinType(e.target.value)}
            className="border p-2 w-full rounded mb-2"
          >
            <option value="APT">APT</option>
            <option value="COIN1">Coin1</option>
            <option value="COIN2">Coin2</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={multiPayment}
              onChange={(e) => setMultiPayment(e.target.checked)}
            />
            <span className="ml-2">Enable Multi-Payment</span>
          </label>
        </div>
        {multiPayment ? (
          <div>
            {payments.map((payment, index) => (
              <div key={index} className="mb-4 p-4 border rounded-lg">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collector Address</label>
                  <input
                    type="text"
                    value={payment.address}
                    onChange={(e) => handlePaymentChange(index, 'address', e.target.value)}
                    className="border p-2 w-full rounded"
                    placeholder="Enter collector address"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="text"
                    value={payment.amount}
                    onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                    className="border p-2 w-full rounded"
                    placeholder="Enter amount"
                  />
                </div>
                {payments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePayment(index)}
                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPayment}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded mb-4"
            >
              Add Collector Payment
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Collector Address</label>
              <input
                type="text"
                value={singleCollectorAddress}
                onChange={(e) => setSingleCollectorAddress(e.target.value)}
                className="border p-2 w-full rounded mb-2"
                placeholder="Enter collector address"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="text"
                value={singleAmount}
                onChange={(e) => setSingleAmount(e.target.value)}
                className="border p-2 w-full rounded mb-2"
                placeholder="Enter amount"
              />
            </div>
          </div>
        )}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded" disabled={loading}>
          {loading
            ? "Processing..."
            : multiPayment
              ? `Pay with ${coinType} to multiple collectors`
              : `Pay with ${coinType}`
          }
        </button>
      </form>
    </div>
  );
};

export default CoinsV1PaymentBox; 