import React from "react";
import Context from "../../context";
import { displayName } from "../utils";
import { BetResults, BettedUserType, UserType } from "../../utils/interfaces";
import { binaryToFloat } from "../utils";

interface AllDataProps {
  pre: boolean;
  setPre: React.Dispatch<React.SetStateAction<boolean>>;
  allData: UserType[] | BettedUserType[];
}

const AllData = ({ pre, setPre, allData }: AllDataProps) => {
  const { state, bettedUsers } = React.useContext(Context);

  return (
    <>
      {/* <div className="betted-info">
        <div className="info-item">
          <div className="uppercase">Number of players</div>
          <div>{betsResults?.members}</div>
        </div>
        <div className="info-item">
          <div className="uppercase">Total bets</div>
          <div>{betsResults?.betAmount.toFixed(2)}</div>
        </div>
        <div className="info-item">
          <div className="uppercase">Total winnings</div>
          <div>{betsResults?.cashouted.toFixed(2)}</div>
        </div>
      </div> */}
      <div>
        <div className="all-bets-block">
          <div>
            <div className="uppercase">ALL BETS</div>
            <div>{bettedUsers?.length}</div>
          </div>
          <div
            className={`previous-hand items-center flex justify-between ${pre ? "click" : ""
              }`}
          >
            <div className="history-i"></div>
            <span
              className="ml-1 "
              onClick={() => {
                setPre(!pre);
              }}
            >
              Previous hand
            </span>
          </div>
        </div>
        <div className="spacer"></div>
        <div className="legend all-data">
          <span className="user">User</span>
          <span className="bet">
            Bet,{" "}
            {`${state?.userInfo?.currency ? state?.userInfo?.currency : "INR"}`}
          </span>
          <span>X</span>
          <span className="cash-out">
            Cash out,{" "}
            {`${state?.userInfo?.currency ? state?.userInfo?.currency : "INR"}`}
          </span>
        </div>
      </div>
      <div className="cdk-virtual-scroll-viewport scroll-y">
        <div className="cdk-virtual-scroll-content-wrapper">
          {allData?.map((user, key) => (
            <div
              className={`bet-item ${user.cashouted ? "celebrated" : ""}`}
              key={key}
            >
              <div className="user">
                {user.avatar ? (
                  <img className="avatar" src={user.avatar} alt="avatar" />
                ) : (
                  <img
                    className="avatar"
                    src="./avatars/av-5.png"
                    alt="avatar"
                  />
                )}
                <div className="username">{displayName(user.name)}</div>
              </div>
              <div className="bet">{Number(user.betAmount).toFixed(2)}</div>
              {user.cashouted && (
                <div className="multiplier-block">
                  <div
                    className={`bubble font-weight-bold opacity-${100 - 2 * key} ${binaryToFloat(user.target) < 2
                      ? "blue"
                      : binaryToFloat(user.target) < 10
                        ? "purple"
                        : "big"
                      }`}
                  >
                    {binaryToFloat(user.target).toFixed(2)}x
                  </div>
                </div>
              )}
              <div className="cash-out">
                {Number(user.cashOut) > 0
                  ? Number(user.cashOut).toFixed(2)
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AllData;
