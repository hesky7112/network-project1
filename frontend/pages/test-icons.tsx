import React from 'react';
import * as Icons from '@/components/icons';

export default function TestIcons() {
    return (
        <div style={{ padding: '40px', background: '#000', color: '#fff' }}>
            <h1>Icon Verification Protocol</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {Object.entries(Icons).map(([name, Icon]: [string, any]) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #333', padding: '10px' }}>
                        {typeof Icon === 'function' ? <Icon size={20} /> : <span style={{ color: 'red' }}>UNDEFINED</span>}
                        <span>{name}</span>
                    </div>
                ))}
            </div>
        </div >
    );
}
