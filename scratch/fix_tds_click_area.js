const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldBlockStart = '{[0, 1, 2, 10].map((val) => (';
const oldBlockEnd = ')})}'; // Just kidding, I'll find better markers

const findPattern = /\{\[0, 1, 2, 10\]\.map\(\(val\) => \(\s+<label key=\{val\} className="flex items-center gap-2 cursor-pointer group">\s+<div\s+onClick=\{\(\) => setFormData\(p => \(\{ \.\.\.p, chosenTdsPercent: val \}\)\)\}/;

const newBlock = `{[0, 1, 2, 10].map((val) => (
                                        <label 
                                            key={val} 
                                            onClick={() => setFormData(p => ({ ...p, chosenTdsPercent: val }))}
                                            className="flex items-center gap-2 cursor-pointer group"
                                        >
                                            <div`;

if (content.indexOf('onClick={() => setFormData(p => ({ ...p, chosenTdsPercent: val }))}') !== -1) {
     // Replace the wrapper
     content = content.replace('<label key={val} className="flex items-center gap-2 cursor-pointer group">', '<label key={val} onClick={() => setFormData(p => ({ ...p, chosenTdsPercent: val }))} className="flex items-center gap-2 cursor-pointer group">');
     content = content.replace('onClick={() => setFormData(p => ({ ...p, chosenTdsPercent: val }))}', '');
     fs.writeFileSync(filePath, content);
     console.log('Admin TDS Clickable area fixed.');
} else {
    console.log('Pattern not found.');
}
