// Main standards
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json" with { type: "json" };
import ERC721 from "@openzeppelin/contracts/build/contracts/ERC721.json" with { type: "json" };
import ERC1155 from "@openzeppelin/contracts/build/contracts/ERC1155.json" with { type: "json" };
import ERC4626 from "@openzeppelin/contracts/build/contracts/ERC4626.json" with { type: "json" };

// Popular interfaces
import IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json" with { type: "json" };
import IERC721 from "@openzeppelin/contracts/build/contracts/IERC721.json" with { type: "json" };
import IERC1155 from "@openzeppelin/contracts/build/contracts/IERC1155.json" with { type: "json" };

// Popular extensions
import ERC20Burnable from "@openzeppelin/contracts/build/contracts/ERC20Burnable.json" with { type: "json" };
import ERC721URIStorage from "@openzeppelin/contracts/build/contracts/ERC721URIStorage.json" with { type: "json" };

// Popular utility contracts
import Ownable from "@openzeppelin/contracts/build/contracts/Ownable.json" with { type: "json" };
import AccessControl from "@openzeppelin/contracts/build/contracts/AccessControl.json" with { type: "json" };
import Pausable from "@openzeppelin/contracts/build/contracts/Pausable.json" with { type: "json" };

export const standardABIs = [
  // Main standards
  {
    name: `${ERC20.contractName} (Fungible Token)`,
    abi: ERC20.abi,
  },
  {
    name: `${ERC721.contractName} (Non-Fungible Token)`,
    abi: ERC721.abi,
  },
  {
    name: `${ERC1155.contractName} (Multi Token Standard)`,
    abi: ERC1155.abi,
  },
  {
    name: `${ERC4626.contractName} (Tokenized Vault)`,
    abi: ERC4626.abi,
  },

  // Interfaces
  {
    name: `${IERC20.contractName} (Fungible Token Interface)`,
    abi: IERC20.abi,
  },
  {
    name: `${IERC721.contractName} (NFT Interface)`,
    abi: IERC721.abi,
  },
  {
    name: `${IERC1155.contractName} (Multi Token Interface)`,
    abi: IERC1155.abi,
  },

  // Extensions
  {
    name: `${ERC20Burnable.contractName} (Burnable Token Extension)`,
    abi: ERC20Burnable.abi,
  },
  {
    name: `${ERC721URIStorage.contractName} (URI Storage Extension)`,
    abi: ERC721URIStorage.abi,
  },

  // Utility contracts
  {
    name: `${Ownable.contractName} (Ownership Management)`,
    abi: Ownable.abi,
  },
  {
    name: `${AccessControl.contractName} (Role-Based Access Control)`,
    abi: AccessControl.abi,
  },
  {
    name: `${Pausable.contractName} (Pausable Contract)`,
    abi: Pausable.abi,
  },
];
