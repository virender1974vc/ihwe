const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MessageTemplate = require('./models/MessageTemplate');

dotenv.config({ path: './.env' });

const fixTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB');

        const templates = await MessageTemplate.find({});

        for (const template of templates) {
            let body = template.emailBody;
            if (!body) continue;

            let updated = false;

            // Replace <div style="..."> with <table ...><tr><td style="...">
            const divRegex = /<div\s+style="([^"]+)">([\s\S]*?)<\/div>/gi;
            
            body = body.replace(divRegex, (match, styleAttr, innerContent) => {
                // If it doesn't have background, padding, or border, maybe leave it, 
                // but the ones we care about all have background, padding, border.
                if (styleAttr.includes('background') || styleAttr.includes('padding') || styleAttr.includes('border')) {
                    // Extract margin to move to table, or just keep it simple
                    let tableMargin = '20px 0';
                    if (styleAttr.includes('margin: 25px 0')) tableMargin = '25px 0';
                    if (styleAttr.includes('margin: 20px 0')) tableMargin = '20px 0';
                    if (styleAttr.includes('margin: 15px 0')) tableMargin = '15px 0';
                    if (styleAttr.includes('margin-bottom: 25px')) tableMargin = '0 0 25px 0';
                    
                    // Replace background with background-color to be safer for outlook
                    let tdStyle = styleAttr.replace(/background:\s*([^;]+);/g, 'background-color: $1;');
                    
                    return `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: ${tableMargin};">\n<tr>\n<td style="${tdStyle}">\n${innerContent}\n</td>\n</tr>\n</table>`;
                }
                return match;
            });

            if (body !== template.emailBody) {
                template.emailBody = body;
                await template.save();
                console.log(`Updated template: ${template.formType}`);
            }
        }

        console.log('Done fixing templates');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing templates:', error);
        process.exit(1);
    }
};

fixTemplates();
