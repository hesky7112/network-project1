'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { cn } from '@/lib/utils';

interface SSHTerminalProps {
    deviceId: number;
    deviceName?: string;
}

export default function SSHTerminal({ deviceId, deviceName = 'Device' }: SSHTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff',
                cursor: '#8A2BE2',
                cursorAccent: '#000000',
                selectionBackground: '#8A2BE244',
                cyan: '#8A2BE2',
                green: '#2D5A27',
                yellow: '#fbbf24',
                red: '#FF4D00',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        // Welcome message with Cosmic Nature colors
        term.writeln('\x1b[1;35m┌────────────────────────────────────────────────────────────┐\x1b[0m');
        term.writeln('\x1b[1;35m│\x1b[0m        🛸 Sovereign Core SSH - ' + deviceName.padEnd(28) + '\x1b[1;35m│\x1b[0m');
        term.writeln('\x1b[1;35m└────────────────────────────────────────────────────────────┘\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[33mType commands to execute on the remote device.\x1b[0m');
        term.writeln('\x1b[90mExample: /ip address print, /system resource print\x1b[0m');
        term.writeln('');
        term.write('\x1b[1;35m' + deviceName + '>\x1b[0m ');

        let buffer = '';

        term.onData((data) => {
            if (data === '\r') { // Enter
                term.writeln('');
                if (buffer.trim()) {
                    executeCommand(buffer.trim(), term);
                }
                buffer = '';
                term.write('\x1b[1;35m' + deviceName + '>\x1b[0m ');
            } else if (data === '\x7f') { // Backspace
                if (buffer.length > 0) {
                    buffer = buffer.slice(0, -1);
                    term.write('\b \b');
                }
            } else {
                buffer += data;
                term.write(data);
            }
        });

        setIsConnected(true);

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, [deviceId, deviceName]);

    const executeCommand = async (cmd: string, term: Terminal) => {
        try {
            term.writeln('\x1b[90mExecuting...\x1b[0m');

            const response = await fetch(`/api/v1/devices/${deviceId}/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd }),
            });

            const data = await response.json();

            if (response.ok) {
                term.writeln('\x1b[32m' + (data.output || 'Command executed successfully.') + '\x1b[0m');
            } else {
                term.writeln('\x1b[31mError: ' + (data.error || 'Unknown error') + '\x1b[0m');
                if (data.output) {
                    term.writeln('\x1b[90m' + data.output + '\x1b[0m');
                }
            }
        } catch (err) {
            term.writeln('\x1b[31mNetwork error: Could not reach server.\x1b[0m');
        }
        term.writeln('');
    };

    return (
        <div className="bg-oled-black border border-white/5 overflow-hidden" style={{ borderRadius: '2px' }}>
            <div className="flex items-center justify-between px-4 py-2 bg-oled-black border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-white/5" style={{ borderRadius: '1.5px' }} />
                        <div className="w-2.5 h-2.5 bg-white/5" style={{ borderRadius: '1.5px' }} />
                        <div className="w-2.5 h-2.5 bg-white/5" style={{ borderRadius: '1.5px' }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Terminal_Stream: {deviceName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? 'bg-earth-green animate-pulse shadow-[0_0_8px_rgba(45,90,39,0.5)]' : 'bg-cosmic-red')} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                        {isConnected ? 'Relay_Active' : 'Connection_Lost'}
                    </span>
                </div>
            </div>
            <div ref={terminalRef} className="h-[400px] p-2" />
        </div>
    );
}
