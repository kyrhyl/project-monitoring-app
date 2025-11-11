// Debug bulk import with your exact data
const testData = [
  {
    firstName: "Danielle",
    lastName: "Macabata", 
    username: "danielle_macabata",
    password: "member123",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Aldwin",
    lastName: "Villafranca",
    username: "aldwin_villafranca", 
    password: "member124",
    role: "member",
    teamName: "Building Team"
  }
];

console.log('Testing bulk import with sample data...');
console.log('Data to send:', JSON.stringify(testData, null, 2));

// This would be run in browser console
console.log(`
To test in browser console, run:

fetch('/api/users/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ users: ${JSON.stringify(testData)} })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
`);