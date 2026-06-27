import { useStore } from '../store';
import { C, R, S } from '../tokens';
import { StatusBadge, Progress, Button, SectionLabel, EmptyState } from '../components/ui';
import type { Application } from '../types';
import { APP_TYPES } from '../data';

function docProgress(app: Application): { done: number; total: number } {
  const req = app.docs.filter(d => d.required);
  return { done: req.filter(d => d.status !== 'pending').length, total: req.length };
}

function AppCard({ app }: { app: Application }) {
  const { dispatch } = useStore();
  const prog = docProgress(app);
  const typeInfo = APP_TYPES[app.applicationType];
  const activeFlags = app.aiFlags.filter(f => !f.dismissed && f.severity === 'critical').length;

  return (
    <div
      onClick={() => dispatch({ type: 'SET_ACTIVE', id: app.id })}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: R.lg, padding: 16, cursor: 'pointer',
        transition: 'all 0.15s', boxShadow: S.sm,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = S.md; (e.currentTarget as HTMLElement).style.borderColor = C.borderMid; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = S.sm; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: R.xs,
              background: `${C.primary}12`, color: C.primary, letterSpacing: '0.3px',
            }}>{typeInfo.code}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{app.ref}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{app.address}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{app.municipality}</div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Progress */}
      {app.status === 'documents' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Documents</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{prog.done}/{prog.total}</span>
          </div>
          <Progress value={prog.done} max={prog.total} color={prog.done === prog.total ? C.success : C.accent} />
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: C.muted }}>
          Updated {app.updatedAt}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {activeFlags > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: R.full, background: C.dangerBg, color: C.dangerText }}>
              {activeFlags} critical flag{activeFlags > 1 ? 's' : ''}
            </span>
          )}
          {app.collaborators.filter(c => c.status === 'stalled').length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: R.full, background: C.warningBg, color: C.warningText }}>
              Collaborator stalled
            </span>
          )}
          {app.submittedAt && (
            <span style={{ fontSize: 11, color: C.muted }}>Submitted {app.submittedAt}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const FLOW_STAGES = [
  { key: 'documents', label: 'Documents',  icon: '📄' },
  { key: 'review',    label: 'AI Review',  icon: '◎' },
  { key: 'payment',   label: 'Payment',    icon: '💳' },
  { key: 'ready',     label: 'Ready',      icon: '✓' },
  { key: 'submitted', label: 'Submitted',  icon: '→' },
];

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { applications } = state;

  const inProgress = applications.filter(a => !['submitted', 'approved', 'rejected'].includes(a.status));
  const submitted  = applications.filter(a => ['submitted', 'under-review', 'approved', 'rejected'].includes(a.status));

  return (
    <div style={{ padding: '20px 16px', maxWidth: 680, margin: '0 auto' }}>

      {/* Welcome strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.primary, letterSpacing: '-0.5px', lineHeight: 1 }}>
            My Applications
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            {applications.length} total · {inProgress.length} in progress
          </div>
        </div>
        <Button
          size="md"
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'new-application' })}
          style={{ whiteSpace: 'nowrap' }}
        >
          + New Application
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'In Progress',  value: inProgress.length,  color: C.primary },
          { label: 'Submitted',    value: submitted.length,   color: C.success },
          { label: 'Docs Needed',  value: inProgress.filter(a => {
            const p = docProgress(a);
            return p.done < p.total;
          }).length, color: C.accent },
        ].map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg,
            padding: '14px 16px', boxShadow: S.xs,
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>In Progress</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inProgress.map(a => <AppCard key={a.id} app={a} />)}
          </div>
        </div>
      )}

      {/* Submitted */}
      {submitted.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Submitted</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {submitted.map(a => <AppCard key={a.id} app={a} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 && (
        <EmptyState
          icon="📋"
          title="No applications yet"
          sub="Start your first planning permission application. Planit will guide you through every step."
        />
      )}

      {/* Flow explainer */}
      <div style={{ background: C.primary, borderRadius: R.lg, padding: 16, marginTop: 8 }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: '0.8px', marginBottom: 12 }}>
          HOW IT WORKS
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {FLOW_STAGES.map((stage, i) => (
            <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i < FLOW_STAGES.length - 1 && (
                <div style={{ position: 'absolute', top: 13, left: '50%', width: '100%', height: 2, background: 'rgba(255,255,255,0.12)', zIndex: 0 }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
              }}>{i + 1}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>{stage.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
