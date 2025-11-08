# Project Monitoring App

A lightweight project monitoring application built with Next.js, TypeScript, and MongoDB Atlas. Features role-based authentication, team management, and comprehensive project tracking.

## 🚀 **Features**

### **Authentication & Authorization**
- Role-based access control (Admin, Team Leader, Member)
- Secure JWT authentication with HTTP-only cookies
- Protected routes and API endpoints

### **User Management**
- Admin dashboard for user CRUD operations
- Role assignment and team management
- User profile management

### **Team Management**  
- Create and manage teams
- Assign team leaders and members
- Team-based project access control

### **Project Management**
- Create, edit, and delete projects
- Project status tracking (Planning, Active, Completed, On-Hold)
- Priority levels and progress tracking
- Team-based project assignment

### **Dashboard & Analytics**
- Real-time project statistics
- Role-based data filtering
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas with Mongoose ODM
- **Deployment**: Vercel
- **API**: Next.js API Routes (Serverless Functions)

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with your MongoDB Atlas connection string:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project-monitoring?retryWrites=true&w=majority
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

### 1. Connect to Vercel

```bash
npx vercel
```

### 2. Set Environment Variables

In your Vercel dashboard, add:
- `MONGODB_URI`: Your MongoDB Atlas connection string

### 3. Deploy

```bash
npx vercel --prod
```

## API Endpoints

### Projects
- `GET /api/projects` - Fetch all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `GET /api/tasks` - Fetch tasks (optional project filter)
- `POST /api/tasks` - Create new task

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Set up database user and whitelist IP addresses
3. Get connection string from Atlas dashboard
4. Add connection string to environment variables

Built with ❤️ using Next.js and MongoDB Atlas
