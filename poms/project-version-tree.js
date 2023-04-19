const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const getDependencyParents = async (folder, { groupId, artifactId, version }) => {
  try {
    const { stdout } = await execAsync('mvn dependency:tree', { cwd: folder });
    const regex = new RegExp(`\\[INFO] (\\+-|\\\\- )(${groupId}:${artifactId}:${version}:[^:]+:(compile|runtime|provided|test))`);
    const lines = stdout.split('\n');
    const dependencyParents = [];

    lines.forEach((line, index) => {
      if (regex.test(line)) {
        const parentLine = lines[index - 1];
        const parentMatch = parentLine.match(/(\S+):(\S+):(\S+):/);
        if (parentMatch) {
          const [_, parentGroupId, parentArtifactId, parentVersion] = parentMatch;
          dependencyParents.push({
            groupId: parentGroupId,
            artifactId: parentArtifactId,
            version: parentVersion,
          });
        }
      }
    });

    return dependencyParents;
  } catch (error) {
    console.error(`Error fetching dependency parents: ${error.message}`);
  }
};

const folder = '/path/to/your/project';
const dependency = {
  groupId: 'org.springframework',
  artifactId: 'spring-web',
  version: '5.3.0',
};

getDependencyParents(folder, dependency)
  .then((parents) => {
    console.log('Dependency parents:');
    console.table(parents);
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
  });
