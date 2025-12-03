import { StockCheckForm } from "@/components/stock-check/StockCheckForm";

export default function StockCheckPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Weekly Stock Check</h1>
                    <p className="text-muted-foreground">
                        Perform weekly inventory audits and submit for review.
                    </p>
                </div>
            </div>
            <StockCheckForm />
        </div>
    );
}
