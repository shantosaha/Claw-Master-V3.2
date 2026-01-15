import json
import re

def count_machines():
    # 1. Read explicitly hardcoded machines in mockMachineService.ts
    with open('src/lib/mockMachineService.ts', 'r') as f:
        content = f.read()
    
    start_idx = content.find('INITIAL_MACHINES: any[] = [')
    end_idx = content.find('// Spread migrated machines', start_idx)
    if end_idx == -1:
        end_idx = content.find('];', start_idx)
    
    block = content[start_idx:end_idx]
    machines_explicit = re.findall(r'\"name\":\s*\"([^\"]+)\",\s*\"assetTag\":\s*\"([^\"]+)\"', block)
    
    # 2. Read machines from mock_machines.json
    with open('mock_machines.json', 'r') as f:
        machines_json = json.load(f)
    
    # 3. Read machines from demoData.ts
    with open('src/lib/demoData.ts', 'r') as f:
        demo_content = f.read()
    demo_machines = re.findall(r'name:\s*\"([^\"]+)\",.*?tag:\s*\"([^\"]+)\"', demo_content, re.DOTALL)

    all_machines = {}
    
    # Process demoData.ts
    for name, tag in demo_machines:
        all_machines[tag] = name
        
    # Process mockMachineService.ts explicit
    for name, tag in machines_explicit:
        all_machines[tag] = name
        
    # Process mock_machines.json
    for m in machines_json:
        tag = m.get('tag') or m.get('assetTag')
        name = m.get('name')
        if tag:
            all_machines[tag] = name

    print(f"Total Unique Hardcoded Machines: {len(all_machines)}")
    
    # Print the list
    for tag, name in sorted(all_machines.items(), key=lambda x: x[0]):
        print(f"Tag: {tag} - Name: {name}")

if __name__ == "__main__":
    count_machines()
