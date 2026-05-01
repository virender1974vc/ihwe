const pkg = require('../package.json');
const dependencies = Object.keys(pkg.dependencies);

console.log(`Checking ${dependencies.length} dependencies...`);

const missing = [];

for (const dep of dependencies) {
    try {
        require(dep);
        console.log(`✅ ${dep}`);
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(dep)) {
            console.log(`❌ ${dep} (NOT INSTALLED)`);
            missing.push(dep);
        } else {
            console.log(`⚠️  ${dep} (Found, but errored: ${e.message})`);
        }
    }
}

if (missing.length > 0) {
    console.log('\nMissing dependencies:', missing.join(', '));
    console.log('Action: Run npm install');
} else {
    console.log('\nAll dependencies are present.');
}
