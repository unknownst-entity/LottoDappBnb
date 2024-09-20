import { GOLDEN_TICKET_ABI, TAT_SLOTTO_NFT_ABI } from './abis.js';

let provider;
let signer;
let goldenTicketContract;
let nftContract;

// Replace with your contract addresses
const GOLDEN_TICKET_ADDRESS = '0xcAb6d18c044E11e71b5eb76f5Ae2a98f83147D79';
const TAT_SLOTTO_NFT_ADDRESS = '0x16C5c98Ca2F1748BA3D37d2FbBeE356bEe7B83c3';

document.getElementById('connectButton').addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();

        // Initialize contracts
        goldenTicketContract = new ethers.Contract(GOLDEN_TICKET_ADDRESS, GOLDEN_TICKET_ABI, signer);
        nftContract = new ethers.Contract(TAT_SLOTTO_NFT_ADDRESS, TAT_SLOTTO_NFT_ABI, signer);

        alert("Wallet connected!");

        // Hide connect section
        document.getElementById('connectSection').classList.add('hidden');

        // Show info section
        document.getElementById('infoSection').classList.remove('hidden');

        // Fetch and display winning pool and prizes
        await updateWinningPool();
        await updatePrizes();

        // Show minting section
        document.getElementById('mintingSection').classList.remove('hidden');
        document.getElementById('recipient').value = await signer.getAddress(); // Set recipient as the connected wallet
    } else {
        alert("Please install MetaMask to use this DApp!");
    }
});


async function updateWinningPool() {
    const totalTokens = await goldenTicketContract.totalSupply(); // Adjust based on your contract method
    document.getElementById('winningPool').innerText = ethers.utils.formatUnits(totalTokens, 18); // Adjust decimals if needed
}

async function updatePrizes() {
    const firstPrize = await nftContract.getFirstPrize();
    const secondPrize = await nftContract.getSecondPrize();
    const thirdPrize = await nftContract.getThirdPrize();

    document.getElementById('firstPrize').innerText = `1st Prize: ${ethers.utils.formatUnits(firstPrize, 18)} GOLDT`;
    document.getElementById('secondPrize').innerText = `2nd Prize: ${ethers.utils.formatUnits(secondPrize, 18)} GOLDT`;
    document.getElementById('thirdPrize').innerText = `3rd Prize: ${ethers.utils.formatUnits(thirdPrize, 18)} GOLDT`;
}

const selectedNumbers = new Set();

function updateSelectedNumbersDisplay() {
    document.getElementById('numbers').value = Array.from(selectedNumbers).join(',');
}

for (let i = 1; i <= 45; i++) {
    const button = document.createElement('button');
    button.innerText = i;
    button.classList.add('number-button');
    button.addEventListener('click', () => {
        if (selectedNumbers.has(i)) {
            selectedNumbers.delete(i); // Remove if already selected
            button.style.backgroundColor = ''; // Reset button color
        } else if (selectedNumbers.size < 6) {
            selectedNumbers.add(i); // Add if not selected and under limit
            button.style.backgroundColor = 'lightblue'; // Change button color to indicate selection
        } else {
            alert("You can only select up to 6 numbers.");
        }
        updateSelectedNumbersDisplay();
    });
    document.body.appendChild(button);
}

document.getElementById('mintButton').addEventListener('click', async () => {
    const recipient = await signer.getAddress(); // Set recipient as the connected wallet
    const amount = document.getElementById('amount').value;
    const numbers = Array.from(selectedNumbers);
    const threePartVariable = document.getElementById('threePartVariable').value;

    const goldenTicketBalance = await goldenTicketContract.balanceOf(recipient);
    
    if (goldenTicketBalance < amount) {
        alert("Not enough GoldenTickets.");
        return;
    }

    const mintPrice = await nftContract.nftMintPrice();
    const tx = await nftContract.mintNFT(recipient, numbers, threePartVariable, { value: mintPrice });
    await tx.wait();
    alert("NFT Minted!");
});