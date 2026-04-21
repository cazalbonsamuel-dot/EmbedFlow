import type { Workflow, WorkflowNode, WorkflowEdge } from "./index.js";
import type {
  SimulationStatus,
  SimulationState,
  SimulationInputs,
  SimulationEvent,
  SimulationEventListener,
  LedState,
  ServoState,
  BuzzerState,
  LcdState,
  SerialLine,
} from "./simulator-types.js";

// --- Helpers ---

function interpolateVars(text: string, variables: Map<string, unknown>): string {
  return text.replace(/\{(\w+)\}/g, (_, name) => String(variables.get(name) ?? ""));
}

function resolveOperand(value: string, variables: Map<string, unknown>): number {
  const fromVar = variables.get(value);
  if (fromVar !== undefined) return Number(fromVar);
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function evalCondition(
  leftVal: unknown,
  operator: string,
  rightVal: unknown,
): boolean {
  const a = Number(leftVal);
  const b = Number(rightVal);
  switch (operator) {
    case ">": return a > b;
    case "<": return a < b;
    case "==": return a === b;
    case "!=": return a !== b;
    case ">=": return a >= b;
    case "<=": return a <= b;
    default: return false;
  }
}

// --- WorkflowSimulator ---

export class WorkflowSimulator {
  private workflow: Workflow;
  private getInputs: () => SimulationInputs;
  private listeners: SimulationEventListener[] = [];
  private state: SimulationState;
  private running = false;
  private aborted = false;

  // Graph structure: sourceNodeId -> Map<sourcePortId, targetNodeId[]>
  private execGraph = new Map<string, Map<string, string[]>>();
  private nodeMap = new Map<string, WorkflowNode>();

  // For loop/repeat tracking
  private iterationStack: { nodeId: string; current: number; max: number }[] = [];

  // For interval tracking
  private intervalLastRun = new Map<string, number>();

  // Activity registry access (injected to keep engine framework-agnostic)
  private getActivity: (id: string) => {
    id: string;
    simulate: { defaultValue: unknown };
    outputs: { id: string; type: string }[];
  } | undefined;

  // Sub-workflow support
  private getSubWorkflow: ((id: string) => Workflow | undefined) | undefined;
  private callDepth: number;
  private static readonly MAX_CALL_DEPTH = 10;

  constructor(
    workflow: Workflow,
    getInputs: () => SimulationInputs,
    getActivity: (id: string) => { id: string; simulate: { defaultValue: unknown }; outputs: { id: string; type: string }[] } | undefined,
    getSubWorkflow?: (id: string) => Workflow | undefined,
    callDepth = 0,
  ) {
    this.workflow = workflow;
    this.getInputs = getInputs;
    this.getActivity = getActivity;
    this.getSubWorkflow = getSubWorkflow;
    this.callDepth = callDepth;

    this.state = this.createInitialState();
    this.buildGraph();
  }

  // --- Public API ---

  start(): void {
    this.state = this.createInitialState();
    this.state.status = "running";
    this.iterationStack = [];
    this.intervalLastRun.clear();
    this.aborted = false;
    this.emit({ type: "status-change", data: "running" });
    this.runLoop();
  }

  pause(): void {
    this.state.status = "paused";
    this.running = false;
    this.emit({ type: "status-change", data: "paused" });
  }

  resume(): void {
    if (this.state.status !== "paused") return;
    this.state.status = "running";
    this.emit({ type: "status-change", data: "running" });
    this.runLoop();
  }

  step(): void {
    if (this.state.status === "idle") {
      this.state = this.createInitialState();
      this.state.status = "stepping";
      this.iterationStack = [];
      this.intervalLastRun.clear();
      this.aborted = false;
      this.emit({ type: "status-change", data: "stepping" });
      // Find root and execute first node
      const roots = this.findRoots();
      if (roots.length > 0) {
        this.stepOneNode(roots[0]);
      }
      return;
    }

    if (this.state.status === "paused" || this.state.status === "stepping") {
      this.state.status = "stepping";
      // Continue from current position — handled by stepQueue
      if (this.stepQueue.length > 0) {
        const nextId = this.stepQueue.shift()!;
        this.stepOneNode(nextId);
      } else {
        // Start a new loop iteration
        this.state.loopCount++;
        this.emit({ type: "loop-start", data: this.state.loopCount });
        const roots = this.findRoots();
        if (roots.length > 0) {
          this.stepOneNode(roots[0]);
        }
      }
    }
  }

  reset(): void {
    this.aborted = true;
    this.running = false;
    this.state = this.createInitialState();
    this.stepQueue = [];
    this.iterationStack = [];
    this.intervalLastRun.clear();
    this.emit({ type: "status-change", data: "idle" });
  }

  setSpeed(multiplier: number): void {
    this.state.speedMultiplier = multiplier;
  }

  addEventListener(listener: SimulationEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: SimulationEventListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  getState(): Readonly<SimulationState> {
    return this.state;
  }

  // --- Internal ---

  private stepQueue: string[] = [];

  private createInitialState(): SimulationState {
    return {
      status: "idle" as SimulationStatus,
      currentNodeId: null,
      errorNodeId: null,
      errorMessage: null,
      variables: new Map(),
      leds: new Map(),
      servos: new Map(),
      buzzers: new Map(),
      lcd: { lines: ["", ""], backlight: true },
      serialOutput: [],
      pins: new Map(),
      simulatedTimeMs: 0,
      loopCount: 0,
      speedMultiplier: 1,
    };
  }

  private buildGraph(): void {
    this.nodeMap.clear();
    this.execGraph.clear();

    for (const node of this.workflow.nodes) {
      this.nodeMap.set(node.id, node);
      this.execGraph.set(node.id, new Map());
    }

    for (const edge of this.workflow.edges) {
      const portMap = this.execGraph.get(edge.sourceNodeId);
      if (!portMap) continue;
      const existing = portMap.get(edge.sourcePortId) || [];
      existing.push(edge.targetNodeId);
      portMap.set(edge.sourcePortId, existing);
    }
  }

  private findRoots(): string[] {
    const hasExecInput = new Set<string>();
    for (const edge of this.workflow.edges) {
      // Only count execution-type edges
      if (edge.sourcePortId.startsWith("exec_") || edge.targetPortId.startsWith("exec_")) {
        hasExecInput.add(edge.targetNodeId);
      }
    }
    return this.workflow.nodes
      .filter((n) => !hasExecInput.has(n.id))
      .map((n) => n.id);
  }

  private emit(event: SimulationEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private async runLoop(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.state.status === "running" && !this.aborted) {
      this.state.loopCount++;
      this.emit({ type: "loop-start", data: this.state.loopCount });

      const roots = this.findRoots();
      for (const rootId of roots) {
        if (this.state.status !== "running" || this.aborted) break;
        await this.executeChain(rootId);
      }

      if (this.state.status !== "running" || this.aborted) break;

      // Small delay between loops to prevent blocking UI
      const loopDelay = Math.max(10, 100 / this.state.speedMultiplier);
      await this.delay(loopDelay);
    }

    this.running = false;

    if (!this.aborted && this.state.status === "running") {
      this.state.status = "finished";
      this.emit({ type: "status-change", data: "finished" });
    }
  }

  private async executeChain(nodeId: string): Promise<void> {
    if (this.state.status !== "running" || this.aborted) return;

    const node = this.nodeMap.get(nodeId);
    if (!node) return;

    // Enter node
    this.state.currentNodeId = nodeId;
    this.emit({ type: "node-enter", nodeId });

    try {
      const nextPort = await this.simulateNode(node);
      this.emit({ type: "node-exit", nodeId });

      // Follow execution edges from the returned port
      if (nextPort) {
        const portMap = this.execGraph.get(nodeId);
        const targets = portMap?.get(nextPort) || [];
        for (const targetId of targets) {
          if (this.state.status !== "running" || this.aborted) break;
          await this.executeChain(targetId);
        }
      }
    } catch (err) {
      this.state.status = "error";
      this.state.errorNodeId = nodeId;
      this.state.errorMessage = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", nodeId, data: this.state.errorMessage });
      this.emit({ type: "status-change", data: "error" });
    }
  }

  private stepOneNode(nodeId: string): void {
    const node = this.nodeMap.get(nodeId);
    if (!node) return;

    this.state.currentNodeId = nodeId;
    this.emit({ type: "node-enter", nodeId });

    try {
      // Simulate synchronously for step mode (no delays)
      const nextPort = this.simulateNodeSync(node);
      this.emit({ type: "node-exit", nodeId });

      // Queue next nodes
      if (nextPort) {
        const portMap = this.execGraph.get(nodeId);
        const targets = portMap?.get(nextPort) || [];
        this.stepQueue.push(...targets);
      }
    } catch (err) {
      this.state.status = "error";
      this.state.errorNodeId = nodeId;
      this.state.errorMessage = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", nodeId, data: this.state.errorMessage });
      this.emit({ type: "status-change", data: "error" });
    }
  }

  // --- Node Simulation ---

  private async simulateNode(node: WorkflowNode): Promise<string | null> {
    const props = node.properties;
    const activityId = node.activityId;

    // Handle timing.wait with real delay
    if (activityId === "timing.wait") {
      const duree = (props.duree as number) || 1000;
      const unite = (props.unite as string) || "ms";
      const ms = unite === "s" ? duree * 1000 : duree;
      this.state.simulatedTimeMs += ms;
      await this.delay(ms / this.state.speedMultiplier);
      return "exec_out";
    }

    // Handle repeat with async body execution
    if (activityId === "logic.repeat") {
      const nombre = (props.nombre as number) || 10;
      const portMap = this.execGraph.get(node.id);
      const bodyTargets = portMap?.get("exec_body") || [];

      for (let i = 0; i < nombre && !this.aborted && this.state.status === "running"; i++) {
        this.state.variables.set("compteur", i);
        this.emit({ type: "variable-change", nodeId: node.id, data: { name: "compteur", value: i } });
        for (const bodyId of bodyTargets) {
          await this.executeChain(bodyId);
        }
      }
      this.state.currentNodeId = node.id;
      return "exec_out";
    }

    // Handle while_loop with async body execution
    if (activityId === "logic.while_loop") {
      const variable = props.variable as string;
      const operateur = (props.operateur as string) || "<";
      const valeur = props.valeur as number ?? 0;
      const maxIter = (props.max_iterations as number) || 1000;
      const portMap = this.execGraph.get(node.id);
      const bodyTargets = portMap?.get("exec_body") || [];

      let iterations = 0;
      while (!this.aborted && this.state.status === "running" && iterations < maxIter) {
        const leftVal = this.state.variables.get(variable) ?? 0;
        if (!evalCondition(leftVal, operateur, valeur)) break;
        iterations++;
        for (const bodyId of bodyTargets) {
          await this.executeChain(bodyId);
        }
      }

      if (iterations >= maxIter) {
        throw new Error(`Boucle infinie detectee dans "${activityId}" (${maxIter} iterations max)`);
      }

      this.state.currentNodeId = node.id;
      return "exec_out";
    }

    // All other nodes use the sync dispatch
    return this.simulateNodeSync(node);
  }

  private simulateNodeSync(node: WorkflowNode): string | null {
    const props = node.properties;
    const activityId = node.activityId;
    const inputs = this.getInputs();

    // --- GPIO ---
    if (activityId === "gpio.turn_on") {
      const pin = props.pin as number;
      if (pin !== undefined) {
        this.state.leds.set(pin, { pin, on: true, intensity: 255 });
        this.emit({ type: "led-change", nodeId: node.id, data: { pin, on: true, intensity: 255 } });
      }
      return "exec_out";
    }

    if (activityId === "gpio.turn_off") {
      const pin = props.pin as number;
      if (pin !== undefined) {
        this.state.leds.set(pin, { pin, on: false, intensity: 0 });
        this.emit({ type: "led-change", nodeId: node.id, data: { pin, on: false, intensity: 0 } });
      }
      return "exec_out";
    }

    if (activityId === "gpio.vary_intensity") {
      const pin = props.pin as number;
      const intensite = (props.intensite as number) ?? 50;
      const mapped = Math.round((intensite / 100) * 255);
      if (pin !== undefined) {
        this.state.leds.set(pin, { pin, on: intensite > 0, intensity: mapped });
        this.emit({ type: "led-change", nodeId: node.id, data: { pin, on: intensite > 0, intensity: mapped } });
      }
      return "exec_out";
    }

    // --- Sensors ---
    if (activityId.startsWith("sensors.")) {
      const activity = this.getActivity(activityId);
      const sensorValue = inputs.sensorValues.get(node.id) ?? activity?.simulate.defaultValue ?? 0;

      // Store output in variables based on output port names
      if (activity) {
        for (const output of activity.outputs) {
          if (output.type !== "execution") {
            this.state.variables.set(output.id, sensorValue);
            this.emit({ type: "variable-change", nodeId: node.id, data: { name: output.id, value: sensorValue } });
          }
        }
      }
      return "exec_out";
    }

    // --- Actuators ---
    if (activityId === "actuators.servo") {
      const pin = props.pin as number;
      const angle = (props.angle as number) ?? 90;
      if (pin !== undefined) {
        this.state.servos.set(pin, { pin, angle });
        this.emit({ type: "servo-move", nodeId: node.id, data: { pin, angle } });
      }
      return "exec_out";
    }

    if (activityId === "actuators.motor") {
      const pin = props.pin_vitesse as number;
      const vitesse = (props.vitesse as number) ?? 50;
      if (pin !== undefined) {
        this.state.leds.set(pin, { pin, on: vitesse > 0, intensity: Math.round((vitesse / 100) * 255) });
        this.emit({ type: "led-change", nodeId: node.id, data: { pin, on: vitesse > 0 } });
      }
      return "exec_out";
    }

    if (activityId === "actuators.relay") {
      const pin = props.pin as number;
      const etat = (props.etat as string) === "on";
      if (pin !== undefined) {
        this.state.leds.set(pin, { pin, on: etat, intensity: etat ? 255 : 0 });
        this.emit({ type: "led-change", nodeId: node.id, data: { pin, on: etat } });
      }
      return "exec_out";
    }

    if (activityId === "actuators.buzzer") {
      const pin = props.pin as number;
      const freq = (props.frequence as number) ?? 440;
      if (pin !== undefined) {
        this.state.buzzers.set(pin, { pin, frequency: freq, active: true });
        this.emit({ type: "buzzer", nodeId: node.id, data: { pin, frequency: freq, active: true } });
      }
      return "exec_out";
    }

    // --- Display ---
    if (activityId === "display.lcd" || activityId === "display.oled") {
      const texte = interpolateVars((props.texte as string) || "", this.state.variables);
      const ligne = activityId === "display.lcd" ? Number(props.ligne ?? 0) : (props.position === "bas" ? 1 : 0);
      const effacer = (props.effacer as boolean) ?? true;
      if (effacer) {
        this.state.lcd.lines[ligne] = texte;
      } else {
        this.state.lcd.lines[ligne] += texte;
      }
      this.state.lcd.lines[ligne] = this.state.lcd.lines[ligne].slice(0, 16);
      this.emit({ type: "lcd-update", nodeId: node.id, data: { ...this.state.lcd } });
      return "exec_out";
    }

    if (activityId === "display.neopixel") {
      const pin = props.pin as number;
      const r = (props.rouge as number) ?? 255;
      const g = (props.vert as number) ?? 0;
      const b = (props.bleu as number) ?? 0;
      const color = `rgb(${r},${g},${b})`;
      if (pin !== undefined) {
        this.state.leds.set(pin, { pin, on: true, intensity: 255, color });
        this.emit({ type: "led-change", nodeId: node.id, data: { pin, on: true, color } });
      }
      return "exec_out";
    }

    // --- Communication ---
    if (activityId === "communication.serial_send") {
      const texte = interpolateVars((props.donnee as string) || "", this.state.variables);
      const line: SerialLine = { timestamp: this.state.simulatedTimeMs, text: texte };
      this.state.serialOutput.push(line);
      if (this.state.serialOutput.length > 200) {
        this.state.serialOutput = this.state.serialOutput.slice(-200);
      }
      this.emit({ type: "serial", nodeId: node.id, data: line });
      return "exec_out";
    }

    if (activityId === "communication.wifi_connect") {
      this.state.variables.set("connecte", true);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: "connecte", value: true } });
      return "exec_out";
    }

    if (activityId === "communication.http_send") {
      this.state.variables.set("code_retour", 200);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: "code_retour", value: 200 } });
      return "exec_out";
    }

    // --- Logic ---
    if (activityId === "logic.if_then") {
      const variable = props.variable as string;
      const operateur = (props.operateur as string) || ">";
      const valeur = props.valeur as number ?? 0;
      const leftVal = this.state.variables.get(variable) ?? 0;
      const result = evalCondition(leftVal, operateur, valeur);
      return result ? "exec_then" : "exec_else";
    }

    if (activityId === "logic.repeat") {
      // In step mode, queue body targets once (simplified single-step)
      return "exec_body";
    }

    if (activityId === "logic.while_loop") {
      const variable = props.variable as string;
      const operateur = (props.operateur as string) || "<";
      const valeur = props.valeur as number ?? 0;
      const leftVal = this.state.variables.get(variable) ?? 0;
      if (evalCondition(leftVal, operateur, valeur)) {
        return "exec_body";
      }
      return "exec_out";
    }

    if (activityId === "logic.switch_case") {
      const variable = props.variable as string;
      const val = Number(this.state.variables.get(variable) ?? 0);
      const cas1 = Number(props.cas1 ?? 1);
      const cas2 = Number(props.cas2 ?? 2);
      const cas3 = Number(props.cas3 ?? 3);

      if (val === cas1) return "exec_cas1";
      if (val === cas2) return "exec_cas2";
      if (val === cas3) return "exec_cas3";
      return "exec_default";
    }

    // --- Timing ---
    if (activityId === "timing.wait") {
      const duree = (props.duree as number) || 1000;
      const unite = (props.unite as string) || "ms";
      const ms = unite === "s" ? duree * 1000 : duree;
      this.state.simulatedTimeMs += ms;
      return "exec_out";
    }

    if (activityId === "timing.interval") {
      const intervalle = (props.intervalle as number) || 1000;
      const unite = (props.unite as string) || "ms";
      let intervalMs = intervalle;
      if (unite === "sec") intervalMs = intervalle * 1000;
      if (unite === "min") intervalMs = intervalle * 60000;

      const now = Date.now();
      const lastRun = this.intervalLastRun.get(node.id);
      // Fire immediately on first call, then respect the interval adjusted by speed
      if (lastRun === undefined || (now - lastRun) >= intervalMs / this.state.speedMultiplier) {
        this.intervalLastRun.set(node.id, now);
        return "exec_body";
      }
      return null; // Skip this cycle
    }

    // --- Variables ---
    if (activityId === "variables.assign") {
      const nom = (props.nom as string) || "maVariable";
      const valeur = props.valeur;
      this.state.variables.set(nom, valeur);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: nom, value: valeur } });
      return "exec_out";
    }

    if (activityId === "variables.calculate") {
      const a = resolveOperand((props.operande_a as string) || "0", this.state.variables);
      const op = (props.operateur as string) || "+";
      const b = resolveOperand((props.operande_b as string) || "0", this.state.variables);
      let result: number;
      switch (op) {
        case "+": result = a + b; break;
        case "-": result = a - b; break;
        case "*": result = a * b; break;
        case "/":
          if (b === 0) throw new Error("Division par zero dans Calculer");
          result = a / b;
          break;
        case "%": result = a % b; break;
        default: result = 0;
      }
      this.state.variables.set("resultat", result);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: "resultat", value: result } });
      return "exec_out";
    }

    if (activityId === "variables.compare") {
      const a = resolveOperand((props.valeur_a as string) || "0", this.state.variables);
      const op = (props.operateur as string) || ">";
      const b = resolveOperand((props.valeur_b as string) || "0", this.state.variables);
      const result = evalCondition(a, op, b);
      this.state.variables.set("resultat", result);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: "resultat", value: result } });
      return "exec_out";
    }

    if (activityId === "variables.constrain") {
      const variable = props.variable as string;
      const min = (props.minimum as number) ?? 0;
      const max = (props.maximum as number) ?? 100;
      const val = Number(this.state.variables.get(variable) ?? 0);
      const clamped = Math.min(Math.max(val, min), max);
      this.state.variables.set("valeur", clamped);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: "valeur", value: clamped } });
      return "exec_out";
    }

    if (activityId === "variables.map_range") {
      const variable = props.variable as string;
      const deMin = (props.de_min as number) ?? 0;
      const deMax = (props.de_max as number) ?? 1023;
      const versMin = (props.vers_min as number) ?? 0;
      const versMax = (props.vers_max as number) ?? 100;
      const val = Number(this.state.variables.get(variable) ?? 0);
      const mapped = versMin + ((val - deMin) / (deMax - deMin)) * (versMax - versMin);
      this.state.variables.set("valeur", mapped);
      this.emit({ type: "variable-change", nodeId: node.id, data: { name: "valeur", value: mapped } });
      return "exec_out";
    }

    // --- Sub-workflow invocation ---
    if (activityId === "workflow.invoke") {
      const targetId = props.targetWorkflowId as string;
      if (!targetId || !this.getSubWorkflow) return "exec_out";

      if (this.callDepth >= WorkflowSimulator.MAX_CALL_DEPTH) {
        throw new Error(`Profondeur d'appel max atteinte (${WorkflowSimulator.MAX_CALL_DEPTH}). Verifiez qu'il n'y a pas de recursion infinie.`);
      }

      const subWorkflow = this.getSubWorkflow(targetId);
      if (!subWorkflow) {
        throw new Error(`Sous-workflow introuvable : ${targetId}`);
      }

      // Create child simulator with isolated scope
      const childSim = new WorkflowSimulator(
        subWorkflow,
        this.getInputs,
        this.getActivity,
        this.getSubWorkflow,
        this.callDepth + 1,
      );

      // Copy "in" arguments from parent variables to child
      for (const arg of subWorkflow.arguments || []) {
        if (arg.direction === "in" || arg.direction === "in_out") {
          const parentVal = this.state.variables.get(arg.name);
          if (parentVal !== undefined) {
            childSim.state.variables.set(arg.name, parentVal);
          } else if (arg.defaultValue !== undefined) {
            childSim.state.variables.set(arg.name, arg.defaultValue);
          }
        }
      }

      // Execute child synchronously (step through all nodes)
      const roots = childSim.findRoots();
      for (const rootId of roots) {
        childSim.stepOneNode(rootId);
        while (childSim.stepQueue.length > 0) {
          const nextId = childSim.stepQueue.shift()!;
          childSim.stepOneNode(nextId);
        }
      }

      // Copy "out" arguments back to parent
      for (const arg of subWorkflow.arguments || []) {
        if (arg.direction === "out" || arg.direction === "in_out") {
          const childVal = childSim.state.variables.get(arg.name);
          if (childVal !== undefined) {
            this.state.variables.set(arg.name, childVal);
            this.emit({ type: "variable-change", nodeId: node.id, data: { name: arg.name, value: childVal } });
          }
        }
      }

      // Propagate serial output, LED states, etc.
      for (const line of childSim.state.serialOutput) {
        this.state.serialOutput.push(line);
        this.emit({ type: "serial", nodeId: node.id, data: line });
      }

      return "exec_out";
    }

    // Unknown activity — skip
    return "exec_out";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));
  }
}
