import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Session } from "@/lib/types";
import { sessionTotals } from "@/lib/session-math";

export function SessionCard({ session }: { session: Session }) {
  const { plateValue, costPaid, percentBeaten } = sessionTotals(session);
  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-2">
        {session.restaurant || session.tableName} • {formatDate(session.createdAt)}
      </h3>
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-gray-500 text-sm leading-relaxed">
            <span className="text-gray-900 font-medium">{formatCurrency(plateValue)}</span> eaten
            {" • "}
            <span className="text-gray-900 font-medium">{Math.round(percentBeaten)}%</span> beaten
            {costPaid > 0 && (
              <>
                {" • "}
                paid {formatCurrency(costPaid)}
              </>
            )}
          </div>
          <Link
            href={`/sessions/${session.id}`}
            className="flex items-center gap-1 text-brand font-semibold whitespace-nowrap"
          >
            View <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
