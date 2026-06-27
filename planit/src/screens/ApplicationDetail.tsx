import { useState } from 'react';
import { useStore } from '../store';
import { C, R } from '../tokens';
import { Button, Card, Badge, StatusBadge, Progress, SectionLabel, CalloutBox, InfoRow } from '../components/ui';
import { APP_TYPES, PARISHES, buildFee } from '../data';
import type { DocItem, SubmissionPath } from '../types';

// ── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',   label: 'Overview' },
  { key: 'checklist',  label: 'Checklist' },
  { key: 'ai-review',  label: 'AI Review' },
  { key: 'fee',        label: 'Fee & Pay' },
  { key: 'submit',     label: 'Submit' },
];

// ── OVERVIEW ────────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'documents',   label: 'Documents',     desc: 'Upload all required documents' },
  { key: 'review',      label: 'AI Review',     desc: 'Run completeness and flag check' },
  { key: 'payment',     label: 'Agency Payment', desc: 'Pay agency fee and upload receipt' },
  { key: 'ready',       label: 'Planit Fee',    desc: 'Pay Planit service fee' },
  { key: 'submitted',   label: 'Submitted',     desc: 'Application delivered to agency' },
];

function Overview() {
  const { activeApp } = useStore();
  if (!activeApp) return null;
  const app = activeApp;
  const typeInfo = APP_TYPES[app.applicationType];
  const parishInfo = PARISHES[app.parish];
  const currentStageIdx = STAGES.findIndex(s => s.key === app.status);

  return (
    <div>
      {/* App summary */}
      <Card style={{ marginBottom: 14, background: C.primary, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 3 }}>{app.ref}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{app.address}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{parishInfo.agency} · {typeInfo.code}</div>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Lot', value: app.lotNumber || '—' },
            { label: 'Area', value: `${app.landAreaSqM} sq m` },
            { label: 'Timeline', value: typeInfo.estimatedWeeks },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: R.md, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Progress pipeline */}
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Application Stage</SectionLabel>
        <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
          {STAGES.map((stage, i) => {
            const done = i < currentStageIdx || (stage.key === 'submitted' && app.status === 'submitted');
            const active = i === currentStageIdx;
            return (
              <div key={stage.key} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {i < STAGES.length - 1 && (
                  <div style={{ position: 'absolute', top: 13, left: '50%', width: '100%', height: 2, background: done ? C.success : C.border, zIndex: 0 }} />
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', zIndex: 1, flexShrink: 0,
                  background: done ? C.success : active ? C.primary : C.border,
                  color: done || active ? '#fff' : C.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  boxShadow: active ? `0 0 0 4px ${C.primary}22` : 'none',
                }}>{done ? '✓' : i + 1}</div>
                <div style={{
                  fontSize: 9, textAlign: 'center', marginTop: 6, padding: '0 2px',
                  color: done ? C.success : active ? C.primary : C.muted,
                  fontWeight: active ? 700 : 400, lineHeight: 1.3,
                }}>{stage.label}</div>
              </div>
            );
          })}
        </div>

        {/* Current stage action */}
        {app.status === 'documents' && (
          <CalloutBox type="info">
            Upload required documents in the <strong>Checklist</strong> tab. Once all required documents are uploaded, run AI Review.
          </CalloutBox>
        )}
        {app.status === 'review' && (
          <CalloutBox type="info">
            All required documents uploaded. Run the <strong>AI Review</strong> to check completeness before proceeding to payment.
          </CalloutBox>
        )}
        {app.status === 'submitted' && app.trackingStatus && (
          <CalloutBox type="success">
            {app.trackingStatus}
          </CalloutBox>
        )}
      </Card>

      {/* Property details */}
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Property Details</SectionLabel>
        <InfoRow label="Address" value={app.address} />
        <InfoRow label="Lot Number" value={app.lotNumber} />
        <InfoRow label="Title Vol / Folio" value={app.volume ? `Vol. ${app.volume} / Fol. ${app.folio}` : '—'} />
        <InfoRow label="Land Area" value={`${app.landAreaSqM} sq m (${Math.round(app.landAreaSqM * 10.764)} sq ft)`} />
        <InfoRow label="Current Use" value={app.currentUse} />
        <InfoRow label="Proposed Use" value={app.proposedUse} />
      </Card>

      {/* Collaborators */}
      {app.collaborators.length > 0 && (
        <Card>
          <SectionLabel>Collaborators</SectionLabel>
          {app.collaborators.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{c.email} · {c.role}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: C.muted }}>{c.assignedDocIds.length} docs</span>
                <Badge variant={c.status === 'stalled' ? 'danger' : c.status === 'uploaded' ? 'success' : 'neutral'}>
                  {c.status}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── CHECKLIST ────────────────────────────────────────────────────────────────
function DocRow({ doc, appId }: { doc: DocItem; appId: string }) {
  const { dispatch } = useStore();
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    pending: C.muted,
    uploaded: C.accent,
    flagged: C.danger,
    verified: C.success,
  }[doc.status];

  const statusLabel = { pending: 'Pending', uploaded: 'Uploaded', flagged: 'Flagged', verified: 'Verified' }[doc.status];

  function markUploaded() {
    dispatch({
      type: 'UPDATE_DOC', appId, docId: doc.id,
      patch: { status: 'uploaded', uploadedAt: new Date().toISOString().split('T')[0] },
    });
  }
  function markPending() {
    dispatch({ type: 'UPDATE_DOC', appId, docId: doc.id, patch: { status: 'pending', uploadedAt: undefined } });
  }

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', cursor: 'pointer' }}
      >
        {/* Status dot */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          background: doc.status !== 'pending' ? statusColor : C.surfaceAlt,
          border: `2px solid ${statusColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {doc.status !== 'pending' && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{doc.name}</span>
            {!doc.required && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: R.xs, background: C.surfaceAlt, color: C.muted, fontWeight: 700 }}>OPTIONAL</span>}
            {doc.stamped && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: R.xs, background: C.warningBg, color: C.warningText, fontWeight: 700 }}>STAMP</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {doc.stampedBy && <span style={{ fontSize: 11, color: C.muted }}>by {doc.stampedBy}</span>}
            {doc.drawingSize && <span style={{ fontSize: 11, color: C.muted }}>{doc.drawingSize}</span>}
            {doc.uploadedAt && <span style={{ fontSize: 11, color: C.muted }}>Uploaded {doc.uploadedAt}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
          <span style={{ color: C.muted, fontSize: 14 }}>{expanded ? '−' : '+'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingBottom: 12, paddingLeft: 30 }}>
          {doc.notes && (
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>{doc.notes}</div>
          )}
          {doc.stamped && (
            <CalloutBox type="warning" >
              This document must carry a valid professional stamp from a {doc.stampedBy} before upload. Planit will confirm stamp visibility on receipt.
            </CalloutBox>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {doc.status === 'pending' ? (
              <Button size="sm" onClick={markUploaded}>Mark as Uploaded</Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={markPending}>Remove Upload</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Checklist() {
  const { activeApp, dispatch } = useStore();
  const [showCollab, setShowCollab] = useState(false);
  const [collabName, setCollabName] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<'architect' | 'engineer' | 'surveyor' | 'attorney'>('architect');

  if (!activeApp) return null;
  const app = activeApp;
  const required = app.docs.filter(d => d.required);
  const optional = app.docs.filter(d => !d.required);
  const done = required.filter(d => d.status !== 'pending').length;
  const allDone = done === required.length;

  function addCollab() {
    if (!collabName || !collabEmail) return;
    dispatch({
      type: 'ADD_COLLABORATOR', appId: app.id,
      collab: {
        id: Math.random().toString(36).slice(2),
        name: collabName, email: collabEmail, role: collabRole,
        status: 'invited', invitedAt: new Date().toISOString().split('T')[0],
        assignedDocIds: [],
      },
    });
    setCollabName(''); setCollabEmail(''); setShowCollab(false);
  }

  function runReview() {
    dispatch({ type: 'RUN_AI_REVIEW', appId: app.id });
    dispatch({ type: 'SET_DETAIL_TAB', tab: 'ai-review' });
  }

  return (
    <div>
      {/* Progress */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{done}/{required.length} required documents</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {allDone ? 'All required documents uploaded. Run AI Review.' : `${required.length - done} remaining`}
            </div>
          </div>
          {allDone && !app.aiReviewRun && (
            <Button size="sm" onClick={runReview}>Run AI Review</Button>
          )}
        </div>
        <Progress value={done} max={required.length} color={allDone ? C.success : C.primary} />
      </Card>

      {/* Document list */}
      <Card style={{ marginBottom: 14, padding: '4px 16px' }}>
        <div style={{ padding: '10px 0' }}>
          <SectionLabel>Required ({required.length})</SectionLabel>
          {required.map(d => <DocRow key={d.id} doc={d} appId={app.id} />)}
        </div>
        {optional.length > 0 && (
          <div style={{ padding: '10px 0' }}>
            <SectionLabel>Optional / Conditional ({optional.length})</SectionLabel>
            {optional.map(d => <DocRow key={d.id} doc={d} appId={app.id} />)}
          </div>
        )}
      </Card>

      {/* Collaborators */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Collaborators</div>
            <div style={{ fontSize: 11, color: C.muted }}>Invite your architect, engineer, or surveyor to upload their documents directly.</div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowCollab(s => !s)}>+ Invite</Button>
        </div>

        {showCollab && (
          <div style={{ background: C.surfaceAlt, borderRadius: R.md, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Invite a Collaborator</div>
            <input
              placeholder="Full name" value={collabName} onChange={e => setCollabName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: R.sm, fontSize: 13, marginBottom: 8, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Email address" value={collabEmail} onChange={e => setCollabEmail(e.target.value)}
              type="email"
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: R.sm, fontSize: 13, marginBottom: 8, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <select
              value={collabRole} onChange={e => setCollabRole(e.target.value as typeof collabRole)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: R.sm, fontSize: 13, marginBottom: 12, fontFamily: 'inherit', background: C.surface, boxSizing: 'border-box' }}
            >
              <option value="architect">Architect</option>
              <option value="engineer">Engineer</option>
              <option value="surveyor">Surveyor</option>
              <option value="attorney">Attorney</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={addCollab} disabled={!collabName || !collabEmail}>Send Invite</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCollab(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {app.collaborators.length === 0 && !showCollab && (
          <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>No collaborators added yet.</div>
        )}

        {app.collaborators.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{c.email} · {c.role}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Invited {c.invitedAt}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <Badge variant={c.status === 'stalled' ? 'danger' : c.status === 'uploaded' ? 'success' : 'neutral'}>{c.status}</Badge>
              <button
                onClick={() => dispatch({ type: 'REMOVE_COLLABORATOR', appId: app.id, collabId: c.id })}
                style={{ fontSize: 10, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}
              >Remove</button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── AI REVIEW ────────────────────────────────────────────────────────────────
function AIReview() {
  const { activeApp, dispatch } = useStore();
  const [dismissId, setDismissId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (!activeApp) return null;
  const app = activeApp;

  const severityOrder = { critical: 0, warning: 1, advisory: 2 };
  const sorted = [...app.aiFlags].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const active = sorted.filter(f => !f.dismissed);
  const dismissed = sorted.filter(f => f.dismissed);

  const severityStyle = {
    critical: { bg: C.dangerBg, border: C.danger, text: C.dangerText, badge: 'danger' as const },
    warning:  { bg: C.warningBg, border: C.warning, text: C.warningText, badge: 'warning' as const },
    advisory: { bg: `${C.primary}08`, border: C.borderMid, text: C.primary, badge: 'primary' as const },
  };

  if (!app.aiReviewRun) {
    const required = app.docs.filter(d => d.required);
    const done = required.filter(d => d.status !== 'pending').length;
    const allDone = done === required.length;
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>AI Review not yet run</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            {allDone
              ? 'All required documents are uploaded. Run the review to check completeness and flag potential issues.'
              : `${required.length - done} required document${required.length - done > 1 ? 's' : ''} still pending. Complete the checklist first.`
            }
          </div>
          <Button
            onClick={() => dispatch({ type: 'RUN_AI_REVIEW', appId: app.id })}
            disabled={!allDone}
          >
            Run AI Review
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Summary */}
      <Card style={{ marginBottom: 14, background: active.filter(f => f.severity === 'critical').length > 0 ? C.dangerBg : C.successLight, border: 'none' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 24 }}>{active.filter(f => f.severity === 'critical').length > 0 ? '⚠' : '✓'}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {active.filter(f => f.severity === 'critical').length > 0
                ? `${active.filter(f => f.severity === 'critical').length} critical flag${active.filter(f => f.severity === 'critical').length > 1 ? 's' : ''} must be resolved`
                : 'No critical issues found'
              }
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              Layer 1 (rules-based) · {active.length} active flags · {dismissed.length} dismissed
            </div>
          </div>
        </div>
      </Card>

      {/* Active flags */}
      {active.map(flag => {
        const style = severityStyle[flag.severity];
        return (
          <div key={flag.id} style={{
            background: style.bg, border: `1px solid ${style.border}`,
            borderRadius: R.lg, padding: 14, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge variant={style.badge}>{flag.severity.toUpperCase()}</Badge>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{flag.title}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: style.text, lineHeight: 1.5, marginBottom: 10 }}>{flag.description}</div>

            {flag.severity !== 'critical' && dismissId !== flag.id && (
              <button
                onClick={() => { setDismissId(flag.id); setReason(''); }}
                style={{ fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Dismiss flag
              </button>
            )}

            {dismissId === flag.id && (
              <div style={{ background: C.surface, borderRadius: R.sm, padding: 10, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Reason for dismissal (required)</div>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why this flag does not apply..."
                  rows={2}
                  style={{ width: '100%', padding: '6px 8px', border: `1px solid ${C.border}`, borderRadius: R.xs, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Button size="sm" disabled={!reason.trim()} onClick={() => {
                    dispatch({ type: 'DISMISS_FLAG', appId: app.id, flagId: flag.id, reason });
                    setDismissId(null); setReason('');
                  }}>Confirm Dismiss</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDismissId(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Dismissed */}
      {dismissed.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Dismissed Flags ({dismissed.length})</SectionLabel>
          {dismissed.map(f => (
            <div key={f.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}`, opacity: 0.6 }}>
              <div style={{ fontSize: 13, color: C.muted, textDecoration: 'line-through', flex: 1 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: C.muted, maxWidth: 160, textAlign: 'right' }}>"{f.dismissReason}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FEE & PAYMENT ────────────────────────────────────────────────────────────────
function FeePayment() {
  const { activeApp, dispatch } = useStore();
  const [path, setPath] = useState<SubmissionPath>('print-deliver');

  if (!activeApp) return null;
  const app = activeApp;

  const docCount = {
    a0: app.docs.filter(d => d.drawingSize === 'A0' && d.status !== 'pending').length,
    a1: app.docs.filter(d => d.drawingSize === 'A1' && d.status !== 'pending').length,
    a4: app.docs.filter(d => !d.drawingSize && d.status !== 'pending').length,
  };

  const fee = buildFee(app.parish, app.applicationType, app.landAreaSqM, path, docCount);

  const PATHS: { id: SubmissionPath; title: string; sub: string; color: string }[] = [
    { id: 'print-deliver', title: 'Print & Deliver', sub: 'Planit handles everything', color: C.primary },
    { id: 'deliver-only',  title: 'Deliver Only',    sub: 'You print, Planit couriers', color: C.mid },
    { id: 'self-deliver',  title: 'Self Deliver',    sub: 'You handle delivery', color: C.midLight },
  ];

  return (
    <div>
      {/* Submission path selector */}
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Submission Path</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {PATHS.map(p => (
            <div
              key={p.id}
              onClick={() => setPath(p.id)}
              style={{
                border: `2px solid ${path === p.id ? p.color : C.border}`,
                borderRadius: R.md, padding: '10px 10px',
                background: path === p.id ? `${p.color}10` : C.surface,
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: path === p.id ? p.color : C.text, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3, lineHeight: 1.3 }}>{p.sub}</div>
            </div>
          ))}
        </div>

        {path === 'print-deliver' && (
          <CalloutBox type="info">
            Planit prints at A0 and A1, collates all {APP_TYPES[app.applicationType].copyCount} required sets, and couriers to {PARISHES[app.parish].agency}. Photo confirmation logged.
          </CalloutBox>
        )}
        {path === 'deliver-only' && (
          <CalloutBox type="warning">
            You are responsible for print quality and copy count. If the municipality rejects for print issues, redelivery cost falls on you.
          </CalloutBox>
        )}
        {path === 'self-deliver' && (
          <CalloutBox type="warning">
            Planit sends the digital notification only. You deliver prints directly. Confirm delivery in app afterward.
          </CalloutBox>
        )}
      </Card>

      {/* Fee breakdown */}
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Fee Breakdown</SectionLabel>
        {[
          { label: 'Agency Fee (estimated)', value: `$${fee.agencyFee.toLocaleString()} JMD`, note: `Last verified: ${fee.agencyLastVerified}` },
          { label: 'Planit Service Fee', value: `$${fee.serviceFee.toLocaleString()} JMD`, note: undefined },
          ...(path === 'print-deliver' ? [{ label: 'Print Fee', value: `$${fee.printFee.toLocaleString()} JMD`, note: `A0 ×${docCount.a0} · A1 ×${docCount.a1} · A4 ×${docCount.a4}` }] : []),
          ...(fee.deliveryFee > 0 ? [{ label: 'Delivery Fee', value: `$${fee.deliveryFee.toLocaleString()} JMD`, note: undefined }] : []),
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13, color: C.text }}>{row.label}</div>
              {row.note && <div style={{ fontSize: 10, color: C.muted }}>{row.note}</div>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{row.value}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>Estimated Total</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>${fee.total.toLocaleString()} JMD</div>
        </div>
        <CalloutBox type="warning">
          Agency fee is an estimate. Actual fee is set by {PARISHES[app.parish].agency} at the time of submission.
        </CalloutBox>
      </Card>

      {/* Agency payment instructions */}
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Agency Payment Instructions</SectionLabel>
        <div style={{ background: C.primary, borderRadius: R.md, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>PAYMENT METHOD</div>
          <div style={{ fontSize: 13, color: '#fff', marginBottom: 12, lineHeight: 1.5 }}>{fee.paymentMethod}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>WHERE TO PAY</div>
          <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5 }}>{fee.paymentInstructions}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Pay the agency fee directly. Planit never receives agency funds. Once paid, upload your receipt below.
          </div>
        </div>
      </Card>

      {/* Receipt upload */}
      {!app.receiptUploaded ? (
        <Card>
          <SectionLabel>Upload Agency Fee Receipt</SectionLabel>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
            After paying the agency fee, upload a clear photo or scan of your receipt. Planit staff will verify within 4 business hours.
          </div>
          <Button
            fullWidth
            onClick={() => {
              dispatch({ type: 'SET_SUBMISSION_PATH', appId: app.id, path });
              dispatch({ type: 'MARK_RECEIPT_UPLOADED', appId: app.id });
            }}
          >
            Simulate Receipt Upload
          </Button>
        </Card>
      ) : !app.receiptVerified ? (
        <Card style={{ background: C.warningBg, border: `1px solid ${C.warning}`, borderRadius: R.lg }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.warningText, marginBottom: 6 }}>Receipt Uploaded — Pending Verification</div>
          <div style={{ fontSize: 12, color: C.warningText }}>Planit staff will verify your receipt within 4 business hours.</div>
          <Button size="sm" style={{ marginTop: 12 }} onClick={() => dispatch({ type: 'MARK_RECEIPT_VERIFIED', appId: app.id })}>
            [Demo] Mark Verified
          </Button>
        </Card>
      ) : !app.planitFeePaid ? (
        <Card>
          <SectionLabel>Receipt Verified — Pay Planit Service Fee</SectionLabel>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
            Agency fee receipt verified. Pay the Planit service fee (${fee.serviceFee.toLocaleString()} JMD) to trigger submission.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {['Visa / Mastercard', 'Bank Transfer', 'Lynk', 'Paymaster'].map(m => (
              <span key={m} style={{ padding: '4px 10px', borderRadius: R.full, background: C.surfaceAlt, fontSize: 11, color: C.muted, fontWeight: 600 }}>{m}</span>
            ))}
          </div>
          <Button fullWidth onClick={() => dispatch({ type: 'MARK_PLANIT_FEE_PAID', appId: app.id })}>
            Pay ${fee.serviceFee.toLocaleString()} JMD → Trigger Submission
          </Button>
        </Card>
      ) : (
        <Card style={{ background: C.successLight, border: `1px solid ${C.success}`, borderRadius: R.lg }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.successText }}>Payment complete — application ready for submission</div>
          <div style={{ fontSize: 12, color: C.successText, marginTop: 6 }}>Go to the Submit tab to complete your submission.</div>
        </Card>
      )}
    </div>
  );
}

// ── SUBMIT ────────────────────────────────────────────────────────────────
function Submit() {
  const { activeApp, dispatch } = useStore();
  if (!activeApp) return null;
  const app = activeApp;

  if (app.status === 'submitted') {
    return (
      <div>
        <Card style={{ background: C.successLight, border: `1px solid ${C.success}`, marginBottom: 14 }}>
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.successText, marginBottom: 4 }}>Submitted</div>
            <div style={{ fontSize: 13, color: C.successText }}>{app.submittedAt}</div>
          </div>
        </Card>
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Tracking</SectionLabel>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            {app.trackingStatus || 'Under review at ' + app.agency}
          </div>
        </Card>
        <Card>
          <SectionLabel>What happens now</SectionLabel>
          {[
            'Planit submits a digital notification email to the agency with a secure download link.',
            app.submissionPath === 'print-deliver' ? 'Planit is printing your documents and scheduling courier delivery.' : 'Monitor delivery status.',
            'Agency typically begins review within 2–4 weeks of receiving hard copies.',
            'Planit will follow up with the agency on your behalf if no response after 4 weeks.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.successLight, color: C.successText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, paddingTop: 1 }}>{item}</div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  const ready = app.planitFeePaid && app.receiptVerified && app.aiReviewRun;

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Submission Checklist</SectionLabel>
        {[
          { label: 'All required documents uploaded', done: app.docs.filter(d => d.required).every(d => d.status !== 'pending') },
          { label: 'AI Review completed', done: app.aiReviewRun },
          { label: 'No critical AI flags outstanding', done: app.aiFlags.filter(f => !f.dismissed && f.severity === 'critical').length === 0 },
          { label: 'Agency fee receipt uploaded and verified', done: app.receiptVerified },
          { label: 'Planit service fee paid', done: app.planitFeePaid },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: item.done ? C.success : C.surfaceAlt,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.done
                ? <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
                : <span style={{ color: C.muted, fontSize: 10 }}>○</span>
              }
            </div>
            <div style={{ fontSize: 13, color: item.done ? C.text : C.muted }}>{item.label}</div>
          </div>
        ))}
      </Card>

      {!ready && (
        <CalloutBox type="warning">
          Complete all checklist items above before submitting.
        </CalloutBox>
      )}

      <Button
        fullWidth size="lg"
        disabled={!ready}
        style={{ marginTop: 16 }}
        onClick={() => dispatch({ type: 'SUBMIT_APPLICATION', appId: app.id })}
      >
        Submit to {activeApp.agency}
      </Button>
    </div>
  );
}

// ── MAIN DETAIL SCREEN ───────────────────────────────────────────────────
export default function ApplicationDetail() {
  const { state, activeApp, dispatch } = useStore();
  const tab = state.activeDetailTab;

  if (!activeApp) return null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Back header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 18, padding: 0, lineHeight: 1 }}
        >←</button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{activeApp.address}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{activeApp.ref} · {APP_TYPES[activeApp.applicationType].code}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', padding: '0 12px', whiteSpace: 'nowrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => dispatch({ type: 'SET_DETAIL_TAB', tab: t.key })}
              style={{
                padding: '12px 14px',
                border: 'none',
                borderBottom: tab === t.key ? `2px solid ${C.primary}` : '2px solid transparent',
                background: 'transparent',
                color: tab === t.key ? C.primary : C.muted,
                fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 16px', paddingBottom: 40 }}>
        {tab === 'overview'  && <Overview />}
        {tab === 'checklist' && <Checklist />}
        {tab === 'ai-review' && <AIReview />}
        {tab === 'fee'       && <FeePayment />}
        {tab === 'submit'    && <Submit />}
      </div>
    </div>
  );
}
