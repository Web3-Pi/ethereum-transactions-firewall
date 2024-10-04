const { Web3 } = require('web3'); 

const { authorized_addr_fn, known_contracts_fn, contract_abis_fn } = require('../../config/config');
const { readJSONDict, printElements, printKeys } = require('../common/util/jsonutil');
const { ContractDataParser } = require('../common/transactions/contracts/contractDataParser');


class UserSessionData {

    constructor(endpointUrl) {
        this.authAddresses = readJSONDict(authorized_addr_fn, Web3.utils.toChecksumAddress);
        const knownContracts = readJSONDict(known_contracts_fn, Web3.utils.toChecksumAddress);
        const knownABIs = readJSONDict(contract_abis_fn);

        printElements("Authorized addresses:", this.authAddresses);
        printElements("\nKnown contracts:", knownContracts);
        printKeys("\nContracts with ABIs", knownABIs);

        this.contractDataParser = new ContractDataParser(endpointUrl, knownContracts, knownABIs, (addr) => { return this.getLabel(addr); });
    }

    getLabel(addr) {
        const csaddr = Web3.utils.toChecksumAddress(addr);
        return csaddr in this.authAddresses ? this.authAddresses[csaddr] : "unknown";
    }

    parseContractData(addr, data) {
        return this.contractDataParser.parseContractData(addr, data);
    }

}

exports.UserSessionData = UserSessionData;
