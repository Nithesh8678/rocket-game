interface StatsPanelProps {
  score: number;
  highScore: number;
  level: number;
}

const StatsPanel = ({ score, highScore, level }: StatsPanelProps) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white min-w-[200px] h-fit">
      <h2 className="text-xl font-bold mb-4 text-center">Game Stats</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Score:</span>
          <span className="font-mono text-lg">{score}</span>
        </div>
        <div className="flex justify-between items-center text-yellow-400">
          <span>High Score:</span>
          <span className="font-mono text-lg">{highScore}</span>
        </div>
        <div className="flex justify-between items-center text-blue-400">
          <span>Level:</span>
          <span className="font-mono text-lg">{level}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
