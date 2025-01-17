function tsvJSON(tsv) {
    const lines = tsv.split("\n");
    const result = [];
    const headers = lines[0].split("\t");

    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentline = lines[i].split("\t");

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }

        result.push(obj);
    }

    return result;
}

if (process.argv.length < 4) {
    console.log('Usage: node conversor.js <input_file> <output_file>');
    process.exit(1);
}

const { readFileSync, writeFileSync } = require('fs');
const tsvFileData = readFileSync(process.argv[2]);
const jsonRes = tsvJSON(tsvFileData.toString());
writeFileSync(process.argv[3], JSON.stringify(jsonRes, null, 2));

console.log(JSON.stringify(jsonRes));