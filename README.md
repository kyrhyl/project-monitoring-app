# Project Monitoring App

A lightweight project monitoring web application built with Next.js 14, TypeScript, Tailwind CSS, and MongoDB Atlas. Optimized for Vercel deployment.

## Features

- 📊 **Project Dashboard** - Overview of all projects with real-time statistics
- 📝 **Project Management** - Create, edit, and delete projects
- 🎯 **Task Tracking** - Organize tasks within projects
- 📈 **Progress Monitoring** - Visual progress tracking for projects
- 🎨 **Modern UI** - Clean and responsive design with Tailwind CSS
- ⚡ **Fast Performance** - Serverless API routes with MongoDB Atlas
- 🚀 **Vercel Ready** - Optimized for seamless Vercel deployment

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
