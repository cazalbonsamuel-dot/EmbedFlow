// --- Simulation Types ---

export type SimulationStatus = "idle" | "running" | "paused" | "stepping" | "error" | "finished";

export interface PinState {
  pin: number;
  mode: "input" | "output";
  value: number;
  type: "digital" | "analog";
}

export interface SerialLine {
  timestamp: number;
  text: string;
}

export interface LedState {
  pin: number;
  on: boolean;
  intensity: number;
  color?: string;
}

export interface ServoState {
  pin: number;
  angle: number;
}

export interface BuzzerState {
  pin: number;
  frequency: number;
  active: boolean;
}

export interface LcdState {
  lines: [string, string];
  backlight: boolean;
}

export interface SimulationState {
  status: SimulationStatus;
  currentNodeId: string | null;
  errorNodeId: string | null;
  errorMessage: string | null;
  variables: Map<string, unknown>;
  leds: Map<number, LedState>;
  servos: Map<number, ServoState>;
  buzzers: Map<number, BuzzerState>;
  lcd: LcdState;
  serialOutput: SerialLine[];
  pins: Map<number, PinState>;
  simulatedTimeMs: number;
  loopCount: number;
  speedMultiplier: number;
}

export interface SimulationInputs {
  sensorValues: Map<string, unknown>;
}

export type SimulationEventType =
  | "node-enter"
  | "node-exit"
  | "pin-change"
  | "serial"
  | "lcd-update"
  | "servo-move"
  | "buzzer"
  | "led-change"
  | "variable-change"
  | "error"
  | "loop-start"
  | "status-change";

export interface SimulationEvent {
  type: SimulationEventType;
  nodeId?: string;
  data?: unknown;
}

export type SimulationEventListener = (event: SimulationEvent) => void;
