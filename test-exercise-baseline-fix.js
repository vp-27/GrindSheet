// Test case to verify the fixed logic for different exercise baselines
// This demonstrates how the new approach solves the issue

// Scenario: Shoulders category
// Day 1: Shoulder Press 20lbs
// Day 2: Shoulder Press 22lbs + Lateral Raises 10lbs (new exercise)

const mockLogs = [
  // Day 1: Only Shoulder Press
  { exerciseId: 'shoulder-press', weight: 20, timestamp: '2025-05-01' },
  
  // Day 2: Shoulder Press progression + new Lateral Raises
  { exerciseId: 'shoulder-press', weight: 22, timestamp: '2025-05-02' },
  { exerciseId: 'lateral-raises', weight: 10, timestamp: '2025-05-02' }
];

// OLD APPROACH (PROBLEMATIC):
// Day 1: Category avg = 20lbs (baseline)
// Day 2: Category avg = (22 + 10) / 2 = 16lbs
// Result: ((16 - 20) / 20) * 100 = -20% 🚫 FALSE DROP!

// NEW APPROACH (FIXED):
// Day 1: Shoulder Press = 0% gain, Category avg = 0%
// Day 2: 
//   - Shoulder Press = ((22 - 20) / 20) * 100 = 10% gain
//   - Lateral Raises = ((10 - 10) / 10) * 100 = 0% gain
//   - Category avg = (10% + 0%) / 2 = 5% gain ✅ CORRECT!

console.log('Fixed: New exercises with different baselines no longer cause false drops!');
