import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api"; // Adjust path if needed

type Transaction = {
  id: number;
  username: string;
  amount: number;
  date: string;
  status: "paid" | "failed" | "pending";
};

export default function BillingPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    apiFetch("/api/billing/admin/dashboard/", { credentials: "include" })
      .then((data) => {
        setTotalRevenue(data.total_revenue);
        setActiveSubscribers(data.active_subscribers);
        setTransactions(data.transactions);
      })
      .catch((err) => console.error("Failed to load billing dashboard:", err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D]">Billing Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-[#3A1818] p-4 rounded">
          <h2 className="text-[#E7D8C1]">Total Revenue</h2>
          <p className="text-2xl font-bold text-[#D1A75D]">${totalRevenue}</p>
        </div>
        <div className="bg-[#3A1818] p-4 rounded">
          <h2 className="text-[#E7D8C1]">Active Subscribers</h2>
          <p className="text-2xl font-bold text-[#D1A75D]">{activeSubscribers}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#D1A75D] mt-8">Recent Transactions</h2>
      <div className="mt-4 overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#4B1F1F] text-[#E7D8C1] text-left text-sm font-bold">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="bg-[#3A1818] text-[#E7D8C1] hover:bg-[#c49851] hover:text-[#4B1F1F] rounded transition-colors"
              >
                <td className="px-5 py-4">{transaction.username}</td>
                <td className="px-5 py-4">${transaction.amount}</td>
                <td className="px-5 py-4">{new Date(transaction.date).toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      transaction.status === "paid"
                        ? "bg-green-600 text-white"
                        : transaction.status === "failed"
                        ? "bg-red-600 text-white"
                        : "bg-yellow-600 text-white"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[#E7D8C1]">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
