// admin/billingPage.tsx
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

type Transaction = {
  id: number;
  username: string;
  email: string;
  amount: number;
  date: string;
  status: "paid" | "failed" | "pending";
  item_type: string;
  quantity: number;
  subscription_id: string;
  payment_intent_id: string;
};

type Stats = {
  total_revenue: number;
  active_users: number;
  total_users: number;
  monthly_revenue: number;
  avg_revenue_per_user: number;
  paying_users: number;
};

export default function BillingPage() {
  const [stats, setStats] = useState<Stats>({
    total_revenue: 0,
    active_users: 0,
    total_users: 0,
    monthly_revenue: 0,
    avg_revenue_per_user: 0,
    paying_users: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading billing data...");
        const [statsData, transactionsData] = await Promise.all([
          apiFetch("/api/billing/admin/dashboard/"),
          apiFetch("/api/billing/admin/transactions/"),
        ]);

        console.log("Stats data:", statsData);
        console.log("Transactions data:", transactionsData);

        setStats(statsData);
        setTransactions(transactionsData);
      } catch (err) {
        console.error("Failed to load billing data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-500 mb-6">
        Billing Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${stats.total_revenue.toFixed(2)}`}
          icon="💰"
        />
        <StatCard title="Active Users" value={stats.active_users} icon="👥" />
        <StatCard title="Total Users" value={stats.total_users} icon="👤" />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthly_revenue.toFixed(2)}`}
          icon="💰"
        />
        <StatCard title="Paying Users" value={stats.paying_users} icon="💳" />
        <StatCard
          title="Avg Revenue/User"
          value={`$${stats.avg_revenue_per_user.toFixed(2)}`}
          icon="📊"
        />
      </div>

      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-800">
        <h2 className="text-xl font-bold text-red-500 p-4 border-b border-gray-700">
          Recent Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentTransactions && currentTransactions.length > 0 ? (
                currentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800">
                    <td className="px-4 py-3">{tx.username}</td>
                    <td className="px-4 py-3">{tx.email}</td>
                    <td className="px-4 py-3">${tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tx.item_type} x{tx.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {tx.payment_intent_id
                        ? tx.payment_intent_id.slice(0, 8) + "..."
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-white">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-3">
          <button
            className={`px-3 py-1 rounded font-bold ${
              currentPage === 1
                ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ← Prev
          </button>
          <span className="text-white flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={`px-3 py-1 rounded font-bold ${
              currentPage === totalPages
                ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-red-500">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
