import React, { useCallback } from "react";
import api from "./api";
import StartButton from "./components/StartButton/StartButton";

const STATE_CREATING = "STATE_CREATING";
const STATE_IDLE = "STATE_IDLE";

export default function WaitingRoomView({
  enableStartButton,
  startJoiningCall,
  setCallState,
  setRoomUrl,
}) {
  // Handles creating a call
  const createCall = useCallback(async () => {
    setCallState(STATE_CREATING);
    try {
      const room = await api.createRoom();
      return room.url;
    } catch (error) {
      console.log("Error creating room", error);
      setRoomUrl(null);
      setCallState(STATE_IDLE);
    }
  }, [setCallState, setRoomUrl]);

  return (
    <div className="w-screen h-screen bg-green-200 flex justify-center items-center">
      <StartButton
        disabled={!enableStartButton}
        onClick={() => {
          createCall().then((url) => startJoiningCall(url));
        }}
      />
    </div>
  );
}
