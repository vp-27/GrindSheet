// Debug script to test 2W calculations
// This will help identify the issue with 2W calculations vs ALL calculations

// Mock data to simulate the issue
const mockLogs = [
  { exerciseId: 'ex1', timestamp: '2025-06-25', weight: 100 }, // 14 days ago
  { exerciseId: 'ex1', timestamp: '2025-06-30', weight: 105 }, // 9 days ago
  { exerciseId: 'ex1', timestamp: '2025-07-05', weight: 110 }, // 4 days ago
  { exerciseId: 'ex1', timestamp: '2025-07-09', weight: 115 }, // today
];

const mockExercises = [
  { id: 'ex1', categoryId: 'cat1', name: 'Bench Press' }
];

const mockCategories = [
  { id: 'cat1', name: 'Chest' }
];

// Simulate the 2W cutoff date calculation
const now = new Date('2025-07-09');
const cutoffDate2W = new Date(now);
cutoffDate2W.setDate(now.getDate() - 14); // June 25

console.log('Now:', now.toDateString());
console.log('2W cutoff date:', cutoffDate2W.toDateString());
console.log('Mock logs dates:', mockLogs.map(log => new Date(log.timestamp).toDateString()));

// Test the filtering logic
const filteredLogs = mockLogs.filter(log => new Date(log.timestamp) >= cutoffDate2W);
console.log('Filtered logs for 2W:', filteredLogs);

// The key issue is likely in how the baseline is calculated
// When windowStartDate is passed to getOverallProgressChartData:
// 1. It filters to only include exercises that existed at that date
// 2. It re-baselines all categories to 0% at that date

console.log('\n=== Analysis ===');
console.log('ALL timeframe: Uses first ever log as baseline');
console.log('2W timeframe: Uses 2W cutoff date as baseline AND re-baselines to 0%');
console.log('\nPotential issues:');
console.log('1. Re-baselining might be resetting progress incorrectly');
console.log('2. Exercise filtering might exclude exercises that should be included');
console.log('3. Percentage calculation from filtered baseline vs. absolute baseline');
