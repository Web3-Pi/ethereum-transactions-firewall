const { authorized_addr_fn } = require('../../config/config');
const { readFileSync } = require('fs');



class UserSessionData {
    
    constructor() {
        this.authAddresses = {}

        try {
            const data = readFileSync(authorized_addr_fn);
            const rawDir = JSON.parse(data);
            Object.entries(rawDir).forEach(
                ([key, value]) => {
                    this.authAddresses[Web3.utils.toChecksumAddress(key)] = value;
                }
            );
        } catch (error) {
            console.log(`Error while reading file ${authorized_addr_fn} -> ${error}`);
        }

        console.log(this.authAddresses);
    }

    getLabel(addr) {
        return addr in this.authAddresses ? this.authAddresses[addr] : "unknown";
    }

}

exports.UserSessionData = UserSessionData;
