// More comprehensive debug to identify the 2W vs ALL calculation issue

// Let's simulate real data more closely
const mockData = {
  exercises: [
    { id: 'bench', categoryId: 'chest', name: 'Bench Press' },
    { id: 'squat', categoryId: 'legs', name: 'Squat' },
    { id: 'deadlift', categoryId: 'back', name: 'Deadlift' }
  ],
  categories: [
    { id: 'chest', name: 'Chest' },
    { id: 'legs', name: 'Legs' },
    { id: 'back', name: 'Back' }
  ],
  logs: [
    // Bench Press progression
    { exerciseId: 'bench', timestamp: '2025-06-20', weight: 135 }, // 19 days ago
    { exerciseId: 'bench', timestamp: '2025-06-25', weight: 140 }, // 14 days ago (2W cutoff)
    { exerciseId: 'bench', timestamp: '2025-07-01', weight: 145 }, // 8 days ago
    { exerciseId: 'bench', timestamp: '2025-07-09', weight: 150 }, // today
    
    // Squat progression
    { exerciseId: 'squat', timestamp: '2025-06-20', weight: 200 }, // 19 days ago
    { exerciseId: 'squat', timestamp: '2025-06-25', weight: 205 }, // 14 days ago (2W cutoff)
    { exerciseId: 'squat', timestamp: '2025-07-01', weight: 210 }, // 8 days ago
    { exerciseId: 'squat', timestamp: '2025-07-09', weight: 215 }, // today
    
    // Deadlift progression
    { exerciseId: 'deadlift', timestamp: '2025-06-20', weight: 250 }, // 19 days ago
    { exerciseId: 'deadlift', timestamp: '2025-06-25', weight: 255 }, // 14 days ago (2W cutoff)
    { exerciseId: 'deadlift', timestamp: '2025-07-01', weight: 260 }, // 8 days ago
    { exerciseId: 'deadlift', timestamp: '2025-07-09', weight: 265 }, // today
  ]
};

// Calculate expected results
console.log('=== Expected Calculations ===');

// ALL timeframe - should show total gains from start
console.log('\nALL timeframe (from June 20):');
console.log('Bench: 135 -> 150 = +11.1% gain');
console.log('Squat: 200 -> 215 = +7.5% gain');
console.log('Deadlift: 250 -> 265 = +6.0% gain');
console.log('Average: (11.1 + 7.5 + 6.0) / 3 = +8.2% gain');

// 2W timeframe - should show gains from June 25
console.log('\n2W timeframe (from June 25):');
console.log('Bench: 140 -> 150 = +7.1% gain');
console.log('Squat: 205 -> 215 = +4.9% gain');
console.log('Deadlift: 255 -> 265 = +3.9% gain');
console.log('Average: (7.1 + 4.9 + 3.9) / 3 = +5.3% gain');

console.log('\n=== Key Insight ===');
console.log('The 2W calculation should show LESS gain than ALL');
console.log('If 2W is showing MORE gain than ALL, there\'s a bug');
console.log('The bug is likely in the re-baselining logic or percentage averaging');

// Let's check what the current logic would produce
const now = new Date('2025-07-09');
const cutoffDate2W = new Date(now);
cutoffDate2W.setDate(now.getDate() - 14); // June 25

console.log('\n=== Current Implementation Analysis ===');
console.log('Cutoff date:', cutoffDate2W.toDateString());

// Simulate the exercise start weights calculation
const exerciseStartWeights = new Map();
const sortedLogs = mockData.logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
sortedLogs.forEach(log => {
  if (!exerciseStartWeights.has(log.exerciseId)) {
    exerciseStartWeights.set(log.exerciseId, log.weight);
  }
});

console.log('Exercise start weights:', Object.fromEntries(exerciseStartWeights));

// The issue might be that when windowStartDate is provided:
// 1. It calculates percentages from the ORIGINAL start weights
// 2. But then re-baselines by subtracting the window start percentage
// This creates a disconnect between the calculation method and the display

console.log('\n=== Potential Bug ===');
console.log('1. Calculate percentage from original start (e.g., 135 -> 150 = +11.1%)');
console.log('2. Re-baseline by subtracting window start percentage');
console.log('3. This might create incorrect relative calculations');
