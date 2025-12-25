const path = require('path');
const fs = require('fs');

function testExistence() {
    const cwd = process.cwd();
    console.log(`Current Working Directory: ${cwd}`);

    const relativePath = path.join(cwd, '..', 'uploads', 'settings');
    console.log(`Constructed Relative Path: ${relativePath}`);
    console.log(`Relative Path exists: ${fs.existsSync(relativePath)}`);

    const absolutePath = 'd:\\laragon\\www\\hrms\\uploads\\settings';
    console.log(`Hardcoded Absolute Path: ${absolutePath}`);
    console.log(`Hardcoded Path exists: ${fs.existsSync(absolutePath)}`);

    const file = 'logo_light-1766695902837.png';
    const fullPath = path.join(absolutePath, file);
    console.log(`Full File Path: ${fullPath}`);
    console.log(`File exists: ${fs.existsSync(fullPath)}`);
}

testExistence();
