declare module 'react-simple-maps' {
    import * as React from 'react';

    export interface ComposableMapProps {
        width?: number;
        height?: number;
        projection?: string | ((width: number, height: number, config: any) => any);
        projectionConfig?: any;
        className?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }

    export const ComposableMap: React.FC<ComposableMapProps>;

    export interface GeographiesProps {
        geography?: string | Record<string, any> | string[];
        children?: (args: { geographies: any[]; projection: any; path: any }) => React.ReactNode;
        parseGeographies?: (geographies: any[]) => any[];
        className?: string;
    }

    export const Geographies: React.FC<GeographiesProps>;

    export interface GeographyProps {
        geography: any;
        fill?: string;
        stroke?: string;
        strokeWidth?: number | string;
        className?: string;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onMouseEnter?: (event: React.MouseEvent, geo: any) => void;
        onMouseLeave?: (event: React.MouseEvent, geo: any) => void;
        onMouseDown?: (event: React.MouseEvent, geo: any) => void;
        onMouseUp?: (event: React.MouseEvent, geo: any) => void;
        onFocus?: (event: React.FocusEvent, geo: any) => void;
        onBlur?: (event: React.FocusEvent, geo: any) => void;
        onClick?: (event: React.MouseEvent, geo: any) => void;
    }

    export const Geography: React.FC<GeographyProps>;

    export interface MarkerProps {
        coordinates: [number, number];
        children?: React.ReactNode;
        className?: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number | string;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onMouseEnter?: (event: React.MouseEvent) => void;
        onMouseLeave?: (event: React.MouseEvent) => void;
        onMouseDown?: (event: React.MouseEvent) => void;
        onMouseUp?: (event: React.MouseEvent) => void;
        onFocus?: (event: React.FocusEvent) => void;
        onBlur?: (event: React.FocusEvent) => void;
        onClick?: (event: React.MouseEvent) => void;
    }

    export const Marker: React.FC<MarkerProps>;

    export interface ZoomableGroupProps {
        center?: [number, number];
        zoom?: number;
        minZoom?: number;
        maxZoom?: number;
        translateExtent?: [[number, number], [number, number]];
        onMoveStart?: (position: { x: number; y: number; k: number }, event: any) => void;
        onMove?: (position: { x: number; y: number; k: number }, event: any) => void;
        onMoveEnd?: (position: { x: number; y: number; k: number }, event: any) => void;
        className?: string;
        filterZoomEvent?: (event: any) => boolean;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }

    export const ZoomableGroup: React.FC<ZoomableGroupProps>;
}
