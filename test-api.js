// Simple test to check bulk import API
fetch('http://localhost:3000/api/users/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    users: [
      {
        firstName: "Test",
        lastName: "User", 
        username: "test_user_" + Date.now(),
        password: "test123",
        role: "member",
        teamName: "Test Team"
      }
    ]
  })
})
.then(response => response.json())
.then(data => {
  console.log('API Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});