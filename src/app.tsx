import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router";
// import { useIdleTimer } from 'react-idle-timer'

import Header from "./components/Header";
import BetsUsers from "./components/BetUsers";
import Main from "./components/Main";

//import MainAudio from "./assets/audio/main.wav";
import FlewAwayAudio from "./assets/audio/flew_away.mp3";
import TakeOffAudio from "./assets/audio/take_off.mp3";

import propeller from "./assets/images/propeller.png";

import Context from "./context";
import PerfectLiveChat from "./components/Chat";

function App() {
  const {
    state,
    userInfo,
    msgTab,
    platformLoading,
    errorBackend,
    // unityLoading,
    currentProgress,
    unityState,
    GameState,
  } = React.useContext(Context);

  // const [idleState, setIdleState] = useState<boolean>(false)

  // const onIdle = () => {
  //   setIdleState(true)
  // }

  // const onActive = () => {
  //   setIdleState(false)
  // }

  // useIdleTimer({
  //   onIdle,
  //   onActive,
  //   timeout: 3600_000,
  //   throttle: 500
  // })

  const return_url = new URLSearchParams(useLocation().search).get(
    "return_url"
  );

  // const mainAudioRef = useRef<HTMLAudioElement>(null);
  const takeOffAudioRef = useRef<HTMLAudioElement>(null);
  const flewAwayAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (
      GameState === "PLAYING" &&
      unityState === true &&
      userInfo.isSoundEnable === true
    ) {
      if (takeOffAudioRef.current) {
        var playPromise = takeOffAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(_ => {
            // Automatic playback started!
            // Show playing UI.
          })
            .catch(error => {
              console.log("Auto-play was prevented");
              // Auto-play was prevented
              // Show paused UI.
            });
        }
      }

    }
    // eslint-disable-next-line
  }, [takeOffAudioRef, GameState, userInfo.isSoundEnable]);

  useEffect(() => {
    if (
      GameState === "GAMEEND" &&
      unityState === true &&
      userInfo.isSoundEnable === true
    ) {
      if (flewAwayAudioRef.current) {
        var playPromise = flewAwayAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(_ => {
            // Automatic playback started!
            // Show playing UI.
          })
            .catch(error => {
              console.log("Auto-play was prevented");
              // Auto-play was prevented
              // Show paused UI.
            });
        }
      }
    }
    // eslint-disable-next-line
  }, [flewAwayAudioRef.current, GameState, userInfo.isSoundEnable]);

  return (
    <div className="main-container scroll-restyle">
      <div style={{ display: "none" }}>

        {/* Take Off Audio Section */}
        <audio id="takeOffAudio" ref={takeOffAudioRef}>
          <source src={TakeOffAudio} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>

        {/* Flew Away Audio Section */}
        <audio id="flewAwayAudio" ref={flewAwayAudioRef}>
          <source src={FlewAwayAudio} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>

      {platformLoading && (
        <div className="platformmyloading">
          <div className="loading-container">
            <div className="rotation">
              <img alt="propeller" src={propeller}></img>
            </div>
            {errorBackend === true ? (
              <div className="waiting-font">{return_url}</div>
            ) : (
              <>
                <div className="waiting-font">LOADING</div>
                <div className="waiting">
                  <div
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="contianer">
        <div className="main-game-container">
          <div className="game-container">
            <Header />
            <BetsUsers />
            <Main />
          </div>
        </div>
        {msgTab && <PerfectLiveChat />}
      </div>
    </div>
  );
}

export default App;
