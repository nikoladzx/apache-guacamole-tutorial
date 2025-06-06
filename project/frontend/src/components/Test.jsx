import { useState, useEffect, useRef } from 'react';
import Guacamole from 'guacamole-common-js';

const Hero = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guacamoleClient, setGuacamoleClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('');
  const displayRef = useRef(null);

  const handleConnect = async () => {
    if (guacamoleClient) {
      guacamoleClient.disconnect();
      setGuacamoleClient(null);
      setConnectionStatus('');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('You have connected to the machine, please wait a bit until you get your VM');
      
      console.log("Fetching connection data...");
      const response = await fetch("http://192.168.1.3:5000/api/pcs/guacamole-connection", {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to establish connection');
      }
      const connectionData = await response.json();
      console.log("Connection data:", connectionData);

      const guacamoleServerUrl = "http://192.168.1.3:8082/guacamole";
      const guac = new Guacamole.Client(
        new Guacamole.WebSocketTunnel(`ws://${guacamoleServerUrl.replace('http://', '')}/websocket-tunnel`)
      );

      setGuacamoleClient(guac);

      const screenWidth = Math.floor(window.innerWidth * 0.95);
      const screenHeight = Math.floor(window.innerHeight * 0.9);
      console.log(screenHeight);
      console.log(screenWidth);

      console.log("Connecting to Guacamole...");
      guac.connect(`token=${connectionData.authToken}&GUAC_ID=${connectionData.connectionId}&GUAC_TYPE=c&GUAC_WIDTH=${screenWidth}&GUAC_HEIGHT=${screenHeight}&GUAC_DPI=96&GUAC_DATA_SOURCE=${connectionData.dataSource}`);

      guac.onerror = (error) => {
        console.error("Guacamole error:", error);
        setError(`Connection error: ${error.message}`);
        setIsLoading(false);
        setConnectionStatus('');
      };

      guac.onstatechange = (state) => {
        console.log("Guacamole state changed:", state);
        if (state === 3) { // 3 represents the connected state
          setIsLoading(false);
          setConnectionStatus('');
        }
      };

    } catch (error) {
      console.error("Error:", error);
      setError(error.message || 'An error occurred while connecting.');
      setGuacamoleClient(null);
      setIsLoading(false);
      setConnectionStatus('');
    }
  };

  useEffect(() => {
    if (guacamoleClient && displayRef.current) {
      const display = guacamoleClient.getDisplay().getElement();
      displayRef.current.innerHTML = '';
      displayRef.current.appendChild(display);

      const mouse = new Guacamole.Mouse(display);
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState) => {
        guacamoleClient.sendMouseState(mouseState);
      };

      const keyboard = new Guacamole.Keyboard(document);
      keyboard.onkeydown = (keysym) => {
        guacamoleClient.sendKeyEvent(1, keysym);
      };
      keyboard.onkeyup = (keysym) => {
        guacamoleClient.sendKeyEvent(0, keysym);
      };

      display.tabIndex = 0;

      display.addEventListener('mousedown', () => {
        display.focus();
      });

      const resizeDisplay = () => {
        requestAnimationFrame(() => {
          const containerWidth = displayRef.current.clientWidth;
          const containerHeight = displayRef.current.clientHeight;
          
          display.style.width = '100%';
          display.style.height = '100%';
          display.style.objectFit = 'contain';
          display.style.maxWidth = 'none';
          display.style.maxHeight = 'none';
          
          guacamoleClient.getDisplay().scale(Math.min(
            containerWidth / guacamoleClient.getDisplay().getWidth(),
            containerHeight / guacamoleClient.getDisplay().getHeight()
          ));
        });
      };

      resizeDisplay();
      window.addEventListener('resize', resizeDisplay);

      return () => {
        window.removeEventListener('resize', resizeDisplay);
        if (guacamoleClient) {
          guacamoleClient.disconnect();
        }
      };
    }
  }, [guacamoleClient]);

  return (
    <div className="container">
      <button 
        onClick={handleConnect} 
        disabled={isLoading}
        className={`connect-button ${isLoading ? 'loading' : ''} ${guacamoleClient ? 'connected' : ''}`}
      >
        <span className="button-content">
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Connecting...
            </>
          ) : (
            guacamoleClient ? "Disconnect" : "Connect to virtual machine"
          )}
        </span>
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {(isLoading || connectionStatus) && (
        <div className="loading-card">
          <div className="monitor-icon">
            <svg viewBox="0 0 24 24" className="monitor" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <div className="loading-spinner"></div>
          </div>
          <h3>Connecting to Your VM</h3>
          <p>Please wait while we establish a secure connection to your virtual machine...</p>
          <div className="progress-bar">
            <div className="progress-bar-fill"></div>
          </div>
        </div>
      )}

      {guacamoleClient && (
        <div 
          ref={displayRef} 
          className="display-container"
        />
      )}

      <style>{`
        .container {
          max-width: 98vw;
          margin: 0 auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .connect-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .connect-button:hover {
          background: #2563eb;
        }

        .connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .connect-button.connected {
          background: #ef4444;
        }

        .connect-button.connected:hover {
          background: #dc2626;
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.5rem;
          width: 100%;
          max-width: 32rem;
          text-align: center;
        }

        .loading-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 100%;
          max-width: 32rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .monitor-icon {
          position: relative;
          width: 4rem;
          height: 4rem;
          color: #3b82f6;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .monitor {
          width: 100%;
          height: 100%;
        }

        .loading-spinner {
          position: absolute;
          top: -0.25rem;
          right: -0.25rem;
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }

        .loading-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          color: #1f2937;
        }

        .loading-card p {
          color: #6b7280;
          margin: 0;
        }

        .progress-bar {
          width: 100%;
          height: 0.5rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 9999px;
          animation: loading 2s ease-in-out infinite;
        }

        .display-container {
          width: 100%;
          height: 90vh;
          border-radius: 0.5rem;
          overflow: hidden;
          
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }

        @keyframes loading {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;

