# Project Planning & Scheduling Guide

## Overview
Enhanced timeline features to help plan and schedule multiple projects with limited manpower, avoiding resource conflicts and optimizing team utilization.

## New Features

### 📅 Planning Information Panel

**Access**: Click "Show Planning Info" button in the timeline header

**What It Shows**:

#### 1. **Project Durations & Team Assignments**
- **Start & End Dates**: See when each project begins and ends
- **Duration Calculation**: Automatic calculation in days and weeks
- **Team Members**: List of all team members assigned to each project
- **Conflict Indicators**: Red badges show projects with scheduling conflicts
- **Visual Status**: Green = No conflicts, Red = Has conflicts

**Use Cases**:
- Determine expected project duration before starting
- See who is assigned to which project
- Identify projects that need schedule adjustments

#### 2. **Team Member Availability & Utilization**
- **Utilization Percentage**: Shows how busy each team member is
- **Visual Progress Bar**: 
  - 🟢 Green (0-50%): Under-utilized, has capacity
  - 🟡 Yellow (50-80%): Well-balanced workload
  - 🔴 Red (80%+): Over-utilized, may be overworked
- **Busy Periods**: Lists all scheduled task periods
- **Available Periods**: Shows gaps when member is free
- **Sorted by Utilization**: Busiest members appear first

**Use Cases**:
- Find available team members for new tasks
- Identify who is overloaded
- Plan when to schedule new projects

#### 3. **Planning Recommendations**
Smart suggestions based on current schedule:

**⚠️ Conflict Alerts**:
- Shows number of overlapping assignments
- Recommends adjusting dates or reassigning tasks

**⚡ Over-Utilization Warnings**:
- Flags team members with >80% utilization
- Suggests redistributing tasks or extending timelines

**📋 Under-Utilization Notices**:
- Identifies team members with <30% utilization
- Recommends assigning additional tasks

**✅ Healthy Schedule Confirmation**:
- Confirms when schedule is well-balanced
- Displays when no conflicts exist

## How to Use for Project Planning

### Scenario 1: Starting a New Project

**Goal**: Determine when to schedule a new project to avoid conflicts

**Steps**:
1. Go to **Dashboard** or **/timeline**
2. Click **"Show Planning Info"**
3. Review **Team Member Availability** section
4. Look for members with:
   - Low utilization percentage (green)
   - Available periods in their schedule
5. Check **Available Periods** dates
6. Schedule new project during these available periods
7. Assign tasks to under-utilized team members

**Example**:
```
John Doe: 35% Utilized
Available Periods:
- Feb 15, 2026 - Mar 1, 2026
- Mar 20, 2026 - Apr 5, 2026

✅ Can assign new project tasks during these dates
```

### Scenario 2: Resolving Resource Conflicts

**Goal**: Fix overlapping task assignments

**Steps**:
1. Notice red **Conflict Warning** badge in header
2. Click **"Show Planning Info"**
3. Look for projects with 🚨 red badges in **Project Durations**
4. Switch to **"By Member"** view
5. Find team members with conflict warnings
6. Review **Busy Periods** to see overlapping dates
7. Adjust task dates in one of the conflicting projects
8. Verify conflicts are resolved

**Example**:
```
Jane Smith - 2 Conflicts
Busy Periods:
- Building A: Jan 15 - Jan 30
- Building B: Jan 25 - Feb 10

⚠️ Conflict: Jan 25-30 (overlap)
✅ Solution: Move Building B to start Feb 1
```

### Scenario 3: Balancing Team Workload

**Goal**: Ensure fair distribution of work across team

**Steps**:
1. Open **Planning Info**
2. Check **Team Member Availability** section
3. Identify:
   - Over-utilized (>80%): Red bars
   - Under-utilized (<30%): Green bars
4. Move tasks from red to green team members
5. Monitor utilization bars until balanced

**Example**:
```
Before:
- John: 95% Utilized (Red) ← Too busy
- Jane: 25% Utilized (Green) ← Has capacity

Action: Reassign 2 tasks from John to Jane

After:
- John: 65% Utilized (Yellow) ✅
- Jane: 55% Utilized (Yellow) ✅
```

### Scenario 4: Estimating Project Timeline

**Goal**: Calculate how long a project will take

**Steps**:
1. Open **Planning Info**
2. Review **Project Durations** section
3. Find your project
4. Check:
   - Duration in days/weeks
   - Start and end dates
   - Number of team members assigned
5. Use this to set realistic deadlines

**Example**:
```
Building C Project:
📆 Jan 15, 2026 → Mar 20, 2026
Duration: 64 days (10 weeks)
Team Members: 4 (John, Jane, Mike, Sarah)

✅ Inform client: ~10 weeks timeline
```

## View Modes

### 📊 By Project (Default)
- Traditional Gantt chart
- Projects in separate rows
- Best for: Seeing overall project progress

### 👥 By Member
- Groups tasks by team member
- Shows all assignments per person
- Best for: Resource management, conflict detection

### 📅 Planning Info Panel (Toggle)
- Analytical overview
- Duration calculations
- Availability analysis
- Best for: Strategic planning, scheduling

## Tips for Effective Planning

### 1. Regular Reviews
- Check planning panel weekly
- Monitor utilization percentages
- Address conflicts immediately

### 2. Proactive Scheduling
- Review availability before assigning tasks
- Leave buffer time between projects
- Don't overload team members (keep below 80%)

### 3. Conflict Prevention
- Assign tasks to available periods
- Stagger project start dates
- Cross-train team members for flexibility

### 4. Capacity Planning
- Track utilization trends
- Identify if more team members needed
- Plan for peak busy periods

### 5. Communication
- Share planning panel with team leaders
- Discuss workload during meetings
- Adjust schedules based on feedback

## Key Metrics Explained

### Utilization Percentage
```
Calculation: (Busy Days / Total Days in Range) × 100

Ideal Range: 50-80%
- Below 50%: Has capacity for more work
- 50-80%: Healthy workload
- Above 80%: Risk of burnout
```

### Duration Calculation
```
Duration (days) = End Date - Start Date
Duration (weeks) = Duration (days) ÷ 7 (rounded up)
```

### Conflict Detection
```
Conflict exists when:
Task A: Jan 15 - Jan 25
Task B: Jan 20 - Jan 30
Overlap: Jan 20-25 ← Conflict

Same member assigned to both tasks
```

## Recommendations by Scenario

### New Company (Few Projects)
✅ Focus on: Finding available members
📋 Action: Check green utilization bars

### Growing Company (Multiple Projects)
✅ Focus on: Balancing workload
📋 Action: Keep utilization 50-80% for all

### Busy Season (Many Projects)
✅ Focus on: Preventing conflicts
📋 Action: Review conflicts daily, stagger projects

### Limited Team (Few Members)
✅ Focus on: Optimal scheduling
📋 Action: Use available periods to sequence projects

## Summary

**Use Planning Panel When**:
- ✅ Starting a new project
- ✅ Assigning tasks to team members  
- ✅ Resolving scheduling conflicts
- ✅ Estimating project timelines
- ✅ Balancing team workload
- ✅ Determining resource needs

**Key Benefits**:
- 📊 Data-driven scheduling decisions
- ⚠️ Early conflict detection
- 👥 Optimized resource utilization
- 📅 Realistic timeline estimates
- ✅ Better team management

---

**Quick Access**: Dashboard → Scroll to Timeline → Click "Show Planning Info"
