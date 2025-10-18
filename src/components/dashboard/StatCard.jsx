import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

export default function StatCard({ title, value, icon, valueClassName }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
            </CardContent>
        </Card>
    );
}