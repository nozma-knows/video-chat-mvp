import { CallObjectContext } from "./App";
import Call from "./components/Call/Call";
import Controls from "./components/Controls/Controls";

export default function CallView({
  callObject,
  roomUrl,
  enableCallButtons,
  startLeavingCall,
}) {
  return (
    <CallObjectContext.Provider value={callObject}>
      <div className="w-screen h-screen">
        <Call roomUrl={roomUrl} />
        <Controls
          disabled={!enableCallButtons}
          onClickLeaveCall={startLeavingCall}
        />
      </div>
    </CallObjectContext.Provider>
  );
}
