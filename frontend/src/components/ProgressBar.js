export default function ProgressBar({ votesToday, dailyLimit }) {
  const percentage = Math.min((votesToday / dailyLimit) * 100, 100);

  return (
    <div className="progress-wrapper">
      <div className="progress-header">
        <span>Daily Voting Progress</span>
        <span>{votesToday} / {dailyLimit} Votes</span>
      </div>
      <div className="progress-track glass-panel">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
