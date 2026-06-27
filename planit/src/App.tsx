import { StoreProvider, useStore } from './store';
import { C, F, R, S } from './tokens';
import Dashboard from './screens/Dashboard';
import NewApplication from './screens/NewApplication';
import ApplicationDetail from './screens/ApplicationDetail';

function AppShell() {
  const { state, dispatch } = useStore();
  const { screen } = state;

  return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: '100vh' }}>
      {/* Top nav */}
      <div style={{
        background: C.primary, position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: S.md,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', maxWidth: 680, margin: '0 auto' }}>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: R.md,
              background: 'rgba(212,168,83,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#D4A853',
              border: '1px solid rgba(212,168,83,0.2)',
            }}>P</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1 }}>Planit</div>
              <div style={{ fontSize: 10, color: '#95BBA8', marginTop: 1 }}>Planning Portal · Jamaica</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {screen === 'new-application' && (
              <div style={{ fontSize: 11, color: '#95BBA8', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: R.full }}>
                New Application
              </div>
            )}
            {screen === 'application-detail' && state.activeId && (
              <div style={{ fontSize: 11, color: '#95BBA8', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: R.full }}>
                Application Detail
              </div>
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>R</div>
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div>
        {screen === 'dashboard'           && <Dashboard />}
        {screen === 'new-application'     && <NewApplication />}
        {screen === 'application-detail'  && <ApplicationDetail />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
