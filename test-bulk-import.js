// Test script for bulk import
const testData = `Name	Surename	Username	password	role	team
Danielle	Macabata	danielle_macabata	member123	member	Building Team
Aldwin	Villafranca	aldwin_villafranca	member124	member	Building Team
Eriksonn	Dagawasan	eriksonn_dagawasan	member125	member	Building Team
Jessylin	Tandugon	jessylin_tandugon	member126	member	Building Team
Joema Carlo	Luzares	joema_lusares	member127	member	Building Team
Nicole	Magsongsong	nicole_masongsong	member128	member	Building Team
Mari Lynette	Maiza	maria_maiza	member129	member	Building Team
Dane Dover	Cortez	dane_cortez	member130	member	Building Team
Frankline	Madale	franklin_madale	member131	member	Building Team
Ian	Tagaan	ian_tagaan	member132	member	Building Team
Kassandra Fiona	Manga	kassandra_manga	member133	member	Building Team`;

// Parse the tab-separated data
function parseTabData(data) {
  const lines = data.trim().split('\n');
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  
  const users = lines.slice(1).map(line => {
    const values = line.split('\t').map(v => v.trim());
    const user = {};
    
    headers.forEach((header, index) => {
      if (values[index]) {
        // Map headers to our expected format
        if (header === 'name') {
          user.firstName = values[index];
        } else if (header === 'surename' || header === 'surname' || header === 'lastname') {
          user.lastName = values[index];
        } else if (header === 'team') {
          user.teamName = values[index];
        } else {
          user[header] = values[index];
        }
      }
    });
    
    return user;
  });
  
  return users;
}

// Test the parsing
const users = parseTabData(testData);
console.log('Parsed users:');
console.log(JSON.stringify(users, null, 2));

// Test API call
async function testBulkImport() {
  try {
    const response = await fetch('http://localhost:3000/api/users/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ users }),
    });
    
    const result = await response.json();
    console.log('\n=== BULK IMPORT RESULTS ===');
    console.log('Total:', result.summary?.total || 0);
    console.log('Successful:', result.summary?.successful || 0);
    console.log('Failed:', result.summary?.failed || 0);
    
    if (result.results?.failed?.length > 0) {
      console.log('\nFailed imports:');
      result.results.failed.forEach((fail, index) => {
        console.log(`${index + 1}. ${fail.userData.username || 'Unknown'}: ${fail.error}`);
      });
    }
    
    if (result.results?.successful?.length > 0) {
      console.log('\nSuccessful imports:');
      result.results.successful.forEach((success, index) => {
        const user = success.createdUser;
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Export for use
module.exports = { testBulkImport, users };