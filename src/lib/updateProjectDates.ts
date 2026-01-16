import Task from '@/models/Task';
import Project from '@/models/Project';

/**
 * Calculates project progress based on task completion
 * @param projectId - The ID of the project
 * @returns Progress percentage (0-100)
 */
async function calculateProjectProgress(projectId: string): Promise<number> {
  try {
    const tasks = await Task.find({ projectId }).lean();
    
    if (tasks.length === 0) return 0;

    // Simple task count method
    const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  } catch (error) {
    console.error('Error calculating project progress:', error);
    return 0;
  }
}

/**
 * Updates a project's start and end dates based on its tasks
 * @param projectId - The ID of the project to update
 */
export async function updateProjectDatesFromTasks(projectId: string): Promise<void> {
  try {
    // Find all tasks for this project that have dates
    const tasks = await Task.find({ 
      projectId,
      $or: [
        { startDate: { $exists: true, $ne: null } },
        { dueDate: { $exists: true, $ne: null } }
      ]
    }).lean();

    if (tasks.length === 0) {
      // No tasks with dates, clear project dates
      await Project.findByIdAndUpdate(projectId, {
        $unset: { startDate: "", endDate: "" }
      });
      return;
    }

    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;

    tasks.forEach(task => {
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        if (!earliestStart || startDate < earliestStart) {
          earliestStart = startDate;
        }
      }

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (!latestEnd || dueDate > latestEnd) {
          latestEnd = dueDate;
        }
      }
    });

    // Update project with calculated dates
    const updateData: any = {};
    if (earliestStart) {
      updateData.startDate = earliestStart;
    }
    if (latestEnd) {
      updateData.endDate = latestEnd;
    }

    // Calculate and update progress
    const progress = await calculateProjectProgress(projectId);
    updateData.progress = progress;

    if (Object.keys(updateData).length > 0) {
      await Project.findByIdAndUpdate(projectId, updateData);
      console.log(`Updated project ${projectId}:`, updateData);
    }
  } catch (error) {
    console.error('Error updating project dates from tasks:', error);
    throw error;
  }
}
