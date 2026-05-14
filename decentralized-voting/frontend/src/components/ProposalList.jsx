function ProposalList({ proposals, onVote }) {
  return (
    <ul className="mt-4">
      {proposals.map((p, i) => (
        <li key={i} className="border p-2 mb-2 rounded flex justify-between">
          <span>{p.description} — Votes: {p.voteCount.toString()}</span>
          <button
            onClick={() => onVote(i)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Vote
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ProposalList;
 