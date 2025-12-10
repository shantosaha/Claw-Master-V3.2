import Link from "next/link";
import { OrderBoard } from "@/components/orders/OrderBoard";

export default function OrdersPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Orders &amp; Reorders</h1>
                    <p className="text-muted-foreground">
                        Manage stock replenishment requests.
                    </p>
                </div>
                <Link href="/orders/history" className="text-sm font-medium text-primary hover:underline">
                    View History
                </Link>
            </div>
            <OrderBoard />
        </div>
    );
}
