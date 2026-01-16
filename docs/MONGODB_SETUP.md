# MongoDB Atlas Setup for Vercel Deployment

## 1. MongoDB Atlas Configuration

### Step 1: Allow All IP Addresses
1. Go to MongoDB Atlas Dashboard
2. Navigate to "Network Access" in the left sidebar
3. Click "Add IP Address"
4. Select "Allow access from anywhere" (0.0.0.0/0)
5. Click "Confirm"

### Step 2: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add new database user"
3. Choose "Password" authentication
4. Username: `vercel-user` (or any name)
5. Password: Generate a strong password
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 3: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with your database name (e.g., `project-monitoring`)

Example connection string:
```
mongodb+srv://vercel-user:<password>@cluster0.xyz123.mongodb.net/project-monitoring?retryWrites=true&w=majority&appName=Cluster0
```

## 2. Vercel Environment Variables

Add these environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a random secure string (e.g., use openssl: `openssl rand -base64 32`)

## 3. Test Connection

You can test the connection locally first:
```bash
# Add to your .env.local
MONGODB_URI="mongodb+srv://username:password@cluster.xyz.mongodb.net/dbname?retryWrites=true&w=majority"
JWT_SECRET="your-secure-jwt-secret"

# Test the connection
npm run dev
# Visit http://localhost:3000/test-connection
```

## 4. Common Issues & Solutions

### Issue: "MongooseServerSelectionError"
- **Cause**: IP not whitelisted or wrong connection string
- **Fix**: Add 0.0.0.0/0 to MongoDB Atlas Network Access

### Issue: "Authentication failed"
- **Cause**: Wrong username/password in connection string
- **Fix**: Double-check database user credentials

### Issue: "Connection timeout"
- **Cause**: Network connectivity issues
- **Fix**: Ensure Atlas cluster is running and connection string is correct

### Issue: "Database not found"
- **Cause**: Database name in connection string doesn't match
- **Fix**: Update database name in connection string or create the database

## 5. Production Setup Commands

```bash
# Deploy to Vercel
npx vercel

# Add environment variables
npx vercel env add MONGODB_URI
npx vercel env add JWT_SECRET

# Redeploy with environment variables
npx vercel --prod
```