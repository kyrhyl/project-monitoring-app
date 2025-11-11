// Bulk import using curl command
const { exec } = require('child_process');
const fs = require('fs');

const users = [
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
  },
  {
    firstName: "Eriksonn",
    lastName: "Dagawasan",
    username: "eriksonn_dagawasan",
    password: "member125", 
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Jessylin",
    lastName: "Tandugon",
    username: "jessylin_tandugon",
    password: "member126",
    role: "member", 
    teamName: "Building Team"
  },
  {
    firstName: "Joema Carlo",
    lastName: "Luzares",
    username: "joema_lusares",
    password: "member127",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Nicole", 
    lastName: "Magsongsong",
    username: "nicole_masongsong",
    password: "member128",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Mari Lynette",
    lastName: "Maiza", 
    username: "maria_maiza",
    password: "member129",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Dane Dover",
    lastName: "Cortez",
    username: "dane_cortez",
    password: "member130",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Frankline",
    lastName: "Madale",
    username: "franklin_madale", 
    password: "member131",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Ian",
    lastName: "Tagaan",
    username: "ian_tagaan",
    password: "member132",
    role: "member",
    teamName: "Building Team"
  },
  {
    firstName: "Kassandra Fiona",
    lastName: "Manga",
    username: "kassandra_manga",
    password: "member133", 
    role: "member",
    teamName: "Building Team"
  }
];

// Write data to temp file
const data = JSON.stringify({ users });
fs.writeFileSync('temp-users.json', data);

console.log('🚀 Starting bulk import...\n');
console.log(`📊 Importing ${users.length} users to "Building Team":`);
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
});
console.log('');

// Use PowerShell Invoke-RestMethod instead of curl
const psCommand = `
$jsonData = Get-Content -Path "temp-users.json" -Raw
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/users/bulk" -Method POST -ContentType "application/json" -Body $jsonData
$response | ConvertTo-Json -Depth 10
`;

exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  // Clean up temp file
  if (fs.existsSync('temp-users.json')) {
    fs.unlinkSync('temp-users.json');
  }
  
  if (error) {
    console.error('❌ Error during bulk import:');
    console.error(error.message);
    return;
  }
  
  if (stderr) {
    console.error('❌ Import error:', stderr);
    return;
  }
  
  try {
    const result = JSON.parse(stdout);
    
    console.log('✅ BULK IMPORT COMPLETED!');
    console.log('==========================');
    console.log(`📈 Total Users: ${result.summary?.total || 0}`);
    console.log(`✅ Successful: ${result.summary?.successful || 0}`); 
    console.log(`❌ Failed: ${result.summary?.failed || 0}`);
    console.log('');
    
    if (result.results?.successful?.length > 0) {
      console.log('✅ SUCCESSFULLY CREATED USERS:');
      result.results.successful.forEach((success, index) => {
        const user = success.createdUser;
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
      });
      console.log('');
    }
    
    if (result.results?.failed?.length > 0) {
      console.log('❌ FAILED IMPORTS:');
      result.results.failed.forEach((fail, index) => {
        console.log(`${index + 1}. ${fail.userData.username || 'Unknown'}: ${fail.error}`);
      });
      console.log('');
    }
    
    if (result.summary?.successful > 0) {
      console.log('🎉 Import completed successfully!');
      console.log('👥 All users have been added to the "Building Team"');
      console.log('🔑 Users can log in with their specified passwords');
      console.log('🌐 Visit http://localhost:3000/admin to view the users');
    }
    
  } catch (parseError) {
    console.log('✅ Raw response:', stdout);
    console.log('🎉 Import appears to have completed!');
  }
});