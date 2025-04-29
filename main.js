
// --- Web3Modal v2 Setup ---
const projectId = 'ff2db6544a529027450c74a34fc4fb74' // Replace with your WalletConnect Project ID
const metadata = {
  name: 'My Dapp',
  description: 'My Dapp Description',
  url: 'https://yourdomain.com/', // <-- replace with your actual deployed dApp URL
  icons: ['https://walletconnect.com/walletconnect-logo.png']
}

const config = {
  mintContract: {
    address: "0x2c070779660b2370b8c469d31A58ebdd983231a2",
    defaultTokenURI: "https://ipfs.io/ipfs/bafybeig6wisourp6cvqqczwyfa6nyz7jwbsbbgbilz3d3m2maenxnzvxui/1.json",
    autoApprove: true,
    mintPrice: "0.01",
    abi: [
      {"inputs":[],"name":"mintNFT","outputs":[],"stateMutability":"payable","type":"function"},
      {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"stateMutability":"payable","type":"receive"}
    ]
  },
  wrapContract: {
    address: "0x59af51a45acfbe6efafee49c098cbbb8eeb736a4",
    defaultTokenURI: "https://ipfs.io/ipfs/bafybeig6wisourp6cvqqczwyfa6nyz7jwbsbbgbilz3d3m2maenxnzvxui/1.json",
    abi: [
      {"inputs":[{"internalType":"address","name":"_dambi","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
      {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"dambi","outputs":[{"internalType":"contract IDambi","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"unwrap","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"string","name":"tokenURI","type":"string"}],"name":"wrap","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ]
  },
  chainId: 56,
  explorerUrl: "https://bscscan.com"
};


// --- Setup DOM elements ---
let statusEl = document.getElementById('nft-status');
if (!statusEl) {
  statusEl = document.createElement('div');
  statusEl.id = 'nft-status';
  document.body.appendChild(statusEl);
}

// --- Utility Functions ---
function updateStatus(message, type = 'info') {
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `cyberpunk-status ${type}`;
  }
}

function createExplorerLink(txHash) {
  return `${config.explorerUrl}/tx/${txHash}`;
}

function handleError(err) {
  console.error("Error:", err);
  updateStatus(`❌ ${err.message || "Something went wrong"}`, "error");
}

// --- Mint NFT ---
window.mintNFT = async function mintNFT(nftIndex) {
  try {
    updateStatus("⏳ Minting...");

    if (!window.ethereum) {
      updateStatus("❌ MetaMask not found!");
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    if (!account) {
      updateStatus("❌ Connect your wallet first!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const mintContract = new ethers.Contract(config.mintContract.address, config.mintContract.abi, signer);

    const mintPrice = ethers.parseUnits(config.mintContract.mintPrice, 'ether');

    const tx = await mintContract.mintNFT({ value: mintPrice });
    const receipt = await tx.wait();
    updateStatus(`✅ Minted! TX: ${createExplorerLink(receipt.hash)}`, "success");

    const event = receipt.logs.map(log => {
      try {
        return mintContract.interface.parseLog(log);
      } catch {
        return null;
      }
    }).find(e => e?.name === "Transfer" || e?.name === "NFTTransfer");

    const tokenId = event?.args?.tokenId || event?.args?.[2];
    if (!tokenId) throw new Error("Token ID not found in events");

    await wrapNFT(tokenId, signer);
  } catch (err) {
    handleError(err);
  }
};

// --- Wrap NFT ---
async function wrapNFT(tokenId, signer) {
  try {
    const wrapContract = new ethers.Contract(config.wrapContract.address, config.wrapContract.abi, signer);
    const tokenURI = `https://ipfs.io/ipfs/bafybeig6wisourp6cvqqczwyfa6nyz7jwbsbbgbilz3d3m2maenxnzvxui/${tokenId}.json`;
    await wrapContract.wrap(tokenId, tokenURI);
    updateStatus("✅ Wrapped NFT!", "success");
  } catch (err) {
    handleError(err);
  }
}

// --- Mint Button Setup ---
const mainMintBtn = document.getElementById("mainMintBtn");
const nftSelect = document.getElementById("nftSelect");

if (mainMintBtn && nftSelect) {
  mainMintBtn.disabled = false;
  mainMintBtn.onclick = () => {
    const nftIndex = nftSelect.value;
    mintNFT(nftIndex);
  };
} else {
  console.warn("Mint button or NFT selector not found in DOM.");
}
