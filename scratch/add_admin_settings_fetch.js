const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add State
if (content.indexOf('const [availableStalls, setAvailableStalls]') !== -1) {
    content = content.replace('const [availableStalls, setAvailableStalls] = useState([]);', 'const [availableStalls, setAvailableStalls] = useState([]);\n    const [settings, setSettings] = useState(null);');
}

// Add Fetch
if (content.indexOf("const cityRes = await api.get('/api/crm-cities');") !== -1) {
    content = content.replace("const cityRes = await api.get('/api/crm-cities');", "const cityRes = await api.get('/api/crm-cities');\n                const settingsRes = await api.get('/api/settings');");
    content = content.replace("if (cityRes.data.data) setCities(cityRes.data.data);", "if (cityRes.data.data) setCities(cityRes.data.data);\n                if (settingsRes.data.success) setSettings(settingsRes.data.data);");
}

fs.writeFileSync(filePath, content);
console.log('Settings state and fetch added to Admin.');
