import type { AgentCard } from '../types';

interface Props {
  card: AgentCard | null;
}

export default function AgentInfo({ card }: Props) {
  return (
    <header className="agent-info">
      <div className="agent-info-main">
        <h1>{card?.name ?? 'DocsClaw Agent'}</h1>
        <p>{card?.description ?? 'Connecting...'}</p>
      </div>
      {card?.skills && card.skills.length > 0 && (
        <div className="agent-skills">
          {card.skills.map(s => (
            <span key={s.id} className="skill-tag">{s.name}</span>
          ))}
        </div>
      )}
    </header>
  );
}
