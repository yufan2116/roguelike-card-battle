import { useState } from 'react';
import { chooseEvent, leaveEncounter } from '../api/gameApi';
import { useGame } from '../context/GameContext';

export default function EventView() {
  const { run, setRun } = useGame();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!run?.encounter?.event) return null;
  const event = run.encounter.event;

  if (event.resolved) {
    return (
      <div className="page encounter-view event-view">
        <h1>{event.title}</h1>
        <p className="encounter-desc">{event.outcomeMessage}</p>
        <button
          className="btn btn-primary"
          onClick={async () => {
            const updated = await leaveEncounter(run!.id);
            setRun(updated);
          }}
        >
          继续
        </button>
      </div>
    );
  }

  async function handleChoice(choiceId: string) {
    setLoading(true);
    setError('');
    try {
      const updated = await chooseEvent(run!.id, choiceId);
      setRun(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page encounter-view event-view">
      <header className="page-header">
        <h1>❓ {event.title}</h1>
      </header>

      <p className="encounter-desc">{event.description}</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="event-choices">
        {event.choices.map((choice) => (
          <button
            key={choice.id}
            className="btn btn-primary event-choice"
            disabled={loading}
            onClick={() => handleChoice(choice.id)}
          >
            <strong>{choice.label}</strong>
            <span>{choice.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
