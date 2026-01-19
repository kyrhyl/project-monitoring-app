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

### TODO - Investigate Why Auto-Calculation Isn't Visible
**User's actual issue:**
- The dates calculated by `updateProjectDatesFromTasks()` are being saved to database (visible in API logs)
- But these dates may not be showing properly in the UI
- Need to verify that ProjectDetailsPage and EditProject properly display the auto-calculated dates
- Timeline view calculates dates client-side for display but doesn't save them

**Next steps:**
1. Revert EditProject.tsx to remove manual date fields
2. Verify that auto-calculated dates from database are displayed in UI
3. Check if there's a caching issue preventing updated dates from showing
4. Ensure ProjectTimeline properly uses actualStartDate/actualEndDate from task calculations

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
