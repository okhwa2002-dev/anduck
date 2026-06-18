import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  description?: string;
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
