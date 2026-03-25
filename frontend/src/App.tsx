import { useState } from 'react'
import './App.css'
import WebcamCapture from './components/WebcamCapture'

function App() {
  const [hasEntered, setHasEntered] = useState(false);

  const handleEnter = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("Fullscreen request failed", e);
    }
    setHasEntered(true);
  };

  if (!hasEntered) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <h1>why.fi</h1>
          <p>WARNING: YOU MAY BE JUDGED SEVERELY.</p>
          <button className="enter-btn" onClick={handleEnter}>ENTER THE SIMULATION</button>
        </div>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <h1 className="app-title">why.fi</h1>
      <p className="app-subtitle">Survive five captures. The system is watching.</p>
      <WebcamCapture />
    </main>
  )
}

export default App
