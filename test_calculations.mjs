// Test the fixed 2W calculation logic
import { getOverallProgressChartData } from '../src/utils/progressUtils.js';

// Mock data simulating real user progression
const testData = {
  exercises: [
    { id: 'bench', categoryId: 'chest', name: 'Bench Press' },
    { id: 'squat', categoryId: 'legs', name: 'Squat' }
  ],
  categories: [
    { id: 'chest', name: 'Chest' },
    { id: 'legs', name: 'Legs' }
  ],
  logs: [
    // Start 30 days ago with baseline weights
    { exerciseId: 'bench', timestamp: '2025-06-09T10:00:00Z', weight: 135 },
    { exerciseId: 'squat', timestamp: '2025-06-09T10:00:00Z', weight: 200 },
    
    // 2W cutoff point (14 days ago) - user has made some progress
    { exerciseId: 'bench', timestamp: '2025-06-25T10:00:00Z', weight: 145 },
    { exerciseId: 'squat', timestamp: '2025-06-25T10:00:00Z', weight: 210 },
    
    // Recent progress within 2W window
    { exerciseId: 'bench', timestamp: '2025-07-05T10:00:00Z', weight: 150 },
    { exerciseId: 'squat', timestamp: '2025-07-05T10:00:00Z', weight: 215 },
    
    // Today - final weights
    { exerciseId: 'bench', timestamp: '2025-07-09T10:00:00Z', weight: 155 },
    { exerciseId: 'squat', timestamp: '2025-07-09T10:00:00Z', weight: 220 }
  ]
};

// Test ALL timeframe
console.log('=== Testing ALL timeframe ===');
const allData = getOverallProgressChartData(
  testData.logs, 
  testData.exercises, 
  testData.categories
);

console.log('ALL timeframe data points:', allData.length);
if (allData.length > 0) {
  const lastPoint = allData[allData.length - 1];
  console.log('Final percentages:', lastPoint);
  
  // Expected: Bench 135->155 = +14.8%, Squat 200->220 = +10.0%
  // Average: (14.8 + 10.0) / 2 = +12.4%
}

// Test 2W timeframe
console.log('\n=== Testing 2W timeframe ===');
const twoWeeksAgo = new Date('2025-06-25T00:00:00Z');
const twoWData = getOverallProgressChartData(
  testData.logs, 
  testData.exercises, 
  testData.categories,
  twoWeeksAgo
);

console.log('2W timeframe data points:', twoWData.length);
if (twoWData.length > 0) {
  const lastPoint = twoWData[twoWData.length - 1];
  console.log('Final percentages:', lastPoint);
  
  // Expected: Bench 145->155 = +6.9%, Squat 210->220 = +4.8%
  // Average: (6.9 + 4.8) / 2 = +5.85%
}

console.log('\n=== Expected Results ===');
console.log('ALL timeframe should show higher gains (~12.4%)');
console.log('2W timeframe should show lower gains (~5.9%)');
console.log('If 2W shows similar or higher gains than ALL, there\'s still a bug');

// Manual calculation verification
console.log('\n=== Manual Verification ===');
console.log('Bench Press:');
console.log('  ALL: 135 -> 155 = +14.8%');
console.log('  2W:  145 -> 155 = +6.9%');
console.log('Squat:');
console.log('  ALL: 200 -> 220 = +10.0%');
console.log('  2W:  210 -> 220 = +4.8%');
console.log('Average:');
console.log('  ALL: (14.8 + 10.0) / 2 = +12.4%');
console.log('  2W:  (6.9 + 4.8) / 2 = +5.85%');
