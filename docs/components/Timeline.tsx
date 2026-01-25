export function Timeline() {
  return (
    <div style={{
      background: '#1e293b',
      padding: '24px',
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>🚀 Parallel (6 min)</h3>
        <div style={{ position: 'relative', height: '120px' }}>
          {/* Backend */}
          <div style={{
            position: 'absolute',
            left: '0%',
            width: '30%',
            height: '24px',
            background: '#ef4444',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>backend API</div>

          {/* Frontend */}
          <div style={{
            position: 'absolute',
            top: '30px',
            left: '0%',
            width: '30%',
            height: '24px',
            background: '#3b82f6',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>frontend UI</div>

          {/* Tester */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '0%',
            width: '24%',
            height: '24px',
            background: '#eab308',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>tester Tests</div>

          {/* Reviewer */}
          <div style={{
            position: 'absolute',
            top: '90px',
            left: '30%',
            width: '16%',
            height: '24px',
            background: '#a855f7',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>reviewer</div>

          {/* Timeline */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <span>0min</span>
            <span>5min</span>
            <span>10min</span>
            <span>15min</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '32px 0 16px 0', color: '#e2e8f0' }}>🐌 Sequential (15 min)</h3>
        <div style={{ position: 'relative', height: '120px' }}>
          {/* Backend */}
          <div style={{
            position: 'absolute',
            left: '0%',
            width: '30%',
            height: '24px',
            background: '#ef4444',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>backend API</div>

          {/* Frontend */}
          <div style={{
            position: 'absolute',
            top: '30px',
            left: '30%',
            width: '30%',
            height: '24px',
            background: '#3b82f6',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>frontend UI</div>

          {/* Tester */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '60%',
            width: '24%',
            height: '24px',
            background: '#eab308',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>tester Tests</div>

          {/* Reviewer */}
          <div style={{
            position: 'absolute',
            top: '90px',
            left: '84%',
            width: '16%',
            height: '24px',
            background: '#a855f7',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: '#1e293b',
            fontWeight: 'bold',
            fontSize: '13px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>reviewer</div>

          {/* Timeline */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <span>0min</span>
            <span>5min</span>
            <span>10min</span>
            <span>15min</span>
          </div>
        </div>
      </div>
    </div>
  );
}
