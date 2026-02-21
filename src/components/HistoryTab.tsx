import { Transaction } from '../types'

interface HistoryTabProps {
  transactions: Transaction[]
}

export default function HistoryTab({ transactions }: HistoryTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-black text-white italic tracking-tighter border-b border-green-500/20 pb-4">NODE_TELEMETRY</h2>
      <div className="bg-[#050505]/80 rounded-sm border border-green-500/10 overflow-hidden neon-border">
        <table className="w-full font-mono text-[10px]">
          <thead>
            <tr className="bg-green-500/5 border-b border-green-500/10">
              <th className="text-left px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Timestamp</th>
              <th className="text-left px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Category</th>
              <th className="text-left px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Operation</th>
              <th className="text-right px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Delta</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice().reverse().map(tx => (
              <tr key={tx.id} className="border-b border-green-500/5 hover:bg-green-500/5 transition-colors group">
                <td className="px-6 py-4 text-zinc-500 group-hover:text-zinc-300">{new Date(tx.timestamp).toLocaleString().toUpperCase()}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-sm font-black tracking-tighter ${tx.type === 'task_reward' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === 'task_reward' ? 'INFLOW' : 'OUTFLOW'}
                    </span>
                </td>
                <td className="px-6 py-4 text-zinc-300 font-bold uppercase tracking-tighter">{tx.description}</td>
                <td className={`px-6 py-4 font-black text-right tabular-nums text-sm ${tx.amount > 0 ? 'text-green-400 neon-glow' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}Ð{tx.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}