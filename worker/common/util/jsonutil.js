const { readFileSync } = require('fs');


function readJSONDict(fn, formatter = (val) => val) {
    res = {}
    try {
        Object.entries(JSON.parse(readFileSync(fn))).forEach(
            ([key, value]) => {
                res[formatter(key)] = value;
        });
    } catch (error) {
        console.log(`Error while reading file ${fn} -> ${error}`);
    }

    return res;
}

function printKeys(msg, dct) {
    console.log(msg);
    Object.entries(dct).forEach(
        ([key, value]) => console.log(`${key}`)
    );
}

function printValues(msg, dct) {
    console.log(msg);
    Object.entries(dct).forEach(
        ([key, value]) => console.log(`${value}`)
    );
}

function printElements(msg, dct) {
    console.log(msg);
    Object.entries(dct).forEach(
        ([key, value]) => console.log(`${key}: ${value}`)
    );
}

exports.readJSONDict = readJSONDict;
exports.printKeys = printKeys;
exports.printValues = printValues;
exports.printElements = printElements;
