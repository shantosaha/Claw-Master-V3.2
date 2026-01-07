"use client";

import { AdvancedMachineSettings } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdvancedSettingsFormProps {
    settings: AdvancedMachineSettings;
    onChange: (settings: AdvancedMachineSettings) => void;
    disabled?: boolean;
}

export function AdvancedSettingsForm({ settings, onChange, disabled }: AdvancedSettingsFormProps) {
    const handleChange = (field: keyof AdvancedMachineSettings, value: any) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Grid: Identity & Pricing - Stays single column longer for sidebar use */}
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">

                {/* Identity & Categorization */}
                <Card className="h-full">
                    <CardHeader className="pb-3 px-4">
                        <CardTitle className="text-base">Identity & Category</CardTitle>
                        <CardDescription className="text-xs">Basic machine identification</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="macId" className="text-xs">MAC ID</Label>
                            <Input
                                id="macId"
                                className="h-8 text-sm"
                                value={settings.macId || ""}
                                onChange={(e) => handleChange("macId", e.target.value)}
                                disabled={disabled}
                                placeholder="e.g. 6827T9E3C24A"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="mainCategory" className="text-xs">Group (Direct)</Label>
                                <Select
                                    value={settings.mainCategory || "Group 4-Cranes"}
                                    onValueChange={(val) => handleChange("mainCategory", val)}
                                    disabled={disabled}
                                >
                                    <SelectTrigger id="mainCategory" className="h-8 text-sm">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Group 4-Cranes">Group 4-Cranes</SelectItem>
                                        <SelectItem value="Video">Video</SelectItem>
                                        <SelectItem value="Redemption">Redemption</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subCategory" className="text-xs">Sub Group (Direct)</Label>
                                <Input
                                    id="subCategory"
                                    className="h-8 text-sm"
                                    value={settings.subCategory || ""}
                                    onChange={(e) => handleChange("subCategory", e.target.value)}
                                    disabled={disabled}
                                    placeholder="e.g. Small"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="esrbRating" className="text-xs">ESRB Rating</Label>
                            <Select
                                value={settings.esrbRating || "NOT RATED"}
                                onValueChange={(val) => handleChange("esrbRating", val)}
                                disabled={disabled}
                            >
                                <SelectTrigger id="esrbRating" className="h-8 text-sm">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOT RATED">NOT RATED</SelectItem>
                                    <SelectItem value="E">Everyone</SelectItem>
                                    <SelectItem value="T">Teen</SelectItem>
                                    <SelectItem value="M">Mature</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing Configuration */}
                <Card className="h-full">
                    <CardHeader className="pb-3 px-4">
                        <CardTitle className="text-base">Pricing Configuration</CardTitle>
                        <CardDescription className="text-xs">Set credits and play values</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="cardCashPlayPrice" className="text-xs truncate block" title="Card Cash Price">Card Cash Price</Label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-muted-foreground text-xs">$</span>
                                    <Input
                                        id="cardCashPlayPrice"
                                        type="number"
                                        step="0.01"
                                        className="pl-5 h-8 text-sm"
                                        value={settings.cardCashPlayPrice ?? 0}
                                        onChange={(e) => handleChange("cardCashPlayPrice", parseFloat(e.target.value))}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardTokenPlayPrice" className="text-xs truncate block" title="Card Token Price">Card Token Price</Label>
                                <div className="relative">
                                    <Input
                                        id="cardTokenPlayPrice"
                                        type="number"
                                        step="1"
                                        className="h-8 text-sm pr-12"
                                        value={settings.cardTokenPlayPrice ?? 0}
                                        onChange={(e) => handleChange("cardTokenPlayPrice", parseFloat(e.target.value))}
                                        disabled={disabled}
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">Tkns</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coinValue" className="text-xs truncate block" title="Coin Value">Coin Value</Label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-muted-foreground text-xs">$</span>
                                    <Input
                                        id="coinValue"
                                        type="number"
                                        step="0.05"
                                        className="pl-5 h-8 text-sm"
                                        value={settings.coinValue ?? 0}
                                        onChange={(e) => handleChange("coinValue", parseFloat(e.target.value))}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vipDiscountedPrice" className="text-xs truncate block" title="VIP Price">VIP Price</Label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-muted-foreground text-xs">$</span>
                                    <Input
                                        id="vipDiscountedPrice"
                                        type="number"
                                        step="0.01"
                                        className="pl-5 h-8 text-sm"
                                        value={settings.vipDiscountedPrice ?? 0}
                                        onChange={(e) => handleChange("vipDiscountedPrice", parseFloat(e.target.value))}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="creditCardPlayPrice" className="text-xs">Credit Card Price</Label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-muted-foreground text-xs">$</span>
                                    <Input
                                        id="creditCardPlayPrice"
                                        type="number"
                                        step="0.01"
                                        className="pl-5 h-8 text-sm"
                                        value={settings.creditCardPlayPrice ?? 0}
                                        onChange={(e) => handleChange("creditCardPlayPrice", parseFloat(e.target.value))}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hardware & Functions */}
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">

                {/* Hardware Specs */}
                <Card className="2xl:col-span-2">
                    <CardHeader className="pb-3 px-4">
                        <CardTitle className="text-base">Hardware Configuration</CardTitle>
                        <CardDescription className="text-xs">Reader models and interface types</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gameInterface" className="text-xs">Game Interface</Label>
                                    <Select
                                        value={settings.gameInterface || "Crane"}
                                        onValueChange={(val) => handleChange("gameInterface", val)}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger id="gameInterface" className="h-8 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            <SelectItem value="Crane">Crane</SelectItem>
                                            <SelectItem value="Video">Video</SelectItem>
                                            <SelectItem value="Redemption">Redemption</SelectItem>
                                            <SelectItem value="Merchandiser">Merchandiser</SelectItem>
                                            <SelectItem value="Table Game">Table Game</SelectItem>
                                            <SelectItem value="Attractions">Attractions</SelectItem>
                                            <SelectItem value="Balance Review">Balance Review</SelectItem>
                                            <SelectItem value="Ticket Eater">Ticket Eater</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="readerModel" className="text-xs">Reader Model</Label>
                                    <Select
                                        value={settings.readerModel || "iReader Series"}
                                        onValueChange={(val) => handleChange("readerModel", val)}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger id="readerModel" className="h-8 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="iReader Series">iReader Series</SelectItem>
                                            <SelectItem value="Nano Series">Nano Series</SelectItem>
                                            <SelectItem value="Impulse">Impulse</SelectItem>
                                            <SelectItem value="Fedelis">Fedelis</SelectItem>
                                            <SelectItem value="Impulse Tap">Impulse Tap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="buttonConfiguration" className="text-xs">Button Configuration</Label>
                                    <Select
                                        value={settings.buttonConfiguration || "No Start Button"}
                                        onValueChange={(val) => handleChange("buttonConfiguration", val)}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger id="buttonConfiguration" className="h-8 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="No Start Button">No Start Button</SelectItem>
                                            <SelectItem value="Start Button">Start Button</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currencyDecimalPlace" className="text-xs">Decimals</Label>
                                    <Select
                                        value={settings.currencyDecimalPlace || "2 Decimal"}
                                        onValueChange={(val) => handleChange("currencyDecimalPlace", val)}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger id="currencyDecimalPlace" className="h-8 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="No Decimal">No Decimal</SelectItem>
                                            <SelectItem value="2 Decimal">2 Decimal</SelectItem>
                                            <SelectItem value="3 Decimal">3 Decimal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="debitOrder" className="text-xs">Debit Order</Label>
                                    <Select
                                        value={settings.debitOrder || "Cash First"}
                                        onValueChange={(val) => handleChange("debitOrder", val)}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger id="debitOrder" className="h-8 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash First">Cash First</SelectItem>
                                            <SelectItem value="Bonus Cash First">Bonus Cash First</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ticketDispenserBridge" className="text-xs">Ticket Dispenser Bridge</Label>
                                    <Select
                                        value={settings.ticketDispenserBridge || "Disabled"}
                                        onValueChange={(val) => handleChange("ticketDispenserBridge", val)}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger id="ticketDispenserBridge" className="h-8 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Enabled">Enabled</SelectItem>
                                            <SelectItem value="Disabled">Disabled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Flags / Functions */}
                <Card>
                    <CardHeader className="pb-3 px-4">
                        <CardTitle className="text-base">Functions</CardTitle>
                        <CardDescription className="text-xs">Toggle machine features</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 focus-within:ring-0">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="allowBonusPlay"
                                    checked={settings.allowBonusPlay}
                                    onCheckedChange={(checked) => handleChange("allowBonusPlay", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="allowBonusPlay" className="text-xs font-normal cursor-pointer">Allow Bonus Play</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="flipDisplay"
                                    checked={settings.flipDisplay}
                                    onCheckedChange={(checked) => handleChange("flipDisplay", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="flipDisplay" className="text-xs font-normal cursor-pointer">Flip Display</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="pointsForPlay"
                                    checked={settings.pointsForPlay}
                                    onCheckedChange={(checked) => handleChange("pointsForPlay", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="pointsForPlay" className="text-xs font-normal cursor-pointer">Points for Play</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="depleteBalance"
                                    checked={settings.depleteBalance}
                                    onCheckedChange={(checked) => handleChange("depleteBalance", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="depleteBalance" className="text-xs font-normal cursor-pointer">Deplete Balance</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="touchEnabled"
                                    checked={settings.touchEnabled}
                                    onCheckedChange={(checked) => handleChange("touchEnabled", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="touchEnabled" className="text-xs font-normal cursor-pointer">Touch Enabled</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="eclipseFeature"
                                    checked={settings.eclipseFeature}
                                    onCheckedChange={(checked) => handleChange("eclipseFeature", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="eclipseFeature" className="text-xs font-normal cursor-pointer">Eclipse Feature</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="enableMobileIReader"
                                    checked={settings.enableMobileIReader}
                                    onCheckedChange={(checked) => handleChange("enableMobileIReader", checked)}
                                    disabled={disabled}
                                />
                                <Label htmlFor="enableMobileIReader" className="text-xs font-normal cursor-pointer">Enable Mobile iReader</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Technical Settings */}
            <Card>
                <CardHeader className="pb-3 px-4">
                    <CardTitle className="text-base">Technical Settings</CardTitle>
                    <CardDescription className="text-xs">Motor timing and sensor properties</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="pulseWidth" className="text-[10px] truncate block" title="Pulse Width (ms)">Pulse Width (ms)</Label>
                            <Input
                                id="pulseWidth"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.pulseWidth ?? 100}
                                onChange={(e) => handleChange("pulseWidth", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pulsePauseWidth" className="text-[10px] truncate block" title="Pulse Pause Width (ms)">Pause Width (ms)</Label>
                            <Input
                                id="pulsePauseWidth"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.pulsePauseWidth ?? 100}
                                onChange={(e) => handleChange("pulsePauseWidth", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pulsesToActuate" className="text-[10px] truncate block" title="Pulses to Actuate">Pulses to Actuate</Label>
                            <Input
                                id="pulsesToActuate"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.pulsesToActuate ?? 1}
                                onChange={(e) => handleChange("pulsesToActuate", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hopperTimeOut" className="text-[10px] truncate block" title="Hopper Time Out (sec)">Hopper Time (s)</Label>
                            <Input
                                id="hopperTimeOut"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.hopperTimeOut ?? 100}
                                onChange={(e) => handleChange("hopperTimeOut", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rfidTapDelay" className="text-[10px] truncate block" title="RFID Tap Delay (sec)">RFID Delay (s)</Label>
                            <Input
                                id="rfidTapDelay"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.rfidTapDelay ?? 1}
                                onChange={(e) => handleChange("rfidTapDelay", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coinsDispensedPerPulse" className="text-[10px] truncate block" title="Coins Dispensed/Pulse">Coins/Pulse</Label>
                            <Input
                                id="coinsDispensedPerPulse"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.coinsDispensedPerPulse ?? 1}
                                onChange={(e) => handleChange("coinsDispensedPerPulse", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* API Sync Stats */}
            <Card>
                <CardHeader className="pb-3 px-4">
                    <CardTitle className="text-base">API Sync Stats</CardTitle>
                    <CardDescription className="text-xs">Data synced from Intercard API</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="cashDebitBonus" className="text-[10px] truncate block" title="Cash Debit Bonus">Cash Debit Bonus</Label>
                            <div className="relative">
                                <span className="absolute left-2 top-2 text-muted-foreground text-xs">$</span>
                                <Input
                                    id="cashDebitBonus"
                                    type="number"
                                    step="0.01"
                                    className="pl-5 h-8 text-sm"
                                    value={settings.cashDebitBonus ?? 0}
                                    onChange={(e) => handleChange("cashDebitBonus", parseFloat(e.target.value))}
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pointsPerPlay" className="text-[10px] truncate block" title="Points Per Play">Points/Play</Label>
                            <Input
                                id="pointsPerPlay"
                                type="number"
                                className="h-8 text-sm"
                                value={settings.pointsPerPlay ?? 0}
                                onChange={(e) => handleChange("pointsPerPlay", parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="standardPlays" className="text-[10px] truncate block" title="Standard Plays (API Sync)">Standard Plays</Label>
                            <Input
                                id="standardPlays"
                                type="number"
                                className="h-8 text-sm bg-muted/50"
                                value={settings.standardPlays ?? 0}
                                onChange={(e) => handleChange("standardPlays", parseInt(e.target.value))}
                                disabled={disabled}
                                title="Synced from API"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="empPlays" className="text-[10px] truncate block" title="Employee Plays (API Sync)">Emp Plays</Label>
                            <Input
                                id="empPlays"
                                type="number"
                                className="h-8 text-sm bg-muted/50"
                                value={settings.empPlays ?? 0}
                                onChange={(e) => handleChange("empPlays", parseInt(e.target.value))}
                                disabled={disabled}
                                title="Synced from API"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
