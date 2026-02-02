import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
}

export function MetricCard({ title, value, description, className }: MetricCardProps) {
  return (
    <Card className={cn("border border-neutral-100 shadow-xl shadow-neutral-100/50 rounded-3xl p-6 bg-white transition-all hover:scale-[1.01]", className)}>
      <div className="space-y-1">
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">{title}</p>
        <p className="text-4xl font-extrabold tracking-tight text-black">{value}</p>
        {description && (
          <p className="text-sm font-medium text-neutral-500 pt-1">{description}</p>
        )}
      </div>
    </Card>
  );
}
