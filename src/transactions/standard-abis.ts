// Main standards
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json" with { type: "json" };
import ERC721 from "@openzeppelin/contracts/build/contracts/ERC721.json" with { type: "json" };
import ERC1155 from "@openzeppelin/contracts/build/contracts/ERC1155.json" with { type: "json" };
import ERC4626 from "@openzeppelin/contracts/build/contracts/ERC4626.json" with { type: "json" };

// Popular extensions
import ERC20Burnable from "@openzeppelin/contracts/build/contracts/ERC20Burnable.json" with { type: "json" };

// Popular utility contracts
import Ownable from "@openzeppelin/contracts/build/contracts/Ownable.json" with { type: "json" };
import AccessControl from "@openzeppelin/contracts/build/contracts/AccessControl.json" with { type: "json" };

export const standardABIs = [
  // Main standards
  {
    name: ERC20.contractName,
    description: "Fungible Token",
    abi: ERC20.abi,
  },
  {
    name: ERC721.contractName,
    description: "Non-Fungible Token",
    abi: ERC721.abi,
  },
  {
    name: ERC1155.contractName,
    description: "Multi Token Standard",
    abi: ERC1155.abi,
  },
  {
    name: ERC4626.contractName,
    description: "Tokenized Vault",
    abi: ERC4626.abi,
  },

  // Extensions
  {
    name: ERC20Burnable.contractName,
    description: "Burnable Token Extension",
    abi: ERC20Burnable.abi,
  },

  // Utility contracts
  {
    name: Ownable.contractName,
    description: "Ownership Management",
    abi: Ownable.abi,
  },
  {
    name: AccessControl.contractName,
    description: "Role-Based Access Control",
    abi: AccessControl.abi,
  },
];
