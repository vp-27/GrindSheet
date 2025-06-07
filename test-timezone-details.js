// Detailed timezone analysis for the History page fix
import { format } from 'date-fns';

console.log('=== Detailed Timezone Analysis ===\n');

const testTimestamp = '2025-06-05T01:00:00Z'; // June 5, 1 AM UTC

console.log(`Test timestamp: ${testTimestamp}`);

const date = new Date(testTimestamp);
console.log(`JavaScript Date object: ${date}`);
console.log(`Local time string: ${date.toString()}`);
console.log(`UTC time string: ${date.toUTCString()}`);
console.log(`ISO string: ${date.toISOString()}`);

// Test the grouping logic
const groupDateString = format(date, 'yyyy-MM-dd');
console.log(`\nGrouping logic:`);
console.log(`format(date, 'yyyy-MM-dd'): ${groupDateString}`);

// Test the display logic
const displayString = format(date, 'EEEE, MMMM d, yyyy');
console.log(`\nDisplay logic:`);
console.log(`format(date, 'EEEE, MMMM d, yyyy'): ${displayString}`);

// Check timezone offset
console.log(`\nTimezone info:`);
console.log(`Timezone offset: ${date.getTimezoneOffset()} minutes`);
console.log(`Local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

// Test the old problematic approach
const oldDisplayString = format(new Date(groupDateString), 'EEEE, MMMM d, yyyy');
console.log(`\nOld approach (problematic):`);
console.log(`format(new Date('${groupDateString}'), 'EEEE, MMMM d, yyyy'): ${oldDisplayString}`);

console.log(`\n🎯 Key insight: The grouping happens in local timezone, display uses original timestamp`);
console.log(`✅ This is correct behavior - logs at 1 AM UTC on June 5 should group by local date`);

// Test Eastern Daylight Time scenario (UTC-4)
console.log(`\n=== Simulating Different Timezone Scenarios ===`);

const utcTimestamps = [
  '2025-06-05T03:59:59Z', // Just before midnight EDT
  '2025-06-05T04:00:00Z', // Exactly midnight EDT 
  '2025-06-05T04:00:01Z', // Just after midnight EDT
];

utcTimestamps.forEach((timestamp, index) => {
  const testDate = new Date(timestamp);
  const group = format(testDate, 'yyyy-MM-dd');
  const display = format(testDate, 'EEEE, MMMM d, yyyy');
  
  console.log(`\nTest ${index + 1}: ${timestamp}`);
  console.log(`  Local time: ${testDate.toString()}`);
  console.log(`  Groups as: ${group}`);
  console.log(`  Displays as: ${display}`);
});
