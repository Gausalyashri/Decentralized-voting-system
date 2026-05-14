import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contract from "./utils/contract";
import ProposalList from "./components/ProposalList";

function App() {
  const [account, setAccount] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [newProposal, setNewProposal] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    try {
      if (!window.ethereum) return alert("Install MetaMask!");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setError("");
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
  }

  async function loadProposals() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const voting = new ethers.Contract(contract.address, contract.abi, provider);
      const data = await voting.getProposals();
      setProposals(data);
      setError("");
    } catch (err) {
      setError("Error loading proposals: " + err.message);
    }
  }

  async function createProposal() {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const voting = new ethers.Contract(contract.address, contract.abi, signer);
      const tx = await voting.createProposal(newProposal);
      await tx.wait();
      setNewProposal("");
      loadProposals();
      setError("");
    } catch (err) {
      setError("Error creating proposal: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addWhitelist() {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const voting = new ethers.Contract(contract.address, contract.abi, signer);
      const tx = await voting.addToWhitelist(whitelistAddress);
      await tx.wait();
      setWhitelistAddress("");
      setError("");
    } catch (err) {
      setError("Error adding whitelist: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function vote(id) {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const voting = new ethers.Contract(contract.address, contract.abi, signer);
      const tx = await voting.vote(id);
      await tx.wait();
      loadProposals();
      setError("");
    } catch (err) {
      setError("Error voting: " + err.message);
    } finally {
      setLoading(false);
    }
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

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mt-4 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-yellow-100 text-yellow-700 p-2 mt-4 rounded">
          Transaction pending...
        </div>
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
          disabled={loading}
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
          disabled={loading}
        >
          Add
        </button>
      </div>

      <ProposalList proposals={proposals} onVote={vote} loading={loading} />
    </div>
  );
}

export default App;
