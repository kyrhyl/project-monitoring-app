# Multi-Project Resource Management Features

## Overview
New features to manage limited manpower across multiple projects by detecting schedule conflicts and providing team member-centric views.

## Features Implemented

### 1. Resource Conflict Detection ⚠️

**Purpose**: Automatically detect when team members have overlapping task assignments that could cause workload issues.

**How It Works**:
- Compares all tasks assigned to the same person
- Flags tasks with overlapping date ranges
- Shows visual warnings and conflict details

**Detection Logic**:
```typescript
// Detects if two tasks overlap
Task A: Jan 1-5
Task B: Jan 3-7
Result: CONFLICT (3-5 overlap)

Task A: Jan 1-5
Task B: Jan 6-10
Result: OK (no overlap)
```

**Visual Indicators**:
- 🔴 **Red border** around conflicting tasks
- ⚠️ **Warning badge** on member header showing conflict count
- 📋 **Detailed conflict list** showing:
  - Date range of conflict
  - Both conflicting tasks
  - Associated projects

### 2. Team Member Workload View 👥

**Purpose**: View timeline from a person-centric perspective to see individual workload across all projects.

**Features**:
- Toggle between **Project View** and **Member View**
- Groups all tasks by team member
- Shows tasks from multiple projects under each person
- Displays workload summary (task count, project count)
- Color-codes tasks by project
- Highlights conflicts prominently

**Member Card Shows**:
- Member initials in colored avatar
- Total task count across all projects
- Number of projects involved
- Conflict warnings if any
- Tasks grouped by project
- Completion status badges

### 3. View Mode Toggle

**Controls**:
- **Project View** (default): Traditional Gantt chart grouped by project
- **Member View**: Timeline grouped by team member

**Location**: Top right of timeline component, next to conflict badge

## Usage Guide

### Viewing Conflicts

1. **Navigate** to any page with ProjectTimeline component (Dashboard, Calendar, etc.)
2. **Look for** the red conflict badge in the header (if any exist)
3. **Click** "Member View" toggle button
4. **Review** team members with ⚠️ warning badges
5. **Read** detailed conflict descriptions in red boxes
6. **Adjust** task dates to resolve conflicts

### Checking Team Member Workload

1. **Toggle** to "Member View"
2. **Browse** team members and their task lists
3. **Review** task distribution across projects
4. **Identify** over-allocated or under-utilized members
5. **Check** completion progress with status badges

### Conflict Badge Features

- **Shows**: Total number of conflicts across all members
- **Color**: Red background for high visibility
- **Updates**: Automatically recalculates when tasks change
- **Clickable**: Opens member view for investigation

## Technical Details

### Data Structures

```typescript
// View mode options
type ViewMode = 'project' | 'member';

// Detected conflict
interface TaskConflict {
  task1: TaskWithProject;
  task2: TaskWithProject;
  member: string;
}

// Member workload summary
interface MemberWorkload {
  tasks: TaskWithProject[];
  projects: Set<string>;
}
```

### Conflict Detection Algorithm

```typescript
function detectConflicts(): Map<string, TaskConflict[]> {
  // 1. Group tasks by assigned member
  // 2. For each member's tasks:
  //    - Compare every task pair
  //    - Check if date ranges overlap
  //    - Store conflicts if found
  // 3. Return map of member -> conflicts
}
```

### Member Grouping Logic

```typescript
function groupTasksByMember(): Record<string, MemberWorkload> {
  // 1. Create map of members -> tasks
  // 2. For each task:
  //    - Add to member's task list
  //    - Track unique projects
  // 3. Return member workload data
}
```

## Visual Design

### Project View
- ✅ Traditional Gantt chart
- ✅ Projects in separate rows
- ✅ Tasks grouped under projects
- ✅ Phase color coding
- ✅ Completion badges

### Member View
- 👤 Member cards with avatars
- 📊 Workload statistics
- ⚠️ Conflict warnings
- 🎨 Project color-coding
- ✅ Completion status
- 🔴 Conflict highlighting

### Color Scheme

**Conflict Indicators**:
- Border: `border-red-500` (thick red border)
- Background: `bg-red-50` (light red tint)
- Badge: `bg-red-500` (solid red)
- Shadow: `shadow-red-300` (red glow)

**Member Headers**:
- Gradient: `from-indigo-600 to-purple-600`
- Avatar: White with 20% opacity background
- Text: White on gradient

**Task Status**:
- Early: Green badge ✅
- On Time: Blue badge ✅
- Late: Red badge ✅

## Performance Considerations

- **Conflict Detection**: O(n²) per member (where n = tasks assigned)
- **Member Grouping**: O(m) (where m = total tasks)
- **Rendering**: Virtualization not implemented (suitable for <1000 tasks)
- **Re-calculation**: Runs on every render (consider memoization for large datasets)

## Future Enhancements

**Potential Additions**:
1. **Capacity Planning**: Show total hours vs. available hours per member
2. **Auto-Resolution**: Suggest alternative dates to resolve conflicts
3. **Load Balancing**: Recommend task redistribution
4. **Time Tracking**: Actual hours vs. estimated hours
5. **Skills Matrix**: Match tasks to member skills
6. **Workload Heatmap**: Visual calendar showing busy periods
7. **Export**: Generate workload reports
8. **Notifications**: Alert team leaders about new conflicts

## Integration Points

**Used In**:
- Dashboard (all projects timeline)
- Calendar view
- Any component using ProjectTimeline

**Dependencies**:
- Task model (with assignedTo field)
- Project data (for project names)
- Date utilities (for overlap detection)

## Examples

### Conflict Scenario
```
Member: John Doe
Conflict: Jan 15-20

Task 1: "Foundation Work" (Project A)
Dates: Jan 15 - Jan 20

Task 2: "Electrical Rough-in" (Project B)  
Dates: Jan 18 - Jan 25

Overlap: Jan 18-20 (3 days)
Action Required: Adjust dates or reassign one task
```

### Workload Distribution
```
Member: Jane Smith
Tasks: 5 across 3 projects
Projects: Building A, Building B, Building C
Status: 2 completed, 3 in progress
Conflicts: None ✅
```

## Best Practices

1. **Review Conflicts Weekly**: Check member view for new conflicts
2. **Balance Workload**: Distribute tasks evenly across team
3. **Plan Ahead**: Use timeline to anticipate busy periods
4. **Communicate Changes**: Notify team members of schedule adjustments
5. **Track Completion**: Monitor completion badges to ensure progress
6. **Resolve Quickly**: Address conflicts before they impact deadlines

## Troubleshooting

**No conflicts shown but tasks seem to overlap**:
- Check if tasks have same assignedTo value (exact match required)
- Verify task dates are properly set
- Ensure tasks are in "pending" or "in-progress" status

**Member not appearing in member view**:
- Verify member has at least one assigned task
- Check task has valid assignedTo field
- Confirm task belongs to a project in timeline

**Conflicts not clearing after date change**:
- Refresh the page to recalculate
- Verify date change was saved to database
- Check that date ranges no longer overlap

## Summary

These features provide essential tools for managing limited manpower across multiple concurrent projects:

✅ **Conflict Detection** - Prevents double-booking team members  
✅ **Member View** - Shows individual workload at a glance  
✅ **Visual Warnings** - Highlights problems before they occur  
✅ **Cross-Project Visibility** - See complete picture per person  
✅ **Completion Tracking** - Monitor progress and performance  

**Result**: Better resource allocation, fewer scheduling conflicts, improved project coordination.
