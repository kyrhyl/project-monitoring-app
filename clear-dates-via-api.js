const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function clearAllProjectDates() {
  try {
    console.log('Fetching all projects...');
    
    // Get all projects first
    const response = await fetch(`${API_BASE}/projects`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch projects: ' + data.error);
    }
    
    const projects = data.data;
    console.log(`Found ${projects.length} projects`);
    
    let projectsWithDates = 0;
    let updatedProjects = 0;
    
    // Count projects with dates
    projects.forEach(project => {
      if (project.startDate || project.endDate) {
        projectsWithDates++;
      }
    });
    
    console.log(`Projects with dates before clearing: ${projectsWithDates}`);
    
    // Update each project to remove dates
    for (const project of projects) {
      if (project.startDate || project.endDate) {
        console.log(`Clearing dates for: ${project.name}`);
        
        const updateData = {
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          progress: project.progress || 0,
          startDate: '', // Empty string to clear
          endDate: '',   // Empty string to clear
          contractId: project.contractId || '',
          contractName: project.contractName || '',
          appropriation: project.appropriation || '',
          location: project.location || '',
          approvedBudgetContract: project.approvedBudgetContract || null,
          contractDuration: project.contractDuration || '',
          fundingSource: project.fundingSource || ''
        };
        
        const updateResponse = await fetch(`${API_BASE}/projects/${project._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          updatedProjects++;
          console.log(`✓ Cleared dates for: ${project.name}`);
        } else {
          console.error(`✗ Failed to update ${project.name}: ${updateResult.error}`);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\nOperation completed:`);
    console.log(`- Projects with dates found: ${projectsWithDates}`);
    console.log(`- Projects successfully updated: ${updatedProjects}`);
    
  } catch (error) {
    console.error('Error clearing project dates:', error);
  }
}

// Run the script
clearAllProjectDates();