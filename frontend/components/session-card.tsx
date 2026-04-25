import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { RecentTable } from "@/lib/storage";

export function SessionCard({ recent }: { recent: RecentTable }) {
  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-2">
        {recent.restaurant || recent.tableName} · {formatDate(recent.joinedAt)}
      </h3>
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-gray-500 text-sm leading-relaxed">
            <span className="font-mono font-bold text-gray-900">{recent.code}</span>
            {" · "}
            <span className="text-gray-700">{recent.tableName}</span>
          </div>
          <Link
            href={`/sessions/${recent.code}`}
            className="flex items-center gap-1 text-brand font-semibold whitespace-nowrap"
          >
            View <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
