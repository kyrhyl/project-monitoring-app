# Changelog

All notable changes to this project will be documented in this file.

## [2026-01-19] - Changes and Reversions

### REVERTED - Incorrect Manual Date Fields Addition ❌
**What was done incorrectly:**
- Added manual startDate and endDate input fields to EditProject.tsx component (lines 18-19, 84-85, 298-321, 342-356)
- Changed the design from auto-calculated dates to manual entry
- Did not check git history or understand the existing design before making changes

**Why it was wrong:**
- The system is designed to AUTO-CALCULATE project dates from task dates
- The `updateProjectDatesFromTasks()` function in `src/lib/updateProjectDates.ts` handles automatic date calculation
- API routes call this function after task operations (create, update, delete)
- Manual dates defeat the purpose of automatic date synchronization
- User's original complaint was about dates not auto-calculating properly, NOT about needing manual date entry

**Correct Implementation:**
- Project dates (startDate, endDate) should be READ-ONLY or auto-calculated from assigned tasks
- When tasks are added/updated/deleted, `updateProjectDatesFromTasks(projectId)` is called
- This function finds the earliest task start date and latest task end date
- Project dates are automatically updated in the database

**Files affected by incorrect changes:**
- `src/components/EditProject.tsx` - Added manual date fields (TO BE REVERTED)

**Proper design pattern:**
1. Tasks have individual startDate and endDate
2. Project startDate = MIN(all task startDates)
3. Project endDate = MAX(all task endDates)
4. This calculation happens server-side automatically via API
5. Frontend displays calculated dates as read-only

### ✅ COMPLETED - Reverted and Investigated Auto-Calculation
**Investigation findings:**
- The dates ARE being calculated by `updateProjectDatesFromTasks()` in `src/lib/updateProjectDates.ts`
- Terminal logs show: "Updated project 6913d8909a131ecd4f3d9c27: { startDate: 2026-01-15, endDate: 2026-01-23, progress: 40 }"
- Dates ARE being saved to database correctly
- ProjectDetailsPage.tsx (line 349) DOES display the dates: `{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}`
- EditProject.tsx now correctly shows info message about auto-calculation instead of manual fields

**How the system works (CORRECT DESIGN):**
1. When tasks are created/updated/deleted, API routes call `updateProjectDatesFromTasks(projectId)`
2. This function finds earliest task.startDate → project.startDate
3. This function finds latest task.dueDate → project.endDate
4. Dates are automatically saved to MongoDB
5. UI displays these auto-calculated dates from the database
6. Users should manage dates by editing TASKS, not the project itself

**Commit hash:** 00e99fb - Reverted manual date field changes

---

## Design Standards Reminder

### Before Making Changes:
1. **Check git history**: `git log --oneline`, `git diff`
2. **Search for existing functionality**: Use grep to find related code
3. **Read related files**: Check lib/, models/, api/ for existing patterns
4. **Understand the design**: Don't assume, verify the intended behavior
5. **Ask clarifying questions**: If unsure about user intent, investigate first

### Documentation Requirements:
- All major changes must be logged in CHANGELOG.md
- Include: What changed, Why it changed, Files affected
- Mark reversions clearly with ❌
- Document correct patterns for future reference
