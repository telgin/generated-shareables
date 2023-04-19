const xml2js = require('xml2js');

const fetchVersionsWithDependencies = async (groupId, artifactId, version) => {
  const mavenCentralApiUrl = 'https://repo1.maven.org/maven2';
  const encodedGroupId = encodeURIComponent(groupId).replace(/\./g, '/');
  const encodedArtifactId = encodeURIComponent(artifactId);

  try {
    // Fetch all versions of the artifact
    const versionsResponse = await fetch(`${mavenCentralApiUrl}/${encodedGroupId}/${encodedArtifactId}/maven-metadata.xml`);
    const versionsXml = await versionsResponse.text();
    const versionsData = await xml2js.parseStringPromise(versionsXml);
    const versions = versionsData.metadata.versioning[0].versions[0].version;

    // Filter versions after (and including) the given version
    const filteredVersions = versions.filter((v) => v >= version);

    // Fetch POM files for each filtered version and extract direct dependencies
    const dependenciesPromises = filteredVersions.map(async (v) => {
      const pomResponse = await fetch(`${mavenCentralApiUrl}/${encodedGroupId}/${encodedArtifactId}/${v}/${encodedArtifactId}-${v}.pom`);
      const pomXml = await pomResponse.text();
      const pomData = await xml2js.parseStringPromise(pomXml);

      const dependencies = pomData.project.dependencies
        ? pomData.project.dependencies[0].dependency.map((dep) => ({
            groupId: dep.groupId[0],
            artifactId: dep.artifactId[0],
            version: dep.version ? dep.version[0] : undefined,
            scope: dep.scope ? dep.scope[0] : undefined
          }))
        : [];

      return {
        groupId,
        artifactId,
        version: v,
        dependencies: dependencies//.filter(d => d.version && d.scope !== 'test'),
      };
    });

    const result = await Promise.all(dependenciesPromises);
    return result.reverse();
  } catch (error) {
    console.error(`Error fetching versions and dependencies: ${error.message}`, error);
  }
};

const groupId = 'org.springframework';
const artifactId = 'spring-web';
const version = '5.3.0';

fetchVersionsWithDependencies(groupId, artifactId, version)
  .then((result) => {
    console.log('Versions with dependencies:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
  });
