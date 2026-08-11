"use client";

import { useState } from "react";
import WaveBackground from "../components/WaveBackground";
import Landing from "../components/Landing";
import MasterPlanExplorer from "../components/MasterPlanExplorer";
import LeadForm from "../components/LeadForm";
import ResourcesScreen from "../components/ResourcesScreen";
import ConciergeChat from "../components/ConciergeChat";

const SCREENS = {
  LANDING: "landing",
  EXPLORER: "explorer",
  FORM: "form",
  RESOURCES: "resources",
};

export default function Page() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [persona, setPersona] = useState(null);
  const [prefillLot, setPrefillLot] = useState(null);

  function selectPersona(p) {
    setPersona(p);
    setScreen(SCREENS.EXPLORER);
  }

  function registerInterest(lot) {
    setPrefillLot(lot);
    setScreen(SCREENS.FORM);
  }

  return (
    <>
      <WaveBackground />

      {screen === SCREENS.LANDING && <Landing onSelectPersona={selectPersona} />}

      {screen === SCREENS.EXPLORER && (
        <div>
          <button className="back-link" style={{ margin: "16px 24px 0" }} onClick={() => setScreen(SCREENS.LANDING)}>
            ← Back to start
          </button>
          <MasterPlanExplorer persona={persona} onRegisterInterest={registerInterest} />
          <div className="screen-footer" style={{ textAlign: "center" }}>
            <button className="btn btn-primary" onClick={() => { setPrefillLot(null); setScreen(SCREENS.FORM); }}>
              Register Interest / Request Info
            </button>
          </div>
        </div>
      )}

      {screen === SCREENS.FORM && (
        <LeadForm
          persona={persona}
          prefillLot={prefillLot}
          onBack={() => setScreen(SCREENS.EXPLORER)}
          onSubmitted={() => setScreen(SCREENS.RESOURCES)}
        />
      )}

      {screen === SCREENS.RESOURCES && (
        <ResourcesScreen
          onBack={() => setScreen(SCREENS.FORM)}
          onBackToExplorer={() => setScreen(SCREENS.EXPLORER)}
        />
      )}

      <ConciergeChat persona={persona} />
    </>
  );
}
