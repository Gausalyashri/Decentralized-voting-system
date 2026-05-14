const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let Voting, voting, admin, voter, outsider;

  beforeEach(async function () {
    [admin, voter, outsider] = await ethers.getSigners();
    Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.connect(admin).deploy(5); // 5 minutes
    await voting.deployed();
  });

  it("Should allow admin to create proposals", async function () {
    await voting.createProposal("Proposal 1");
    const proposals = await voting.getProposals();
    expect(proposals[0].description).to.equal("Proposal 1");
  });

  it("Should whitelist voter and allow voting", async function () {
    await voting.addToWhitelist(voter.address);
    await voting.createProposal("Proposal 1");
    await voting.connect(voter).vote(0);
    const proposals = await voting.getProposals();
    expect(proposals[0].voteCount).to.equal(1);
  });

  it("Should reject duplicate voting", async function () {
    await voting.addToWhitelist(voter.address);
    await voting.createProposal("Proposal 1");
    await voting.connect(voter).vote(0);
    await expect(voting.connect(voter).vote(0)).to.be.revertedWith("Already voted");
  });

  it("Should reject non-whitelisted voter", async function () {
    await voting.createProposal("Proposal 1");
    await expect(voting.connect(outsider).vote(0)).to.be.revertedWith("Not whitelisted");
  });

  it("Should reject voting after deadline", async function () {
    await voting.addToWhitelist(voter.address);
    await voting.createProposal("Proposal 1");
    // fast-forward time
    await ethers.provider.send("evm_increaseTime", [10 * 60]); // 10 minutes
    await ethers.provider.send("evm_mine");
    await expect(voting.connect(voter).vote(0)).to.be.revertedWith("Voting ended");
  });

  it("Should restrict admin-only functions", async function () {
    await expect(voting.connect(voter).createProposal("Bad")).to.be.revertedWith("Not admin");
    await expect(voting.connect(voter).addToWhitelist(voter.address)).to.be.revertedWith("Not admin");
  });
});
