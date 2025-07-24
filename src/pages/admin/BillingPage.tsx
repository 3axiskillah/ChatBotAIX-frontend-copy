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
  subscription_id: string;
};

type Stats = {
  total_revenue: number;
  active_subscribers: number;
  monthly_recurring: number;
  avg_revenue_per_user: number;
};

export default function BillingPage() {
  const [stats, setStats] = useState<Stats>({
    total_revenue: 0,
    active_subscribers: 0,
    monthly_recurring: 0,
    avg_revenue_per_user: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, transactionsData] = await Promise.all([
          apiFetch("/api/billing/admin/dashboard/"),
          apiFetch("/api/billing/admin/transactions/")
        ]);
        
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

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D] mb-6">Billing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.total_revenue.toFixed(2)}`} 
          icon="💰"
        />
        <StatCard 
          title="Active Subscribers" 
          value={stats.active_subscribers} 
          icon="👥"
        />
        <StatCard 
          title="Monthly Recurring" 
          value={`$${stats.monthly_recurring.toFixed(2)}`} 
          icon="🔄"
        />
        <StatCard 
          title="Avg Revenue/User" 
          value={`$${stats.avg_revenue_per_user.toFixed(2)}`} 
          icon="📊"
        />
      </div>

      <div className="bg-[#3A1818] rounded-lg shadow-lg overflow-hidden">
        <h2 className="text-xl font-bold text-[#D1A75D] p-4 border-b border-[#D1A75D]">
          Recent Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#4B1F1F] text-[#E7D8C1]">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1A75D]/20">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#4B1F1F]">
                  <td className="px-4 py-3">{tx.username}</td>
                  <td className="px-4 py-3">{tx.email}</td>
                  <td className="px-4 py-3">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{new Date(tx.date).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'paid' ? 'bg-green-100 text-green-800' :
                      tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#E7D8C1]/70">
                    {tx.subscription_id ? tx.subscription_id.slice(0, 8) + '...' : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-[#3A1818] p-4 rounded-lg border border-[#D1A75D]/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#E7D8C1]/70">{title}</p>
          <p className="text-2xl font-bold text-[#D1A75D]">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}