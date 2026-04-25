import { Card } from "@/components/ui/card";

const ROWS = [
  { name: "Anderson", sessions: 12, beaten: 187, pct: 92 },
  { name: "Rick", sessions: 9, beaten: 154, pct: 88 },
  { name: "Sarah", sessions: 7, beaten: 121, pct: 79 },
  { name: "Mike", sessions: 6, beaten: 98, pct: 74 },
  { name: "Jen", sessions: 4, beaten: 67, pct: 65 },
  { name: "Tom", sessions: 3, beaten: 49, pct: 58 },
];

export default function LeaderboardPage() {
  return (
    <div className="px-5 pt-12 pb-6">
      <h1 className="text-2xl font-bold mb-1 text-center">Leaderboard</h1>
      <p className="text-gray-500 text-center text-sm mb-6">All-time average % beaten</p>

      <Card className="p-2">
        {ROWS.map((row, i) => (
          <div
            key={row.name}
            className="flex items-center justify-between px-3 py-3 border-b last:border-b-0 border-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-base">
                {["🥇", "🥈", "🥉"][i] ?? <span className="text-gray-400 text-sm font-semibold">#{i + 1}</span>}
              </span>
              <div>
                <div className="font-semibold">{row.name}</div>
                <div className="text-xs text-gray-500">{row.sessions} sessions</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-emerald-600">{row.pct}%</div>
              <div className="text-xs text-gray-500">${row.beaten} eaten</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
