/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, createContext } from "react";
import { useLocation } from "react-router";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";
import { isMobile, isTablet, isDesktop } from 'react-device-detect';

import config from "./config.json";
import toaster from "./components/Toast";
import { generateRandomString } from "./components/utils";

import {
  BettedUserType,
  UserType,
  GameStatusType,
  GameBetLimit,
  GameHistory,
  UserStatusType,
  ContextDataType,
  ContextType,
  MsgUserType,
  unityContext,
  init_state,
  init_userInfo,
} from "./utils/interfaces"

const Context = createContext<ContextType>(null!);

const socket = io(
  process.env.REACT_APP_DEVELOPMENT === "true"
    ? config.development_wss
    : config.production_wss
);

let socketState = false;

export const callCashOut = (at: number, index: "f" | "s") => {
  let endTarget: Number = Number(at.toFixed(2))
  let data = { type: index, endTarget };
  socket.emit("cashOut", data);
};

export const callCancelBet = (userId: string, betid: string, betAmount: any, currency: string, Session_Token: string, type: string) => {
  let data = { userId, betid, betAmount, currency, Session_Token, type };
  socket.emit("cancelBet", data);
};

let fIncreaseAmount = 0;
let fDecreaseAmount = 0;
let sIncreaseAmount = 0;
let sDecreaseAmount = 0;

let newState: ContextDataType;
let newBetState: UserStatusType;

const takeOffAudio = new Audio("/sound/cashout.mp3");
const musicAudio = new Audio("/sound/main.wav");
musicAudio.loop = true;
musicAudio.volume = 0.2;


let globalUserInfo: any = init_userInfo
export const Provider = ({ children }: any) => {
  const token = new URLSearchParams(useLocation().search).get("token");
  const UserID = new URLSearchParams(useLocation().search).get("UserID");
  const currency = new URLSearchParams(useLocation().search).get("currency");
  const returnurl = new URLSearchParams(useLocation().search).get("returnurl");

  const [msgData, setMsgData] = useState<MsgUserType[]>([]);

  const [secure, setSecure] = useState<boolean>(false);
  const [msgReceived, setMsgReceived] = useState<boolean>(false);
  const [errorBackend, setErrorBackend] = useState<boolean>(false);
  const [platformLoading, setPlatformLoading] = useState<boolean>(true);
  const [userSeedText, setUserSeedText] = useState<string>('');
  const [state, setState] = useState<ContextDataType>(init_state);
  const [userInfo, setUserInfo] = useState<UserType>(init_userInfo);
  const [msgTab, setMsgTab] = useState<boolean>(
    userInfo.msgVisible
  );
  const toggleMsgTab = () => {
    setMsgTab(!msgTab);
  };

  newState = state;
  const [unity, setUnity] = useState({
    unityState: false,
    unityLoading: false,
    currentProgress: 0,
  });
  const [gameState, setGameState] = useState({
    currentNum: '0',
    GameState: "",
    time: 0,
  });

  const [bettedUsers, setBettedUsers] = useState<BettedUserType[]>([]);
  const update = (attrs: Partial<ContextDataType>) => {
    setState({ ...state, ...attrs });
  };

  const updateUserInfo = (attrs: Partial<UserType>) => {
    globalUserInfo = { ...globalUserInfo, ...attrs };
    setUserInfo(globalUserInfo);
  }
  const [previousHand, setPreviousHand] = useState<UserType[]>([]);
  const [history, setHistory] = useState<any>([]);
  const [userBetState, setUserBetState] = useState<UserStatusType>({
    fbetState: false,
    sbetState: false,
  });
  newBetState = userBetState;
  const [fLoading, setFLoading] = useState<Boolean>(false);
  const [sLoading, setSLoading] = useState<Boolean>(false);
  const [rechargeState, setRechargeState] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [ip, setIP] = useState<string>("");
  const updateUserBetState = (attrs: Partial<UserStatusType>) => {
    setUserBetState({ ...userBetState, ...attrs });
  };
  const handleServerSeed = (seed: string) => {
    setState({ ...state, seed });
  };

  const [betLimit, setBetLimit] = useState<GameBetLimit>({
    minBet: 10,
    maxBet: 100000,
  });

  const handleGetSeed = () => {
    socket.emit("getSeed");
  };

  const handleGetSeedOfRound = async (flyDetailId) => {
    const result = await axios.post(`${process.env.REACT_APP_DEVELOPMENT === "true"
      ? config.development_api
      : config.production_api
      }/get-seed-round`, { flyDetailId });
    if (result.data.status) {
      return result.data.data
    } else {
      return false;
    }
  }

  const updateUserMsg = (
    _id: string,
    userId: string,
    userName: string,
    avatar: string,
    message: string,
    img: string,
    likes: number,
    likesIDs: string[],
    disLikes: number,
    disLikesIDs: string[],
  ) => {
    setMsgData([
      ...msgData,
      {
        _id,
        userId,
        userName,
        avatar,
        message,
        img,
        likes,
        likesIDs,
        disLikes,
        disLikesIDs
      },
    ]);
  };

  const handleSetDefaultLoading = () => {
    setFLoading(false)
    setSLoading(false)
  }

  useEffect(() => {
    socket.on("connect", () => {
      console.log(`Socket connection is ${socket.connected}`);
      socketState = true;
    });
  }, [])

  useEffect(() => {
    if (token && UserID && currency && returnurl && socketState) {
      console.log("Send socket emit for get User Info and session");
      socket.emit('getBetLimits');
      socket.emit("sessionCheck", { token, UserID, currency, returnurl });
      socket.on("sessionSecure", (data) => {
        console.log("get Data for sessionsecure and userInfo");
        if (data.sessionStatus === true) {
          updateUserInfo(data.user);
          setSecure(true);
          // socket.emit("enterRoom", { token, UserID, currency });
        } else {
          toast.error(data.message);
          setErrorBackend(true);
        }
      });

      socket.on("getBetLimits", (betAmounts: { max: number; min: number }) => {
        setBetLimit({ maxBet: betAmounts.max, minBet: betAmounts.min });
      });

      socket.on("deny", (data: any) => {
        toast.error(data.message)
      })

      // socket.on("myInfo", (user: UserType) => {
      //   localStorage.setItem("aviator-audio", "");
      //   updateUserInfo(user);
      //   setSecure(true);
      // });
    }

    return () => {
      socket.off("sessionSecure");
      // socket.off("myInfo");
      socket.off("deny");
    }
    // eslint-disable-next-line
  }, [socket, socketState])

  useEffect(
    function () {
      unityContext.on("GameController", function (message) {
        if (message === "Ready") {
          setUnity({
            currentProgress: 100,
            unityLoading: true,
            unityState: true,
          });
        }
      });
      unityContext.on("progress", (progression) => {
        const currentProgress = progression * 100;
        if (progression === 1) {
          setPlatformLoading(false);
          setUnity({ currentProgress, unityLoading: true, unityState: true });
        } else {
          setUnity({
            currentProgress,
            unityLoading: false,
            unityState: false,
          });
        }
      });
      return () => unityContext.removeAllEventListeners();
      // if (secure) {
      // }
    },
    []
    // [secure]
  );

  useEffect(() => {
    socket.on("gameState", (gameState: GameStatusType) => {
      setGameState(gameState);
    });

    if (secure && socketState) {
      socket.on("bettedUserInfo", (bettedUsers: BettedUserType[]) => {
        setBettedUsers(bettedUsers);
      });

      socket.on("myBetState", (myInfo: { user: UserType; type: string }) => {
        var { user, type } = myInfo;
        var attrs: any = { ...userBetState };
        var newUserInfo = globalUserInfo;
        attrs.fbetState = false;
        // newUserInfo.f.betted = user.f.betted;
        attrs.sbetState = false;
        // newUserInfo.s.betted = user.s.betted;
        let allState = { ...newState };
        newUserInfo.balance = user.balance;
        update(allState);
        updateUserInfo(newUserInfo);
        setUserBetState(attrs);
        if (type === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
        // getMyBets();
      });

      socket.on("history", (history: any) => {
        setHistory(history);
      });

      socket.on('seedOfRound', (data: any) => {

      })

      socket.on("serverSeed", (seed: string) => {
        handleServerSeed(seed);
      });

      socket.on("previousHand", (previousHand: UserType[]) => {
        setPreviousHand(previousHand);
      });

      socket.on("recharge", () => {
        setRechargeState(true);
      });

      socket.on("cancelled", (data: { status: boolean, type: string, updatedBalance: number }) => {
        const { type, updatedBalance } = data;
        updateUserBetState({ [`${type}betState`]: false });
        updateUserInfo({ ...userInfo, [type]: { ...userInfo[type], betted: false }, balance: updatedBalance });
        if (type === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
      })

      socket.on("error", (data) => {
        setUserInfo({
          ...userInfo,
          [data.index]: {
            ...userInfo[data.index],
            betted: false,
            auto: false
          }
        })
        setUserBetState({
          ...userBetState,
          [`${data.index}betState`]: false,
        });
        if (data.index === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
        toast.error(data.message);
      });

      socket.on("success", (data) => {
        if (data.index === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }

        toaster(
          "success",
          data.msg,
          data.currency,
          data.point,
          data.cashoutAmount
        );
      });
    }
    return () => {
      socket.off("connect");
      socket.off("enterRoom");
      socket.off("disconnect");
      socket.off("myBetState");
      socket.off("sessionSecure");
      socket.off("history");
      socket.off("gameState");
      socket.off("previousHand");
      socket.off("getBetLimits");
      socket.off("recharge");
      socket.off("cancelled");
      socket.off("error");
      socket.off("success");
    };
    // eslint-disable-next-line
  }, [socket, secure, socketState]);

  useEffect(() => {
    socket.on("finishGame", (user: UserType) => {
      if (user.f.cashouted && userInfo.isSoundEnable === true && takeOffAudio) {
        takeOffAudio.play();
      }
      if (user.s.cashouted && userInfo.isSoundEnable === true && takeOffAudio) {
        takeOffAudio.play();
      }
      // let attrs = newState;
      let newUserInfo = { ...userInfo };
      user.isMusicEnable = userInfo.isMusicEnable;
      user.isSoundEnable = userInfo.isSoundEnable;
      let fauto = userInfo.f.auto;
      let sauto = userInfo.s.auto;
      let fbetAmount = userInfo.f.betAmount;
      let sbetAmount = userInfo.s.betAmount;
      let betStatus: UserStatusType = newBetState;
      newUserInfo = user;
      newUserInfo.f.betAmount = fbetAmount;
      newUserInfo.s.betAmount = sbetAmount;
      newUserInfo.f.auto = fauto;
      newUserInfo.s.auto = sauto;
      newUserInfo.f.autocashout = userInfo.f.autocashout;
      newUserInfo.s.autocashout = userInfo.s.autocashout;
      newUserInfo.f.target = userInfo.f.target;
      newUserInfo.s.target = userInfo.s.target;
      if (newUserInfo.f.auto)
        betStatus.fbetState = true;
      if (newUserInfo.s.auto)
        betStatus.sbetState = true;
      handleSetDefaultLoading();
      updateUserInfo(newUserInfo);
      setUserBetState(betStatus);
    });
    return () => { socket.off("finishGame"); }
  }, [socket, userInfo])

  useEffect(() => {
    if (userInfo.isMusicEnable) {
      musicAudio.play();
    } else {
      musicAudio.pause();
    }
  }, [userInfo.isMusicEnable])

  useEffect(() => {
    socket.on("newMsg", ({
      _id,
      userId,
      userName,
      avatar,
      message,
      img,
      likes,
      likesIDs,
      disLikes,
      disLikesIDs
    }) => {
      setMsgReceived(!msgReceived);
      updateUserMsg(
        _id,
        userId,
        userName,
        avatar,
        message,
        img,
        likes,
        likesIDs,
        disLikes,
        disLikesIDs
      );
    });
    return () => {
      socket.off("newMsg");
    };
  }, [socket, msgReceived, msgData]);

  const handleChangeUserSeed = (value: string) => {
    setUserSeedText(value);
  }

  const handlePlaceBet = async () => {
    let attrs = userInfo;
    let betStatus = userBetState;
    let fBetFlag = betStatus.fbetState && !attrs.f.betted;
    let sBetFlag = betStatus.sbetState && !attrs.s.betted;
    let fBetBalance = attrs.balance - attrs.f.betAmount < 0;
    let sBetBalance = attrs.balance - attrs.s.betAmount < 0;
    if (fBetFlag) {
      let fbetid = `Crash-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
      attrs.f.betid = fbetid;
      attrs.f.betted = true;
      let data = {
        type: "f",
        seed: userSeedText,
        userInfo: attrs,
      };
      if (fBetBalance) {
        toast.error("Your balance is not enough");
        betStatus.fbetState = false;
        setFLoading(false);
      } else {
        // attrs.userInfo.balance -= state.userInfo.f.betAmount;
        setFLoading(true);
        updateUserInfo(attrs);
        console.log(attrs.f.target, attrs.s.target);
        socket.emit("playBet", data);
        betStatus.fbetState = false;
        setUserBetState(betStatus);
      }
    }
    if (sBetFlag) {
      let sbetid = `Crash-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
      attrs.s.betid = sbetid;
      attrs.s.betted = true;
      let data = {
        type: "s",
        seed: userSeedText,
        userInfo: attrs,
      };
      if (sBetBalance) {
        toast.error("Your balance is not enough");
        betStatus.sbetState = false;
        setSLoading(false);
      } else {
        // attrs.userInfo.balance -= state.userInfo.s.betAmount;
        setSLoading(true);
        updateUserInfo(attrs);
        console.log(attrs.f.target, attrs.s.target);
        socket.emit("playBet", data);
        betStatus.sbetState = false;
        setUserBetState(betStatus);
      }
    }
  }

  useEffect(() => {
    if (gameState.GameState === "BET") handlePlaceBet();
  }, [state, gameState.GameState, userBetState.fbetState, userBetState.sbetState]);

  useEffect(() => {
    if (gameState.GameState === "READY") handleSetDefaultLoading()
  }, [gameState.GameState]);

  const getMyBets = async () => {
    try {
      let response = await axios.post(
        `${process.env.REACT_APP_DEVELOPMENT === "true"
          ? config.development_api
          : config.production_api
        }/my-info`,
        {
          userId: UserID,
        }
      );
      if (response?.data?.status) {
        update({ myBets: response.data.data as GameHistory[] });
      }
    } catch (error) {
      console.log("getMyBets", error);
    }
  };

  useEffect(() => {
    if (UserID) {
      getMyBets();
    }
    // eslint-disable-next-line
  }, [UserID]);

  const updateMyIpAddress = async () => {
    const res = await axios.get("https://api.ipify.org/?format=json");
    try {
      let platform: string = "desktop";
      if (isMobile) platform = "mobile"
      if (isTablet) platform = "tablet;"
      if (isDesktop) platform = "desktop"
      let response = await axios.post(
        `${process.env.REACT_APP_DEVELOPMENT === "true"
          ? config.development_api
          : config.production_api
        }/update-info`,
        {
          userId: UserID,
          updateData: {
            ipAddress: res.data.ip,
            platform
          },
        }
      );
      if (response?.data?.status) {
        updateUserInfo({
          ...userInfo,
          ipAddress: res.data.ip,
          platform
        }
        );
        setIP(res.data.ip)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (UserID) {
      if ((userInfo.ipAddress === "0.0.0.0" || userInfo.ipAddress === "") && ip === "") {
        updateMyIpAddress();
      }
    }
  }, [userInfo, UserID, ip]);

  return (
    <Context.Provider
      value={{
        state: state,
        ...betLimit,
        ...userBetState,
        ...unity,
        ...gameState,
        userInfo,
        socket,
        msgData,
        msgReceived,
        platformLoading,
        msgTab,
        errorBackend,
        currentTarget,
        secure,
        userSeedText,
        rechargeState,
        myUnityContext: unityContext,
        bettedUsers: [...bettedUsers],
        previousHand: [...previousHand],
        history: [...history],
        fLoading,
        setFLoading,
        sLoading,
        setSLoading,
        setMsgData,
        setCurrentTarget,
        setMsgReceived,
        update,
        updateUserInfo,
        getMyBets,
        updateUserBetState,
        handleGetSeed,
        handleGetSeedOfRound,
        handlePlaceBet,
        toggleMsgTab,
        handleChangeUserSeed,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Context;
