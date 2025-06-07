// Test script to verify timezone fix for date display in History page
// Testing the specific issue: "Friday June 5" showing as "Thursday" when it should be "Friday June 4"

import { format } from 'date-fns';

console.log('=== Testing Timezone Fix for History Page ===\n');

// Test the problematic date mentioned in the issue
const testDate = '2025-06-05T10:00:00Z'; // June 5, 2025 UTC
console.log('1. Testing problematic date scenario...');
console.log(`Original timestamp: ${testDate}`);

// OLD APPROACH (problematic): Group by date string, then reconstruct date for display
console.log('\n--- OLD APPROACH (problematic) ---');
const oldGroupDate = format(new Date(testDate), 'yyyy-MM-dd');
console.log(`Grouped date string: ${oldGroupDate}`);
const oldDisplayDate = format(new Date(oldGroupDate), 'EEEE, MMMM d, yyyy');
console.log(`Display date (reconstructed from string): ${oldDisplayDate}`);

// NEW APPROACH (fixed): Use original timestamp for display
console.log('\n--- NEW APPROACH (fixed) ---');
const newGroupDate = format(new Date(testDate), 'yyyy-MM-dd');
console.log(`Grouped date string: ${newGroupDate}`);
const newDisplayDate = format(new Date(testDate), 'EEEE, MMMM d, yyyy');
console.log(`Display date (using original timestamp): ${newDisplayDate}`);

console.log('\n2. Testing multiple timezone scenarios...');

// Test various timestamps and timezones
const testTimestamps = [
  '2025-06-04T23:00:00Z',  // June 4 11 PM UTC
  '2025-06-05T01:00:00Z',  // June 5 1 AM UTC 
  '2025-06-05T12:00:00Z',  // June 5 noon UTC
  '2025-06-05T23:59:59Z'   // June 5 11:59:59 PM UTC
];

testTimestamps.forEach((timestamp, index) => {
  console.log(`\nTest ${index + 1}: ${timestamp}`);
  
  const originalDate = new Date(timestamp);
  const groupedDateString = format(originalDate, 'yyyy-MM-dd');
  
  // Old method (problematic)
  const oldDisplay = format(new Date(groupedDateString), 'EEEE, MMMM d, yyyy');
  
  // New method (fixed)
  const newDisplay = format(originalDate, 'EEEE, MMMM d, yyyy');
  
  console.log(`  Grouped as: ${groupedDateString}`);
  console.log(`  Old display: ${oldDisplay}`);
  console.log(`  New display: ${newDisplay}`);
  console.log(`  Match: ${oldDisplay === newDisplay ? 'YES' : 'NO'}`);
});

console.log('\n3. Testing current time and local timezone...');
const now = new Date();
console.log(`Current time: ${now.toISOString()}`);
console.log(`Local time: ${now.toString()}`);
console.log(`Timezone offset: ${now.getTimezoneOffset()} minutes`);

// Test grouping and display for current time
const nowGrouped = format(now, 'yyyy-MM-dd');
const nowDisplayOld = format(new Date(nowGrouped), 'EEEE, MMMM d, yyyy');
const nowDisplayNew = format(now, 'EEEE, MMMM d, yyyy');

console.log(`Current grouped: ${nowGrouped}`);
console.log(`Current old display: ${nowDisplayOld}`);
console.log(`Current new display: ${nowDisplayNew}`);
console.log(`Current match: ${nowDisplayOld === nowDisplayNew ? 'YES' : 'NO'}`);

console.log('\n=== Key Insights ===');
console.log('• The old approach reconstructs dates from YYYY-MM-DD strings');
console.log('• This can cause timezone shifts that affect day-of-week calculations');
console.log('• The new approach uses the original timestamp for display');
console.log('• This preserves the correct day-of-week information');
console.log('• The fix ensures consistent date display across timezones');

console.log('\n✅ Timezone fix test completed!');
