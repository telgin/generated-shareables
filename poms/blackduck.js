const apiKey = process.env.BLACKDUCK_API_KEY;
const apiUrl = process.env.BLACKDUCK_API_URL;

const getAppVulnerabilities = async (appName) => {
  try {
    const projectsResponse = await fetch(`${apiUrl}/projects`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const projects = await projectsResponse.json();
    const project = projects.items.find((project) => project.name === appName);

    if (!project) {
      console.error(`Project ${appName} not found`);
      return;
    }

    const versionsResponse = await fetch(`${project._meta.href}/versions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const versions = await versionsResponse.json();
    const version = versions.items[0];

    const vulnerabilitiesResponse = await fetch(`${version._meta.href}/vulnerable-components`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const vulnerabilitiesData = await vulnerabilitiesResponse.json();

    const vulnerabilities = vulnerabilitiesData.items.map((item) => {
      return {
        componentName: item.componentName,
        componentVersionName: item.componentVersionName,
        dependencyTree: item.component._meta.href, // Only the URL for the dependency tree is available through the API
        shortTermUpgrade: item.fixVersion.shortTerm,
        longTermUpgrade: item.fixVersion.longTerm,
      };
    });

    return vulnerabilities;
  } catch (error) {
    console.error(`Error fetching vulnerabilities: ${error.message}`);
  }
};

const appName = process.argv[2];

if (!appName) {
  console.error('Please provide an app name as an argument');
  process.exit(1);
}

getAppVulnerabilities(appName)
  .then((vulnerabilities) => {
    console.log('Vulnerabilities:');
    console.table(vulnerabilities);
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
  });