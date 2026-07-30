import { useState, useEffect } from 'react';
import { festivalData } from './data';

const FESTIVAL_START_HOUR = 13.5;
const FESTIVAL_END_HOUR = 25.5; 
const HOUR_HEIGHT = 160;

function App() {
  const [activeDay, setActiveDay] = useState(festivalData[0].day);
  const [simulatedTime, setSimulatedTime] = useState("20:00");
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    if (isSimulating) return;
    
    const updateRealTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setSimulatedTime(`${hours}:${mins}`);
    };
    
    updateRealTime();
    const interval = setInterval(updateRealTime, 60000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const currentDayData = festivalData.find(d => d.day === activeDay);

  // Générateur de couleur dynamique (dégradé continu selon la note)
  const getDynamicStyle = (score) => {
    let h, s, l, bgAlpha, borderAlpha;
    
    if (score < 5) {
      // 0 à 5 : Gris vers Rose
      const ratio = score / 5;
      h = 240 + ratio * (320 - 240); // 240 (Bleu/Gris) vers 320 (Rose)
      s = ratio * 80; 
      l = 20 + ratio * 15;
      bgAlpha = 0.1 + ratio * 0.1;
      borderAlpha = 0.1 + ratio * 0.3;
    } else {
      // 5 à 10 : Rose vers Cyan
      const ratio = (score - 5) / 5;
      h = 320 + ratio * (190 - 320); // 320 (Rose) vers 190 (Cyan)
      s = 80 + ratio * 20; 
      l = 35 + ratio * 15;
      bgAlpha = 0.2 + ratio * 0.15;
      borderAlpha = 0.4 + ratio * 0.6;
    }

    return {
      background: `linear-gradient(135deg, hsla(${h}, ${s}%, ${l}%, ${bgAlpha}), hsla(${h - 20}, ${s}%, ${l - 10}%, ${bgAlpha - 0.05}))`,
      borderColor: `hsla(${h}, ${s}%, ${l}%, ${borderAlpha})`,
      scoreBg: `hsla(${h}, ${s}%, ${l}%, ${borderAlpha + 0.3})`,
      scoreColor: '#111'
    };
  };

  const timeToPixels = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    let hourAdjusted = h;
    if (h < 10) hourAdjusted += 24; 
    
    const totalMinutes = (hourAdjusted - FESTIVAL_START_HOUR) * 60 + m;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  };

  const calculateHeight = (start, end) => {
    if (!start || !end) return HOUR_HEIGHT;
    const startPx = timeToPixels(start);
    const endPx = timeToPixels(end);
    return endPx - startPx;
  };

  const isPlayingNow = (start, end) => {
    if (!start || !end) return false;
    const startTotal = timeToPixels(start);
    const endTotal = timeToPixels(end);
    const currTotal = timeToPixels(simulatedTime);
    return currTotal >= startTotal && currTotal < endTotal;
  };

  const timeMarkers = [];
  for (let h = Math.ceil(FESTIVAL_START_HOUR); h <= Math.floor(FESTIVAL_END_HOUR); h++) {
    const displayHour = h >= 24 ? h - 24 : h;
    timeMarkers.push(
      <div 
        key={h} 
        className="time-marker" 
        style={{ top: `${(h - FESTIVAL_START_HOUR) * HOUR_HEIGHT}px` }}
      >
        <span>{displayHour.toString().padStart(2, '0')}:00</span>
      </div>
    );
  }

  const currentTimePosition = timeToPixels(simulatedTime);

  return (
    <div className="app-container">
      <header>
        <div className="festival-logo">
          <div className="logo-top">LES PLAGES</div>
          <div className="logo-bottom">ELECTRONIQUES - CANNES</div>
        </div>
        <div className="subtitle">Mon Guide Perso 2026</div>
      </header>

      <div className="time-simulator">
        <div className="time-controls">
          <label>
            <input 
              type="checkbox" 
              checked={isSimulating} 
              onChange={(e) => setIsSimulating(e.target.checked)}
            />
            Simuler l'heure (Test)
          </label>
          <input 
            type="time" 
            value={simulatedTime}
            onChange={(e) => setSimulatedTime(e.target.value)}
            disabled={!isSimulating}
            className="time-input"
          />
        </div>
        <div className="current-time-display">
          Heure actuelle : <span>{simulatedTime}</span>
        </div>
      </div>

      <div className="tabs">
        {festivalData.map(dayData => (
          <button 
            key={dayData.day}
            className={`tab-btn ${activeDay === dayData.day ? 'active' : ''}`}
            onClick={() => setActiveDay(dayData.day)}
          >
            {dayData.day}
          </button>
        ))}
      </div>

      <main className="schedule-wrapper">
        <div className="schedule-scroll-container">
          <div className="grid-headers">
            <div className="time-axis-placeholder"></div>
            {currentDayData?.stages.map((stage, idx) => (
              <div key={idx} className="stage-column-header">
                <h2>{stage.name}</h2>
              </div>
            ))}
          </div>

          <div className="schedule-grid" style={{ height: `${(FESTIVAL_END_HOUR - FESTIVAL_START_HOUR) * HOUR_HEIGHT}px` }}>
            <div className="time-axis">
              {timeMarkers}
            </div>

            {currentTimePosition >= 0 && currentTimePosition <= (FESTIVAL_END_HOUR - FESTIVAL_START_HOUR) * HOUR_HEIGHT && (
              <div 
                className="current-time-line"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="current-time-dot"></div>
              </div>
            )}

            {currentDayData?.stages.map((stage, idx) => (
              <div key={idx} className="stage-column">
                <div className="stage-artists-container">
                  {stage.artists.map((artist, i) => {
                    const active = isPlayingNow(artist.start, artist.end);
                    const topPos = timeToPixels(artist.start);
                    const cardHeight = calculateHeight(artist.start, artist.end);
                    const styleColors = getDynamicStyle(artist.interest);
                    
                    return (
                      <div 
                        key={i} 
                        className={`artist-slot ${active ? 'is-playing' : ''}`}
                        style={{
                          top: `${topPos}px`,
                          height: `${cardHeight}px`,
                          background: styleColors.background,
                          borderColor: styleColors.borderColor,
                          boxShadow: active ? `0 0 20px ${styleColors.borderColor}` : 'none'
                        }}
                      >
                        <div className="artist-slot-time">
                          {artist.start} - {artist.end}
                        </div>
                        <div className="artist-slot-header">
                          <h3 className="artist-slot-name">{artist.name}</h3>
                          <span 
                            className="interest-score"
                            style={{
                              background: styleColors.scoreBg,
                              color: styleColors.scoreColor,
                              borderColor: styleColors.borderColor
                            }}
                          >
                            {artist.interest}/10
                          </span>
                        </div>
                        {artist.style && <p className="artist-slot-style">{artist.style}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
