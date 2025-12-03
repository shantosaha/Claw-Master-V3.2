import { StockList } from "@/components/inventory/StockList";

export default function InventoryPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                {/* Header removed as it is duplicated in StockList */}
            </div>
            <StockList />
        </div>
    );
}
