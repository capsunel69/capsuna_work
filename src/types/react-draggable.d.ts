declare module 'react-draggable' {
  import * as React from 'react';

  export interface DraggableData {
    node: HTMLElement;
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    lastX: number;
    lastY: number;
  }

  export interface DraggableEventHandler {
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>, data: DraggableData): void;
  }

  export interface ControlPosition {
    x: number;
    y: number;
  }

  export interface DraggableProps {
    axis?: 'both' | 'x' | 'y' | 'none';
    handle?: string;
    cancel?: string;
    grid?: [number, number];
    bounds?: { left?: number; right?: number; top?: number; bottom?: number } | string;
    position?: ControlPosition;
    positionOffset?: { x: number | string; y: number | string };
    scale?: number;
    onStart?: DraggableEventHandler;
    onDrag?: DraggableEventHandler;
    onStop?: DraggableEventHandler;
    children?: React.ReactNode;
    defaultClassName?: string;
    defaultClassNameDragging?: string;
    defaultClassNameDragged?: string;
    defaultPosition?: ControlPosition;
    disabled?: boolean;
    nodeRef?: React.RefObject<HTMLElement | null>;
  }

  declare class Draggable extends React.Component<DraggableProps> {}
  export default Draggable;
} 