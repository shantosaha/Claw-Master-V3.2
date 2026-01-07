
import re

with open('/Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/src/lib/mockMachineService.ts', 'r') as f:
    content = f.read()

# Find the INITIAL_MACHINES array
# It starts with const INITIAL_MACHINES: any[] = [
# And ends with ];

# Simple heuristic: count the number of objects at the top level of the array
# Or just count the number of "id": "mac_" occurrences

machine_ids = re.findall(r'"id":\s*"mac_([^"]+)"', content)
print(f"Total Machines (mac_ prefix): {len(machine_ids)}")

subgroups = re.findall(r'"subGroup":\s*"([^"]+)"', content)
subgroup_counts = {}
for sg in subgroups:
    subgroup_counts[sg] = subgroup_counts.get(sg, 0) + 1

print("\nCategories (subGroup):")
for sg, count in subgroup_counts.items():
    print(f"- {sg}: {count}")

# Check for "group" as well
groups = re.findall(r'"group":\s*"([^"]+)"', content)
group_counts = {}
for g in groups:
    group_counts[g] = group_counts.get(g, 0) + 1

print("\nMain Groups:")
for g, count in group_counts.items():
    print(f"- {g}: {count}")
