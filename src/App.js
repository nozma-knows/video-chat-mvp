import React, { useState, useEffect, useCallback, createContext } from "react";
import DailyIframe from "@daily-co/daily-js";
import CallView from "./CallView";
import WaitingRoomView from "./WaitingRoomView";
import { pageUrlFromRoomUrl, roomUrlFromPageUrl } from "./utils/url-utils";
import { logDailyEvent } from "./utils/log-utils";

// Call states
const STATE_IDLE = "STATE_IDLE";
const STATE_JOINING = "STATE_JOINING";
const STATE_JOINED = "STATE_JOINED";
const STATE_LEAVING = "STATE_LEAVING";
const STATE_ERROR = "STATE_ERROR";

export const CallObjectContext = createContext();

export default function App() {
  const [callState, setCallState] = useState(STATE_IDLE); // call state
  const [roomUrl, setRoomUrl] = useState(null); // room URL
  const [callObject, setCallObject] = useState(null); // call object

  // Handles joining a call
  const startJoiningCall = useCallback((url) => {
    const newCallObject = DailyIframe.createCallObject();
    setRoomUrl(url);
    setCallObject(newCallObject);
    setCallState(STATE_JOINING);
    newCallObject.join({ url });
  }, []);

  // Handles leaving a call
  const startLeavingCall = useCallback(() => {
    if (!callObject) return;
    // If we're in the error state, we've already "left", so just clean up
    if (callState === STATE_ERROR) {
      callObject.destroy().then(() => {
        setRoomUrl(null);
        setCallObject(null);
        setCallState(STATE_IDLE);
      });
    } else {
      setCallState(STATE_LEAVING);
      callObject.leave();
    }
  }, [callObject, callState]);

  // Join room if room is already specified in the pages URL on component mount
  useEffect(() => {
    const url = roomUrlFromPageUrl();
    url && startJoiningCall(url);
  }, [startJoiningCall]);

  // Udate pages URL to reflect the active call when roomUrl changes
  useEffect(() => {
    const pageUrl = pageUrlFromRoomUrl(roomUrl);
    if (pageUrl === window.location.href) return;
    window.history.replaceState(null, null, pageUrl);
  }, [roomUrl]);

  // Update state on meeting state changes
  useEffect(() => {
    if (!callObject) return;

    const events = ["joined-meeting", "left-meeting", "error"];

    function handleNewMeetingState(event) {
      event && logDailyEvent(event);
      switch (callObject.meetingState()) {
        case "joined-meeting":
          setCallState(STATE_JOINED);
          break;
        case "left-meeting":
          callObject.destroy().then(() => {
            setRoomUrl(null);
            setCallObject(null);
            setCallState(STATE_IDLE);
          });
          break;
        case "error":
          setCallState(STATE_ERROR);
          break;
        default:
          break;
      }
    }

    // Use initial state
    handleNewMeetingState();

    // Listen for changes in state
    for (const event of events) {
      callObject.on(event, handleNewMeetingState);
    }

    // Stop listening for changes in state
    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewMeetingState);
      }
    };
  }, [callObject]);

  // Listen for app messages from other call participants
  useEffect(() => {
    if (!callObject) {
      return;
    }

    function handleAppMessage(event) {
      if (event) {
        logDailyEvent(event);
        console.log(`received app message from ${event.fromId}: `, event.data);
      }
    }

    callObject.on("app-message", handleAppMessage);

    return function cleanup() {
      callObject.off("app-message", handleAppMessage);
    };
  }, [callObject]);

  const showCall = [STATE_JOINING, STATE_JOINED, STATE_ERROR].includes(
    callState
  );

  const enableCallButtons = [STATE_JOINED, STATE_ERROR].includes(callState);

  const enableStartButton = callState === STATE_IDLE;

  return (
    <div className="app">
      {showCall ? (
        <CallView
          callObject={callObject}
          roomUrl={roomUrl}
          enableCallButtons={enableCallButtons}
          startLeavingCall={startLeavingCall}
        />
      ) : (
        <WaitingRoomView
          enableStartButton={enableStartButton}
          startJoiningCall={startJoiningCall}
          setCallState={setCallState}
          setRoomUrl={setRoomUrl}
        />
      )}
    </div>
  );
}
