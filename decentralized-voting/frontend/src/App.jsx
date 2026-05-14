import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contract from "./utils/contract";
import ProposalList from "./components/ProposalList";

function App() {
  const [account, setAccount] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [newProposal, setNewProposal] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");

  async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  }

  async function loadProposals() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const voting = new ethers.Contract(contract.address, contract.abi, provider);
    const data = await voting.getProposals();
    setProposals(data);
  }

  async function createProposal() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const voting = new ethers.Contract(contract.address, contract.abi, signer);
    await voting.createProposal(newProposal);
    setNewProposal("");
    loadProposals();
  }

  async function addWhitelist() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const voting = new ethers.Contract(contract.address, contract.abi, signer);
    await voting.addToWhitelist(whitelistAddress);
    setWhitelistAddress("");
  }

  async function vote(id) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const voting = new ethers.Contract(contract.address, contract.abi, signer);
    await voting.vote(id);
    loadProposals();
  }

  useEffect(() => {
    if (account) loadProposals();
  }, [account]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Decentralized Voting</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Connect Wallet
        </button>
      ) : (
        <p className="mt-2">Connected: {account}</p>
      )}

      <div className="mt-6">
        <h2 className="font-semibold">Create Proposal</h2>
        <input
          value={newProposal}
          onChange={(e) => setNewProposal(e.target.value)}
          placeholder="Proposal description"
          className="border p-2 mr-2"
        />
        <button
          onClick={createProposal}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold">Whitelist Voter</h2>
        <input
          value={whitelistAddress}
          onChange={(e) => setWhitelistAddress(e.target.value)}
          placeholder="0x..."
          className="border p-2 mr-2"
        />
        <button
          onClick={addWhitelist}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <ProposalList proposals={proposals} onVote={vote} />
    </div>
  );
}

export default App;
