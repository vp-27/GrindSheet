// Test script to verify tournament ranking logic
const mockTournament = {
  participants: [
    { userId: 'user1', totalPoints: 150, rank: 1 },
    { userId: 'user2', totalPoints: 120, rank: 2 },
    { userId: 'user3', totalPoints: 100, rank: 3 },
    { userId: 'user4', totalPoints: 80, rank: 4 },
  ]
};

// Test the ranking logic from TournamentStatusCard
function testRankingLogic(tournament, currentUserId) {
  const participantsSorted = [...tournament.participants].sort((a, b) => b.totalPoints - a.totalPoints);
  const actualRank = participantsSorted.findIndex(p => p.userId === currentUserId) + 1;
  
  const currentParticipant = tournament.participants.find(p => p.userId === currentUserId);
  const displayRank = actualRank > 0 ? actualRank : currentParticipant.rank;
  
  console.log(`User ${currentUserId}:`);
  console.log(`  Stored rank: ${currentParticipant.rank}`);
  console.log(`  Calculated rank: ${actualRank}`);
  console.log(`  Display rank: ${displayRank}`);
  console.log(`  Total points: ${currentParticipant.totalPoints}`);
  
  return displayRank;
}

console.log('Testing tournament ranking logic:');
console.log('================================');

// Test each user
mockTournament.participants.forEach(participant => {
  testRankingLogic(mockTournament, participant.userId);
  console.log('');
});

// Test edge case: unsorted participants
const unsortedTournament = {
  participants: [
    { userId: 'user3', totalPoints: 100, rank: 1 }, // Wrong stored rank
    { userId: 'user1', totalPoints: 150, rank: 3 }, // Wrong stored rank  
    { userId: 'user2', totalPoints: 120, rank: 4 }, // Wrong stored rank
    { userId: 'user4', totalPoints: 80, rank: 2 },  // Wrong stored rank
  ]
};

console.log('Testing with incorrectly stored ranks:');
console.log('====================================');

unsortedTournament.participants.forEach(participant => {
  testRankingLogic(unsortedTournament, participant.userId);
  console.log('');
});
