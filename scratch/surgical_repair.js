const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 1. Keep everything up to line 345 (Clean part of rate calc)
const part1 = lines.slice(0, 345);

// 2. Add correct closing for the catch and effect
const stitch = [
'            } catch (e) {',
'                console.error("Rate fetch error", e);',
'            }',
'        };',
'        updateRate();',
'    }, [selectedEventId, formData.participation.stallType, formData.participation.currency]);'
];

// 3. Keep the NEXT clean part (the Total Calc Effect)
// I'll search for the first occurrence of "// Final Total Calculation" AFTER line 400
let totalCalcStart = -1;
for(let i = 400; i < lines.length; i++) {
    if (lines[i].includes('// Final Total Calculation')) {
        totalCalcStart = i;
        break;
    }
}

if (totalCalcStart === -1) {
    console.log("Could not find Total Calc start.");
    process.exit(1);
}

const part2 = lines.slice(totalCalcStart);

// JOIN
const final = part1.concat(stitch).concat(part2).join('\n');

fs.writeFileSync(filePath, final);
console.log("Repair Complete.");
