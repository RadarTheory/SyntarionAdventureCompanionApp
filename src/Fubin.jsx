import './fubin.css';

export default function Fubin({ onHome }) {
  return (
    <div className="fubin-shell open">
      <button className="fubin-back" onClick={onHome}>← Back</button>
      <div className="fubin-screen">
        <div className="fubin-menu-logo">
          <h1>FUBIN</h1>
          <p>Coming soon</p>
        </div>
      </div>
    </div>
  );
}