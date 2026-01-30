import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Clock,
    MoreHorizontal
} from 'lucide-react';

export interface Ticket {
    id: number;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'assigned' | 'in_progress' | 'resolved';
    assignee?: string;
    updated_at: string;
}

interface Column {
    id: string;
    title: string;
    ticketIds: number[];
}

interface BoardData {
    tickets: { [key: number]: Ticket };
    columns: { [key: string]: Column };
    columnOrder: string[];
}

export const TicketKanban = ({ initialTickets }: { initialTickets: Ticket[] }) => {
    const [board, setBoard] = useState<BoardData>({
        tickets: {},
        columns: {},
        columnOrder: []
    });

    useEffect(() => {
        const ticketsMap = initialTickets.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
        const openIds = initialTickets.filter(t => t.status === 'open').map(t => t.id);
        const assignedIds = initialTickets.filter(t => t.status === 'assigned').map(t => t.id);
        const inProgressIds = initialTickets.filter(t => t.status === 'in_progress').map(t => t.id);
        const resolvedIds = initialTickets.filter(t => t.status === 'resolved').map(t => t.id);

        setBoard({
            tickets: ticketsMap,
            columns: {
                'open': { id: 'open', title: 'Open', ticketIds: openIds },
                'assigned': { id: 'assigned', title: 'Assigned', ticketIds: assignedIds },
                'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: inProgressIds },
                'resolved': { id: 'resolved', title: 'Resolved', ticketIds: resolvedIds },
            },
            columnOrder: ['open', 'assigned', 'in_progress', 'resolved']
        });
    }, [initialTickets]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const start = board.columns[source.droppableId];
        const finish = board.columns[destination.droppableId];

        if (!start || !finish) return;

        const ticketId = parseInt(draggableId);
        if (isNaN(ticketId)) return;

        if (start.id === finish.id) {
            const newTicketIds = Array.from(start.ticketIds);
            newTicketIds.splice(source.index, 1);
            newTicketIds.splice(destination.index, 0, ticketId);

            const newColumn = { ...start, ticketIds: newTicketIds };
            setBoard(prev => ({
                ...prev,
                columns: { ...prev.columns, [newColumn.id]: newColumn }
            }));
            return;
        }

        const startTicketIds = Array.from(start.ticketIds);
        startTicketIds.splice(source.index, 1);
        const newStart = { ...start, ticketIds: startTicketIds };

        const finishTicketIds = Array.from(finish.ticketIds);
        finishTicketIds.splice(destination.index, 0, ticketId);
        const newFinish = { ...finish, ticketIds: finishTicketIds };

        setBoard(prev => ({
            ...prev,
            columns: {
                ...prev.columns,
                [newStart.id]: newStart,
                [newFinish.id]: newFinish
            }
        }));
    };

    const getPriorityBadge = (priority: string) => {
        const colors: any = {
            critical: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-blue-100 text-blue-700 border-blue-200'
        }
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border border-opacity-50 font-medium uppercase tracking-wide ${colors[priority] || colors.medium}`}>
                {priority}
            </span>
        )
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {board.columnOrder.map(columnId => {
                    const column = board.columns[columnId];
                    if (!column) return null;
                    const columnTickets = column.ticketIds
                        .map(id => board.tickets[id])
                        .filter(t => !!t);

                    return (
                        <div key={column.id} className="flex flex-col w-80 bg-gray-50/50 rounded-xl border border-gray-200/60 min-w-[320px]">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm rounded-t-xl z-10">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${column.id === 'open' ? 'bg-blue-500' :
                                        column.id === 'assigned' ? 'bg-purple-500' :
                                            column.id === 'in_progress' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`} />
                                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{column.title}</h3>
                                </div>
                                <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                                    {columnTickets.length}
                                </span>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`p-3 flex-1 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50/30' : ''}`}
                                        style={{ minHeight: '150px' }}
                                    >
                                        {columnTickets.map((ticket, index) => (
                                            <Draggable key={ticket.id} draggableId={ticket.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-white p-4 mb-3 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 group relative ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 border-blue-400 z-50' : 'hover:border-blue-300 hover:shadow-md'
                                                            }`}
                                                        style={provided.draggableProps.style}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                                                            <button className="text-gray-300 hover:text-gray-600">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <h4 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 leading-snug">{ticket.title}</h4>

                                                        <div className="flex items-center gap-2 mb-3">
                                                            {getPriorityBadge(ticket.priority)}
                                                        </div>

                                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                                                            <div className="flex -space-x-2">
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                    {ticket.assignee ? ticket.assignee.charAt(0) : '?'}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-400 gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                <span>2d</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
};
