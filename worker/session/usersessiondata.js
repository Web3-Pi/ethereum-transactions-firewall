const { authorized_addr_fn } = require('../../config/config');
const { readFileSync } = require('fs');



class UserSessionData {
    
    constructor() {
        this.authAddresses = {}

        try {
            const data = readFileSync(authorized_addr_fn);
            this.authAddresses = JSON.parse(data);    
        } catch (error) {
            console.log(`Error while reading file ${authorized_addr_fn} -> ${error}`);
        }    
    }

    getLabel(addr) {
        return addr in this.authAddresses ? this.authAddresses[addr] : "unknown";
    }

}

exports.UserSessionData = UserSessionData;
