import { create } from "zustand";
import { WorkflowSimulator } from "@embedflow/workflow-engine";
import type {
  SimulationStatus,
  LedState,
  ServoState,
  BuzzerState,
  LcdState,
  SerialLine,
  SimulationEvent,
} from "@embedflow/workflow-engine";
import { getActivity } from "@embedflow/activity-registry";
import { useWorkflowStore } from "./workflow-store";

interface SimulationStoreState {
  showSimulator: boolean;
  simulationStatus: SimulationStatus;
  currentNodeId: string | null;
  errorNodeId: string | null;
  errorMessage: string | null;
  speedMultiplier: number;
  sensorInputs: Record<string, unknown>;
  leds: Record<number, LedState>;
  servos: Record<number, ServoState>;
  buzzers: Record<number, BuzzerState>;
  lcd: LcdState;
  serialOutput: SerialLine[];
  variables: Record<string, unknown>;
  loopCount: number;
  simulatedTimeMs: number;

  // Actions
  toggleSimulator: () => void;
  setSensorInput: (nodeId: string, value: unknown) => void;
  setSpeed: (multiplier: number) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  clearSerial: () => void;
}

let simulator: WorkflowSimulator | null = null;

export const useSimulationStore = create<SimulationStoreState>((set, get) => ({
  showSimulator: false,
  simulationStatus: "idle",
  currentNodeId: null,
  errorNodeId: null,
  errorMessage: null,
  speedMultiplier: 1,
  sensorInputs: {},
  leds: {},
  servos: {},
  buzzers: {},
  lcd: { lines: ["", ""], backlight: true },
  serialOutput: [],
  variables: {},
  loopCount: 0,
  simulatedTimeMs: 0,

  toggleSimulator: () => {
    const current = get().showSimulator;
    set({ showSimulator: !current });
    // Mutual exclusion with code panel
    if (!current) {
      useWorkflowStore.setState({ showCodePanel: false });
    }
  },

  setSensorInput: (nodeId, value) => {
    set((s) => ({
      sensorInputs: { ...s.sensorInputs, [nodeId]: value },
    }));
  },

  setSpeed: (multiplier) => {
    set({ speedMultiplier: multiplier });
    simulator?.setSpeed(multiplier);
  },

  startSimulation: () => {
    const workflow = useWorkflowStore.getState().workflow;
    const store = get();

    simulator = new WorkflowSimulator(
      workflow,
      () => ({
        sensorValues: new Map(Object.entries(get().sensorInputs)),
      }),
      (id: string) => {
        const act = getActivity(id);
        if (!act) return undefined;
        return { id: act.id, simulate: act.simulate, outputs: act.outputs };
      },
    );

    simulator.setSpeed(store.speedMultiplier);
    simulator.addEventListener((event: SimulationEvent) => {
      handleSimulationEvent(event);
    });

    simulator.start();
  },

  pauseSimulation: () => {
    simulator?.pause();
  },

  resumeSimulation: () => {
    simulator?.resume();
  },

  stepSimulation: () => {
    if (!simulator) {
      // Create simulator for first step
      const workflow = useWorkflowStore.getState().workflow;
      simulator = new WorkflowSimulator(
        workflow,
        () => ({
          sensorValues: new Map(Object.entries(get().sensorInputs)),
        }),
        (id: string) => {
          const act = getActivity(id);
          if (!act) return undefined;
          return { id: act.id, simulate: act.simulate, outputs: act.outputs };
        },
      );
      simulator.addEventListener((event: SimulationEvent) => {
        handleSimulationEvent(event);
      });
    }
    simulator.step();
  },

  resetSimulation: () => {
    simulator?.reset();
    simulator = null;
    set({
      simulationStatus: "idle",
      currentNodeId: null,
      errorNodeId: null,
      errorMessage: null,
      leds: {},
      servos: {},
      buzzers: {},
      lcd: { lines: ["", ""], backlight: true },
      serialOutput: [],
      variables: {},
      loopCount: 0,
      simulatedTimeMs: 0,
    });
  },

  clearSerial: () => {
    set({ serialOutput: [] });
  },
}));

function handleSimulationEvent(event: SimulationEvent): void {
  const store = useSimulationStore;

  switch (event.type) {
    case "status-change":
      store.setState({ simulationStatus: event.data as SimulationStatus });
      break;

    case "node-enter":
      store.setState({ currentNodeId: event.nodeId ?? null });
      break;

    case "node-exit":
      break;

    case "led-change": {
      const led = event.data as LedState;
      store.setState((s) => ({
        leds: { ...s.leds, [led.pin]: led },
      }));
      break;
    }

    case "servo-move": {
      const servo = event.data as ServoState;
      store.setState((s) => ({
        servos: { ...s.servos, [servo.pin]: servo },
      }));
      break;
    }

    case "buzzer": {
      const buzzer = event.data as BuzzerState;
      store.setState((s) => ({
        buzzers: { ...s.buzzers, [buzzer.pin]: buzzer },
      }));
      break;
    }

    case "lcd-update": {
      const lcd = event.data as LcdState;
      store.setState({ lcd });
      break;
    }

    case "serial": {
      const line = event.data as SerialLine;
      store.setState((s) => ({
        serialOutput: [...s.serialOutput.slice(-199), line],
      }));
      break;
    }

    case "variable-change": {
      const { name, value } = event.data as { name: string; value: unknown };
      store.setState((s) => ({
        variables: { ...s.variables, [name]: value },
      }));
      break;
    }

    case "error":
      store.setState({
        errorNodeId: event.nodeId ?? null,
        errorMessage: (event.data as string) ?? null,
      });
      break;

    case "loop-start":
      store.setState({
        loopCount: event.data as number,
        simulatedTimeMs: simulator?.getState().simulatedTimeMs ?? 0,
      });
      break;
  }
}
