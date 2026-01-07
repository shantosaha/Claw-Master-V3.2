import { ServiceReport } from "@/types";

class ServiceReportService {
    // In a real app, this would fetch from a database or the JotForm API (if available via proxy)
    // For now, we simulate fetching stored reports
    async getReports(machineId: string): Promise<ServiceReport[]> {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Data Generation
        if (machineId === "GLOBAL_FETCH") {
            // Return a wider range of reports for the global view
            return [
                {
                    id: "rep_001",
                    machineId: "mac_001",
                    machineName: "Panda Claw 1",
                    location: "Burwood",
                    staffName: "John Doe",
                    c1: 25,
                    c2: 15,
                    c3: 10,
                    c4: 30,
                    playsPerWin: 20,
                    inflowSku: "TAG-101",
                    remarks: "Adjusted C1 strength due to weak grip complaints.",
                    imageUrl: "https://picsum.photos/seed/claw1/200/200",
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
                },
                {
                    id: "rep_002",
                    machineId: "mac_002",
                    machineName: "UFO Catcher 3",
                    location: "Burwood",
                    staffName: "Jane Smith",
                    c1: 25,
                    c2: 15,
                    c3: 10,
                    c4: 30,
                    playsPerWin: 20,
                    inflowSku: "TAG-105",
                    remarks: "Routine cleaning and sensor check. All good.",
                    imageUrl: "https://picsum.photos/seed/claw2/200/200",
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
                },
                {
                    id: "rep_003",
                    machineId: "mac_003",
                    machineName: "Big Bear 2",
                    location: "Hurstville",
                    staffName: "Mike Lee",
                    c1: 40,
                    c2: 30,
                    c3: 20,
                    c4: 50,
                    playsPerWin: 15,
                    inflowSku: "TAG-202",
                    reviews: "Customer reported coin jam. Fixed.",
                    imageUrl: "https://picsum.photos/seed/claw3/200/200",
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
                }
            ] as any[];
        }

        const mockReports: ServiceReport[] = [
            {
                id: "rep_001",
                machineId: machineId,
                machineName: "CLAW-001",
                location: "Burwood",
                staffName: "John Doe",
                c1: 25,
                c2: 15,
                c3: 10,
                c4: 30,
                playsPerWin: 20,
                inflowSku: machineId,
                remarks: "Adjusted C1 strength due to weak grip complaints.",
                imageUrl: "https://picsum.photos/seed/claw1/200/200",
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            },
            {
                id: "rep_002",
                machineId: machineId,
                machineName: "CLAW-001",
                location: "Burwood",
                staffName: "Jane Smith",
                c1: 25,
                c2: 15,
                c3: 10,
                c4: 30,
                playsPerWin: 20,
                inflowSku: machineId,
                remarks: "Routine cleaning and sensor check. All good.",
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            }
        ];
        return mockReports;
    }

    async submitReport(data: Omit<ServiceReport, "id" | "timestamp">): Promise<boolean> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, this would be:
        // await axios.post('/api/integrations/jotform/submit', data);
        console.log("Submitting to JotForm Backend Proxy:", data);

        return true;
    }
}

export const serviceReportService = new ServiceReportService();
