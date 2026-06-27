import { useState } from 'react';
import { useStore, buildNewApp } from '../store';
import { C, R } from '../tokens';
import { Button, Card, Input, SectionLabel, CalloutBox } from '../components/ui';
import { PARISHES, APP_TYPES, buildDocList } from '../data';
import type { Parish, ApplicationType } from '../types';

const STEPS = ['Parish & Type', 'Property Details', 'Review'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: done ? C.success : active ? C.primary : C.border,
                color: done || active ? '#fff' : C.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 10, color: active ? C.primary : done ? C.success : C.muted, fontWeight: active ? 700 : 400, marginTop: 4, whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? C.success : C.border, margin: '0 6px', marginBottom: 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Step1Props {
  parish: Parish | '';
  appType: ApplicationType | '';
  onParish: (p: Parish) => void;
  onType: (t: ApplicationType) => void;
  onNext: () => void;
}

function Step1({ parish, appType, onParish, onType, onNext }: Step1Props) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 4 }}>Select Parish & Application Type</div>
        <div style={{ fontSize: 13, color: C.muted }}>Planit is currently available in Kingston and St. Andrew.</div>
      </div>

      {/* Parish */}
      <SectionLabel>Parish</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
        {(Object.entries(PARISHES) as [Parish, typeof PARISHES[Parish]][]).map(([key, p]) => (
          <div
            key={key}
            onClick={() => p.available && onParish(key)}
            style={{
              border: `2px solid ${parish === key ? C.primary : C.border}`,
              borderRadius: R.lg, padding: '13px 14px',
              background: parish === key ? `${C.primary}08` : C.surface,
              cursor: p.available ? 'pointer' : 'not-allowed',
              opacity: p.available ? 1 : 0.4,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: parish === key ? C.primary : C.text }}>{p.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{p.agency}</div>
            {!p.available && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Coming soon</div>}
          </div>
        ))}
      </div>

      {/* Application Type */}
      <SectionLabel>Application Type</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {(Object.entries(APP_TYPES) as [ApplicationType, typeof APP_TYPES[ApplicationType]][]).map(([key, t]) => (
          <div
            key={key}
            onClick={() => t.available && onType(key)}
            style={{
              border: `2px solid ${appType === key ? C.primary : C.border}`,
              borderRadius: R.lg, padding: '13px 14px',
              background: appType === key ? `${C.primary}08` : C.surface,
              cursor: t.available ? 'pointer' : 'not-allowed',
              opacity: t.available ? 1 : 0.45,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: R.xs,
                    background: appType === key ? C.primary : C.surfaceAlt,
                    color: appType === key ? '#fff' : C.muted,
                  }}>{t.code}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: appType === key ? C.primary : C.text }}>{t.label}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{t.description}</div>
              </div>
              {appType === key && <div style={{ color: C.primary, fontSize: 18, marginLeft: 10, flexShrink: 0 }}>✓</div>}
            </div>
            {t.available && (
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: C.muted }}>⏱ {t.estimatedWeeks}</span>
                <span style={{ fontSize: 11, color: C.muted }}>📋 {t.copyCount} sets required</span>
              </div>
            )}
            {!t.available && <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Coming in Phase 2</div>}
          </div>
        ))}
      </div>

      {parish && appType && (
        <CalloutBox type="info">
          <strong>Agency:</strong> {PARISHES[parish as Parish].municipality} · {PARISHES[parish as Parish].agency}<br />
          <strong>Drawing spec:</strong> {APP_TYPES[appType as ApplicationType].drawingSpec}<br />
          <strong>Typical timeline:</strong> {APP_TYPES[appType as ApplicationType].estimatedWeeks}
        </CalloutBox>
      )}

      <div style={{ marginTop: 20 }}>
        <Button fullWidth size="lg" disabled={!parish || !appType} onClick={onNext}>
          Continue to Property Details →
        </Button>
      </div>
    </div>
  );
}

interface Step2Props {
  address: string; setAddress: (v: string) => void;
  lotNumber: string; setLotNumber: (v: string) => void;
  volume: string; setVolume: (v: string) => void;
  folio: string; setFolio: (v: string) => void;
  landArea: string; setLandArea: (v: string) => void;
  currentUse: string; setCurrentUse: (v: string) => void;
  proposedUse: string; setProposedUse: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function Step2(props: Step2Props) {
  const { address, setAddress, lotNumber, setLotNumber, volume, setVolume, folio, setFolio,
    landArea, setLandArea, currentUse, setCurrentUse, proposedUse, setProposedUse, onBack, onNext } = props;

  const valid = address && lotNumber && landArea && currentUse && proposedUse;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 4 }}>Property Details</div>
        <div style={{ fontSize: 13, color: C.muted }}>Enter details exactly as they appear on your Certificate of Title.</div>
      </div>

      <Input label="Property Address" value={address} onChange={setAddress} placeholder="e.g. 14 Barbican Road, Kingston 6" required />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Lot Number" value={lotNumber} onChange={setLotNumber} placeholder="e.g. Lot 47B" required />
        <Input label="Land Area (sq m)" value={landArea} onChange={setLandArea} placeholder="e.g. 465" type="number" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Title Volume" value={volume} onChange={setVolume} placeholder="e.g. 1204" hint="From your Certificate of Title" />
        <Input label="Title Folio" value={folio} onChange={setFolio} placeholder="e.g. 382" hint="From your Certificate of Title" />
      </div>

      <Input
        label="Current Use of Land"
        value={currentUse}
        onChange={setCurrentUse}
        placeholder="e.g. Vacant land, Residential dwelling"
        required
      />

      <Input
        label="Proposed Use / Development"
        value={proposedUse}
        onChange={setProposedUse}
        placeholder="e.g. 4-bedroom residential dwelling"
        required
      />

      <CalloutBox type="warning">
        <strong>Title not in your name?</strong> You will need to upload an Agreement for Sale, Probate, or Power of Attorney alongside your Certificate of Title.
      </CalloutBox>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Button variant="secondary" size="lg" onClick={onBack} style={{ flex: 1 }}>← Back</Button>
        <Button size="lg" disabled={!valid} onClick={onNext} style={{ flex: 2 }}>Review & Create →</Button>
      </div>
    </div>
  );
}

interface Step3Props {
  parish: Parish;
  appType: ApplicationType;
  address: string;
  lotNumber: string;
  volume: string;
  folio: string;
  landArea: string;
  currentUse: string;
  proposedUse: string;
  onBack: () => void;
  onCreate: () => void;
}

function Step3({ parish, appType, address, lotNumber, volume, folio, landArea, currentUse, proposedUse, onBack, onCreate }: Step3Props) {
  const p = PARISHES[parish];
  const t = APP_TYPES[appType];
  const docs = buildDocList(appType);
  const required = docs.filter(d => d.required);
  const optional = docs.filter(d => !d.required);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 4 }}>Review & Create</div>
        <div style={{ fontSize: 13, color: C.muted }}>Confirm your details. Your document checklist will be generated automatically.</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Application Details</SectionLabel>
        {[
          { l: 'Parish', v: p.label },
          { l: 'Agency', v: `${p.municipality} (${p.agency})` },
          { l: 'Application Type', v: `${t.label} (${t.code})` },
          { l: 'Property Address', v: address },
          { l: 'Lot Number', v: lotNumber },
          { l: 'Title Volume / Folio', v: volume && folio ? `Vol. ${volume} / Fol. ${folio}` : 'Not provided' },
          { l: 'Land Area', v: `${landArea} sq m` },
          { l: 'Current Use', v: currentUse },
          { l: 'Proposed Use', v: proposedUse },
        ].map(({ l, v }) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.muted }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Document Checklist Generated — {docs.length} items</SectionLabel>
        <div style={{ marginBottom: 12 }}>
          {required.map(d => (
            <div key={d.name} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${C.primary}12`, color: C.primary, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>✓</div>
              <div>
                <div style={{ fontSize: 12, color: C.text }}>{d.name}</div>
                {d.stamped && <div style={{ fontSize: 10, color: C.muted }}>Stamp required · {d.stampedBy}</div>}
                {d.drawingSize && <div style={{ fontSize: 10, color: C.muted }}>Size: {d.drawingSize}</div>}
              </div>
            </div>
          ))}
        </div>
        {optional.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{optional.length} optional / conditional documents</div>
            {optional.map(d => (
              <div key={d.name} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.surfaceAlt, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.muted }}>○</div>
                <div style={{ fontSize: 12, color: C.muted }}>{d.name}</div>
              </div>
            ))}
          </>
        )}
      </Card>

      <CalloutBox type="info">
        <strong>Copy count:</strong> {t.copyCount} complete sets · <strong>Drawing spec:</strong> {t.drawingSpec}.<br />
        Planit encodes exact print requirements — no guesswork at delivery.
      </CalloutBox>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Button variant="secondary" size="lg" onClick={onBack} style={{ flex: 1 }}>← Back</Button>
        <Button size="lg" onClick={onCreate} style={{ flex: 2, background: C.primary }}>
          Create Application →
        </Button>
      </div>
    </div>
  );
}

export default function NewApplication() {
  const { state, dispatch } = useStore();
  const step = state.wizardStep;

  const [parish, setParish]         = useState<Parish | ''>('');
  const [appType, setAppType]       = useState<ApplicationType | ''>('');
  const [address, setAddress]       = useState('');
  const [lotNumber, setLotNumber]   = useState('');
  const [volume, setVolume]         = useState('');
  const [folio, setFolio]           = useState('');
  const [landArea, setLandArea]     = useState('');
  const [currentUse, setCurrentUse] = useState('');
  const [proposedUse, setProposedUse] = useState('');

  function next() { dispatch({ type: 'SET_WIZARD_STEP', step: step + 1 }); }
  function back() { dispatch({ type: 'SET_WIZARD_STEP', step: step - 1 }); }

  function create() {
    if (!parish || !appType) return;
    const p = PARISHES[parish];
    const app = buildNewApp({
      parish,
      applicationType: appType,
      address, lotNumber, volume, folio,
      landAreaSqM: parseFloat(landArea) || 0,
      currentUse, proposedUse,
      municipality: p.municipality,
      agency: p.agency,
      docs: buildDocList(appType),
    });
    dispatch({ type: 'ADD_APPLICATION', app });
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, padding: 0, lineHeight: 1 }}
        >←</button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>New Application</div>
          <div style={{ fontSize: 11, color: C.muted }}>Step {step + 1} of {STEPS.length}</div>
        </div>
      </div>

      <StepIndicator current={step} />

      {step === 0 && (
        <Step1
          parish={parish} appType={appType}
          onParish={setParish} onType={setAppType}
          onNext={next}
        />
      )}
      {step === 1 && (
        <Step2
          address={address} setAddress={setAddress}
          lotNumber={lotNumber} setLotNumber={setLotNumber}
          volume={volume} setVolume={setVolume}
          folio={folio} setFolio={setFolio}
          landArea={landArea} setLandArea={setLandArea}
          currentUse={currentUse} setCurrentUse={setCurrentUse}
          proposedUse={proposedUse} setProposedUse={setProposedUse}
          onBack={back} onNext={next}
        />
      )}
      {step === 2 && parish && appType && (
        <Step3
          parish={parish} appType={appType}
          address={address} lotNumber={lotNumber} volume={volume} folio={folio}
          landArea={landArea} currentUse={currentUse} proposedUse={proposedUse}
          onBack={back} onCreate={create}
        />
      )}
    </div>
  );
}
