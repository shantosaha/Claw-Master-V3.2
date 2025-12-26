import { StockCheckForm } from "@/components/stock-check/StockCheckForm";

export default function StockCheckPage() {
    return (
        <div className="flex flex-col gap-4 pb-16">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Stock Check</h1>
                    <p className="text-muted-foreground text-sm">
                        Verify inventory levels across machines and storage. Track discrepancies and submit reports.
                    </p>
                </div>
            </div>
            <StockCheckForm />
        </div>
    );
}
