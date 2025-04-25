import { ContractParser } from "./parser.js";
import { ContractAbi } from "web3";
import { TransactionFactory } from "web3-eth-accounts";
import { ethers } from "ethers";
import { toBuffer } from "ethereumjs-util";

const authorizedAddresses = new Map<string, string>([
  ["0x1234567890abcdef1234567890abcdef12345678", "Authorized Address 1"],
  ["0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", "Authorized Address 2"],
]);

const knownContracts = new Map<string, { name: string; abi?: ContractAbi }>([
  [
    "0x9876543210fedcba9876543210fedcba98765432",
    {
      name: "Known Contract 1",
      abi: [
        {
          constant: true,
          inputs: [],
          name: "totalSupply",
          outputs: [{ name: "", type: "uint256" }],
          type: "function",
        },
        {
          constant: false,
          inputs: [
            { name: "_to", type: "address" },
            { name: "_value", type: "uint256" },
          ],
          name: "transfer",
          outputs: [{ name: "", type: "bool" }],
          type: "function",
        },
      ],
    },
  ],
  [
    "0xcdefcdefcdefcdefcdefcdefcdefcdefcdefcdef",
    {
      name: "Known Contract 2",
      abi: [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ],
    },
  ],
]);

const generateTypedTransaction = async ({
  contractAddress,
  methodName,
  args = [],
  value = 0,
}: {
  contractAddress: string;
  methodName: string;
  args?: unknown[];
  value?: string | number;
}) => {
  const privateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey);
  const knownContract = knownContracts.get(contractAddress);
  const contractAbi = knownContract?.abi;
  if (!contractAbi) throw new Error("Known contract not found");

  const contractInterface = new ethers.Interface(contractAbi);
  const data = contractInterface.encodeFunctionData(methodName, args);

  const unsignedTx = {
    to: contractAddress,
    data: data,
    gasLimit: BigInt(21000),
    gasPrice: BigInt(1000000000),
    maxFeePerGas: BigInt(1000000000),
    maxPriorityFeePerGas: BigInt(1000000000),
    nonce: 0,
    chainId: 1,
    value: ethers.parseEther(value.toString()),
  };

  const signedTx = await wallet.signTransaction(unsignedTx);

  return TransactionFactory.fromSerializedData(toBuffer(signedTx));
};

describe("ContractParser", () => {
  const parser = new ContractParser();
  parser.loadConfig(authorizedAddresses, knownContracts);

  test("should parse transaction data to contract info", async () => {
    const tx = await generateTypedTransaction({
      contractAddress: "0x9876543210fedcba9876543210fedcba98765432",
      methodName: "transfer",
      args: ["0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD", "100"],
    });
    const contractInfo = parser.getContractInfo(tx, "contract-call");
    expect(contractInfo).toEqual({
      address: "0x9876543210fedcba9876543210fedcba98765432",
      args: [
        {
          label: "Authorized Address 2",
          name: "_to",
          type: "address",
          value: "0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD",
        },
        {
          name: "_value",
          type: "uint256",
          value: "100",
        },
      ],
      functionName: "transfer",
      labelAddress: "Known Contract 1",
    });
  });
});
