import React from 'react';
import { FastForward, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

export default function TimeWarpBar({ timeOffsetDays, onAdvanceDays, onResetTime }) {
  return (
    <div className="time-warp-bar glass-panel">
      <div className="time-warp-title">
        <Sparkles size={16} className="text-gold" />
        <span><strong>Demo Time-Warp Controls:</strong> Fast-forward simulated time to test 30-day lifecycle</span>
      </div>

      <div className="time-warp-controls">
        <button
          className="time-btn"
          onClick={() => onAdvanceDays(1)}
          title="Advance 1 day to see daily countdown"
        >
          +1 Day
        </button>

        <button
          className="time-btn time-btn-yellow"
          onClick={() => onAdvanceDays(25)}
          title="Advance 25 days to trigger Yellow warning tiles (<=5d left)"
        >
          <AlertTriangle size={14} /> +25 Days (Test Yellow)
        </button>

        <button
          className="time-btn time-btn-red"
          onClick={() => onAdvanceDays(30)}
          title="Advance 30 days to trigger 30-day expiration cleanup"
        >
          <FastForward size={14} /> +30 Days (Test Expire)
        </button>

        {timeOffsetDays > 0 && (
          <button className="time-btn-reset" onClick={onResetTime} title="Reset time back to present">
            <RotateCcw size={14} /> Reset ({timeOffsetDays}d elapsed)
          </button>
        )}
      </div>
    </div>
  );
}
