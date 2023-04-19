const fs = require('fs');
const glob = require('glob');
const xml2js = require('xml2js');
const yaml = require('js-yaml');

// Load YAML configuration file
const configPath = 'config.yaml'; // Replace with the path to your YAML file
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

// Function to process pom.xml files
function processPomFile(file) {
    const content = fs.readFileSync(file);
    xml2js.parseString(content, (err, result) => {
        if (err) throw err;

        const dependencies = result.project.dependencies[0].dependency;

        // Modify dependencies based on the YAML configuration
        config.forEach((action) => {
            const index = dependencies.findIndex(
                (dep) => dep.groupId[0] === action.groupId && dep.artifactId[0] === action.artifactId
            );

            if (action.type === 'insert' && index === -1) {
                dependencies.push({
                    groupId: [action.groupId],
                    artifactId: [action.artifactId],
                    version: [action.version],
                });
            } else if (action.type === 'modify' && index !== -1) {
                dependencies[index].version = [action.version];
            } else if (action.type === 'delete' && index !== -1) {
                dependencies.splice(index, 1);
            }
        });

        // Rebuild and save the modified XML
        const builder = new xml2js.Builder();
        const xml = builder.buildObject(result);
        fs.writeFileSync(file, xml);
    });
}

// List of folder locations
const folderLocations = [
    'folder1', // Replace with your folder paths
    'folder2',
    'folder3',
];

// Iterate through folder locations and process pom.xml files
folderLocations.forEach((folder) => {
    glob(`${folder}/**/pom.xml`, (err, files) => {
        if (err) throw err;
        files.forEach(processPomFile);
    });
});