
const fs = require('fs');
const path = require('path');

const files = [
    "d:\\laragon\\www\\hrms\\backend\\src\\users\\users.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\services\\reviews.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\services\\objectives.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\services\\improvement-plans.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\services\\feedback.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\services\\campaigns.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\performance-examples.json",
    "d:\\laragon\\www\\hrms\\backend\\src\\performance\\services\\recognition.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\payslips\\payslips.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\orgchart\\orgchart.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\leaves\\leaves.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\fund-requests\\fund-requests.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\expenses\\expenses.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\employees\\employees.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\contracts\\contracts.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\auth\\auth.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\announcements\\announcements.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\attendance\\attendance.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\analytics\\analytics.service.ts",
    "d:\\laragon\\www\\hrms\\backend\\src\\advances\\advances.service.ts"
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const updatedContent = content.replace(/department_name/g, 'name');
        fs.writeFileSync(file, updatedContent, 'utf8');
        console.log(`Updated: ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
