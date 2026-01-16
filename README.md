# Project Monitoring App

A comprehensive team management and project monitoring application built with Next.js, TypeScript, and MongoDB Atlas. Features advanced role-based authentication, team management, task assignment, and project tracking capabilities.

## 🚀 **Features**

### **Authentication & Authorization**
- Role-based access control (Admin, Team Leader, Member)
- Secure JWT authentication with HTTP-only cookies
- Protected routes and API endpoints with granular permissions

### **Advanced User Management**
- Admin dashboard for user CRUD operations
- Role assignment and team management
- User profile management with team associations

### **Comprehensive Team Management**  
- Create and manage teams with designated leaders
- Assign specific team members to individual projects
- Dynamic team member management per project
- Team-based project access control with member-level permissions

### **Enhanced Project Management**
- Create, edit, and delete projects with team assignments
- Project status tracking (Planning, Active, Completed, On-Hold)
- Priority levels and progress tracking
- Project-specific team member management
- Detailed project views with tabbed interface

### **Advanced Task Assignment System** ⭐ NEW
- Task creation and assignment by team leaders
- Comprehensive task properties (priority, due dates, estimated hours)
- Task status management (To Do, In Progress, Completed)
- Member task updates and progress tracking
- Project-integrated task management

### **Enhanced Dashboard & Analytics**
- Real-time project statistics and team performance
- Personal "My Tasks" view for team members
- Role-based data filtering and access control
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas with Mongoose ODM
- **Deployment**: Vercel
- **API**: Next.js API Routes (Serverless Functions)

## 📁 Project Structure

```
project-monitoring-app/
├── docs/                    # Documentation and guides
├── scripts/                 # Setup and maintenance scripts
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and helpers
│   └── models/             # MongoDB models
├── public/                 # Static assets
└── .env.local              # Environment variables (not committed)
```

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure your environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string for JWT tokens
- `CLOUDINARY_*`: Your Cloudinary credentials (if using file uploads)

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Admin User (First Time Only)

```bash
npm run setup:admin
```

### 4. Run Development Server

```bash
npm run dev
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
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production

### 3. Deploy

```bash
npx vercel --prod
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript type checking
- `npm run setup:admin` - Create initial admin user
- `npm run setup:team-leader` - Create team leader user
- `npm run sync:teams` - Synchronize teams data

## API Endpoints

### Projects
- `GET /api/projects` - Fetch all projects (role-filtered)
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Project Team Management ⭐ NEW
- `GET /api/projects/[id]/members` - Get project members and available team members
- `POST /api/projects/[id]/members` - Add team members to project
- `DELETE /api/projects/[id]/members?memberId=X` - Remove member from project

### Task Management ⭐ NEW
- `GET /api/projects/[id]/tasks` - Fetch all tasks for a project
- `POST /api/projects/[id]/tasks` - Create new task with assignment
- `GET /api/projects/[id]/tasks/[taskId]` - Get specific task details
- `PUT /api/projects/[id]/tasks/[taskId]` - Update task (status, assignment, etc.)
- `DELETE /api/projects/[id]/tasks/[taskId]` - Delete task

### User & Authentication
- `GET /api/auth/user` - Get current user details with team info
- `GET /api/tasks?assignedToMe=true` - Fetch tasks assigned to current user

### Teams & Users
- `GET /api/teams` - Fetch all teams (admin only)
- `POST /api/teams` - Create new team (admin only)
- `GET /api/users` - Fetch all users (admin only)
- `POST /api/users` - Create new user (admin only)

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Set up database user and whitelist IP addresses
3. Get connection string from Atlas dashboard
4. Add connection string to environment variables

Built with ❤️ using Next.js and MongoDB Atlas
