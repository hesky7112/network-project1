"use client"

import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WebTerminalProps {
    title?: string
    height?: number | string
}

export function WebTerminal({ title = 'Syslog Stream', height = 400 }: WebTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<Terminal | null>(null)

    useEffect(() => {
        if (!terminalRef.current) return

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#00ff00',
                cursor: '#00ff00',
            },
            fontFamily: 'Consolas, monospace',
            fontSize: 14,
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)

        // Delay opening to ensure container is rendered and has size
        const timer = setTimeout(() => {
            if (terminalRef.current) {
                try {
                    term.open(terminalRef.current)
                    fitAddon.fit()
                    xtermRef.current = term

                    term.writeln('\x1b[1;32mWelcome to Network Operations Terminal v2.0\x1b[0m')
                    term.writeln('Connecting to syslog stream...')
                    term.writeln('')
                } catch (e) {
                    console.error("Terminal initialization error:", e)
                }
            }
        }, 100)

        const interval = setInterval(() => {
            const logs = [
                '\x1b[33m[WARN]\x1b[0m Interface GigabitEthernet0/1 input errors detected',
                '\x1b[31m[CRIT]\x1b[0m OSPF neighbor 192.168.1.5 down',
                '\x1b[32m[INFO]\x1b[0m Configuration saved by user admin',
                '\x1b[34m[DEBUG]\x1b[0m SNMP polling successful for device SW-CORE-01',
            ]
            const randomLog = logs[Math.floor(Math.random() * logs.length)]
            const timestamp = new Date().toISOString()
            term.writeln(`[${timestamp}] ${randomLog}`)
        }, 2000)

        const handleResize = () => {
            try {
                fitAddon.fit()
            } catch (e) { }
        }
        window.addEventListener('resize', handleResize)

        return () => {
            clearTimeout(timer)
            clearInterval(interval)
            term.dispose()
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <Card className="w-full h-full bg-[#1e1e1e] border-gray-800">
            <CardHeader className="border-b border-gray-800 py-3">
                <CardTitle className="text-gray-300 text-sm font-mono flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2">{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div ref={terminalRef} style={{ height, width: '100%' }} />
            </CardContent>
        </Card>
    )
}
