const { Web3 } = require('web3'); 
const { authorized_addr_fn } = require('../../config/config');
const { readFileSync } = require('fs');



class UserSessionData {
    
    constructor() {
        this.authAddresses = {}

        try {
            Object.entries(JSON.parse(readFileSync(authorized_addr_fn))).forEach(
                ([key, value]) => {
                    this.authAddresses[Web3.utils.toChecksumAddress(key)] = value;
            });
        } catch (error) {
            console.log(`Error while reading file ${authorized_addr_fn} -> ${error}`);
        }
    
        console.log("Authorized addresses:");
        Object.entries(this.authAddresses).forEach(
            ([key, value]) => console.log(`${key}: ${value}`)
        );
    }

    getLabel(addr) {
        return Web3.utils.toChecksumAddress(addr) in this.authAddresses ? this.authAddresses[addr] : "unknown";
    }

}

exports.UserSessionData = UserSessionData;
