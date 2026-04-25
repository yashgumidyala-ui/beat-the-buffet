import { Card } from "@/components/ui/card";

const GROUPS = [
  { name: "MIT Roomies", members: 6, lastSession: "Apr 18" },
  { name: "Tuesday Sushi Club", members: 4, lastSession: "Apr 15" },
  { name: "Lab 7", members: 8, lastSession: "Apr 11" },
];

export default function GroupsPage() {
  return (
    <div className="px-5 pt-12 pb-6">
      <h1 className="text-2xl font-bold mb-1 text-center">Groups</h1>
      <p className="text-gray-500 text-center text-sm mb-6">Recurring crews you eat with</p>

      <div className="space-y-3">
        {GROUPS.map((g) => (
          <Card key={g.name} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-bold">{g.name}</div>
              <div className="text-xs text-gray-500">
                {g.members} members · last met {g.lastSession}
              </div>
            </div>
            <div className="text-brand font-semibold text-sm">View →</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
