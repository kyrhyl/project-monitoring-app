// Add contract data through the API
async function addContractDataToProject() {
    try {
        // First, get a project ID from the public API
        const projectsResponse = await fetch('http://localhost:3000/api/public/projects?page=1&limit=1');
        const projectsData = await projectsResponse.json();
        
        if (projectsData.success && projectsData.data.length > 0) {
            const projectId = projectsData.data[0]._id;
            console.log('Found project ID:', projectId);
            
            // Get current project data
            const projectResponse = await fetch(`http://localhost:3000/api/public/projects/${projectId}`);
            const projectData = await projectResponse.json();
            console.log('Current project data:', JSON.stringify(projectData.data, null, 2));
            
        } else {
            console.log('No projects found');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

addContractDataToProject();