import { ethers } from "ethers";
import { standardABIs } from "../../src/transactions/standard-abis.js";

const provider = new ethers.JsonRpcProvider("http://localhost:19500");

const privateKeys = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
];

export const wallets = privateKeys.map(
  (key) => new ethers.Wallet(key, provider),
);

export const createContract = (
  address: string,
  abi: any,
  signer = wallets[0],
) => {
  return new ethers.Contract(address, abi, signer);
};

const generateTestAddresses = (count: number) => {
  return Array.from({ length: count }, () => {
    const randomBytes = ethers.randomBytes(20);
    const address = ethers.hexlify(randomBytes);
    return ethers.getAddress(address);
  });
};

interface ContractData {
  address: string;
  abi: any;
  name: string;
  create: (signer?: ethers.Wallet) => ethers.Contract;
}

interface ContractsMap {
  [key: string]: ContractData;
}

export const testContracts = (() => {
  const addresses = generateTestAddresses(standardABIs.length);

  const contracts: ContractsMap = {};

  standardABIs.forEach((standard, index) => {
    const key = standard.name.split(" ")[0].toLowerCase();

    const address = addresses[index];
    const abi = standard.abi;

    contracts[key] = {
      address,
      abi,
      name: standard.name,
      create: (signer = wallets[0]) => createContract(address, abi, signer),
    };
  });

  return contracts;
})();
