// Test script to validate category filtering in PR Records
console.log('🧪 Testing Category Filter Functionality...\n');

// Mock data for testing
const mockExercises = [
  { id: 'ex1', name: 'Bench Press', categoryId: 'cat1' },
  { id: 'ex2', name: 'Squat', categoryId: 'cat2' },
  { id: 'ex3', name: 'Deadlift', categoryId: 'cat2' },
  { id: 'ex4', name: 'Bicep Curl', categoryId: 'cat1' }
];

const mockLogs = [
  { exerciseId: 'ex1', userId: 'u1', weight: 200 },
  { exerciseId: 'ex1', userId: 'u2', weight: 180 },
  { exerciseId: 'ex2', userId: 'u1', weight: 300 },
  { exerciseId: 'ex2', userId: 'u2', weight: 250 },
  { exerciseId: 'ex3', userId: 'u1', weight: 400 },
  { exerciseId: 'ex3', userId: 'u2', weight: 350 },
  { exerciseId: 'ex4', userId: 'u1', weight: 50 },
  { exerciseId: 'ex4', userId: 'u2', weight: 45 }
];

// Test category filtering logic
function testCategoryFilter(logs, exercises, categoryId) {
  console.log(`Testing category filter for categoryId: ${categoryId}`);
  
  // Get category exercise IDs
  const categoryExerciseIds = exercises
    .filter(exercise => exercise.categoryId === categoryId)
    .map(exercise => exercise.id);
  
  console.log('Category exercise IDs:', categoryExerciseIds);
  
  // Filter logs
  const filteredLogs = logs.filter(log => categoryExerciseIds.includes(log.exerciseId));
  
  console.log('Filtered logs:', filteredLogs);
  console.log('---');
  
  return filteredLogs;
}

// Test with different categories
console.log('All exercises:', mockExercises.map(e => `${e.name} (${e.categoryId})`));
console.log('All logs:', mockLogs.length, 'total\n');

testCategoryFilter(mockLogs, mockExercises, 'cat1');
testCategoryFilter(mockLogs, mockExercises, 'cat2');

console.log('✅ Category filtering logic test completed!');
console.log('\n📝 Expected behavior:');
console.log('- cat1 should show only Bench Press and Bicep Curl exercises');
console.log('- cat2 should show only Squat and Deadlift exercises');
console.log('- "All" should show all exercises');
