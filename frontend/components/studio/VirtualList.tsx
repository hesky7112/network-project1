
import React from 'react';
import * as ReactWindow from 'react-window';
import { AutoSizer as _AutoSizer } from 'react-virtualized-auto-sizer';
import { cn } from '@/lib/utils';

const List = (ReactWindow as any).FixedSizeList;
const AutoSizer = _AutoSizer as any;

interface VirtualListProps<T> {
    items: T[];
    height?: number | string;
    itemSize: number;
    renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    className?: string;
}

export function VirtualList<T>({
    items,
    itemSize,
    renderItem,
    className
}: VirtualListProps<T>) {
    return (
        <div className={cn("w-full h-full min-h-[400px]", className)}>
            <AutoSizer>
                {({ height, width }: any) => (
                    <List
                        height={height}
                        itemCount={items.length}
                        itemSize={itemSize}
                        width={width}
                        className="no-scrollbar"
                    >
                        {({ index, style }: { index: number; style: React.CSSProperties }) => {
                            const item = items[index];
                            if (!item) return null;
                            return (
                                <div style={style}>
                                    {renderItem(item, index, style)}
                                </div>
                            );
                        }}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}
