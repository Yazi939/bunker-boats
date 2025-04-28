import React, { useEffect, useState } from 'react';
import './Preloader.css';

interface PreloaderProps {
  loading: boolean;
  onFinish?: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ loading, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let fastFinish = false;

    if (loading) {
      setFadeOut(false);
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 100) {
            return prev + 1;
          }
          clearInterval(interval);
          setFadeOut(true);
          return 100;
        });
      }, 20);
    } else {
      // ускоренно доводим до 100%
      if (progress < 100) {
        fastFinish = true;
        interval = setInterval(() => {
          setProgress(prev => {
            if (prev < 100) {
              return prev + 5;
            }
            clearInterval(interval);
            setFadeOut(true);
            return 100;
          });
        }, 10);
      } else {
        setFadeOut(true);
      }
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [loading]);

  // Когда fadeOut завершён, вызываем onFinish
  useEffect(() => {
    if (fadeOut) {
      const timeout = setTimeout(() => {
        onFinish && onFinish();
      }, 800); // время fade-out из css
      return () => clearTimeout(timeout);
    }
  }, [fadeOut, onFinish]);

  return (
    <div className={`preloader-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="app-name">FUEL Manager</div>
      
      <div className="fuel-drop">
        <div className="drop-body">
          <div className="wave"></div>
        </div>
        <div className="drop-shadow"></div>
      </div>
      
      <div className="fuel-gauge">
        <div className="gauge-body">
          <div className="gauge-fill" style={{ width: `${progress}%` }}></div>
          <div className="gauge-cover"></div>
        </div>
        <div className="gauge-text">{progress}%</div>
      </div>
      
      <div className="loading-text">
        <span>L</span>
        <span>o</span>
        <span>a</span>
        <span>d</span>
        <span>i</span>
        <span>n</span>
        <span>g</span>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </div>
  );
};

export default Preloader; 