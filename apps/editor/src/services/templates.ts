import type { Node, Edge } from "@xyflow/react";
import type { Workflow } from "@embedflow/workflow-engine";
import type { ActivityNodeData } from "../stores/workflow-store";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  boardId: string;
  difficulty: "debutant" | "intermediaire" | "avance";
  workflow: Workflow;
  nodes: Node<ActivityNodeData>[];
  edges: Edge[];
}

function makeNode(
  id: string,
  activityId: string,
  label: string,
  icon: string,
  color: string,
  category: string,
  properties: Record<string, unknown>,
  position: { x: number; y: number },
): { rfNode: Node<ActivityNodeData>; wfNode: Workflow["nodes"][0] } {
  return {
    rfNode: {
      id,
      type: "activity",
      position,
      data: { activityId, label, icon, color, category, properties },
    },
    wfNode: { id, activityId, position, properties },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle = "exec_out",
  targetHandle = "exec_in",
): { rfEdge: Edge; wfEdge: Workflow["edges"][0] } {
  return {
    rfEdge: {
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
      animated: false,
    },
    wfEdge: {
      id,
      sourceNodeId: source,
      sourcePortId: sourceHandle,
      targetNodeId: target,
      targetPortId: targetHandle,
    },
  };
}

// ---- Template 1: LED Blink ----
function ledBlink(): WorkflowTemplate {
  const n1 = makeNode("t1-1", "gpio.turn_on", "Allumer une LED", "💡", "#22c55e", "GPIO", { composant: "LED", pin: 13 }, { x: 100, y: 50 });
  const n2 = makeNode("t1-2", "timing.wait", "Attendre", "⏱️", "#f59e0b", "Temps", { duree: 1000 }, { x: 100, y: 200 });
  const n3 = makeNode("t1-3", "gpio.turn_off", "Eteindre une LED", "🔌", "#ef4444", "GPIO", { composant: "LED", pin: 13 }, { x: 100, y: 350 });
  const n4 = makeNode("t1-4", "timing.wait", "Attendre", "⏱️", "#f59e0b", "Temps", { duree: 1000 }, { x: 100, y: 500 });

  const e1 = makeEdge("t1-e1", "t1-1", "t1-2");
  const e2 = makeEdge("t1-e2", "t1-2", "t1-3");
  const e3 = makeEdge("t1-e3", "t1-3", "t1-4");

  const now = new Date().toISOString();
  return {
    id: "template-led-blink",
    name: "LED Clignotante",
    description: "Fait clignoter une LED sur le pin 13 toutes les secondes.",
    icon: "💡",
    boardId: "arduino-uno",
    difficulty: "debutant",
    workflow: {
      id: crypto.randomUUID(),
      name: "LED Clignotante",
      boardId: "arduino-uno",
      nodes: [n1.wfNode, n2.wfNode, n3.wfNode, n4.wfNode],
      edges: [e1.wfEdge, e2.wfEdge, e3.wfEdge],
      variables: [],
      arguments: [],
      isMain: true,
      createdAt: now,
      updatedAt: now,
    },
    nodes: [n1.rfNode, n2.rfNode, n3.rfNode, n4.rfNode],
    edges: [e1.rfEdge, e2.rfEdge, e3.rfEdge],
  };
}

// ---- Template 2: Temperature Monitor ----
function temperatureMonitor(): WorkflowTemplate {
  const n1 = makeNode("t2-1", "sensors.read_temperature", "Lire temperature", "🌡️", "#3b82f6", "Capteurs", { capteur: "DHT22", pin: 4, unite: "C" }, { x: 100, y: 50 });
  const n2 = makeNode("t2-2", "communication.serial_send", "Afficher sur serie", "📡", "#8b5cf6", "Communication", { message: "Temperature:", variable: "temperature" }, { x: 100, y: 200 });
  const n3 = makeNode("t2-3", "logic.if_then", "Si temp > 30°C", "🔀", "#f59e0b", "Logique", { variable: "temperature", operateur: ">", valeur: 30 }, { x: 100, y: 350 });
  const n4 = makeNode("t2-4", "gpio.turn_on", "Allumer ventilateur", "💡", "#22c55e", "GPIO", { composant: "LED", pin: 8 }, { x: 0, y: 500 });
  const n5 = makeNode("t2-5", "gpio.turn_off", "Eteindre ventilateur", "🔌", "#ef4444", "GPIO", { composant: "LED", pin: 8 }, { x: 250, y: 500 });
  const n6 = makeNode("t2-6", "timing.wait", "Attendre 2s", "⏱️", "#f59e0b", "Temps", { duree: 2000 }, { x: 100, y: 650 });

  const e1 = makeEdge("t2-e1", "t2-1", "t2-2");
  const e2 = makeEdge("t2-e2", "t2-2", "t2-3");
  const e3 = makeEdge("t2-e3", "t2-3", "t2-4", "exec_true", "exec_in");
  const e4 = makeEdge("t2-e4", "t2-3", "t2-5", "exec_false", "exec_in");
  const e5 = makeEdge("t2-e5", "t2-4", "t2-6");
  const e6 = makeEdge("t2-e6", "t2-5", "t2-6");

  const now = new Date().toISOString();
  return {
    id: "template-temp-monitor",
    name: "Moniteur de Temperature",
    description: "Lit la temperature avec un DHT22, l'affiche sur le port serie et active un ventilateur si > 30°C.",
    icon: "🌡️",
    boardId: "arduino-uno",
    difficulty: "intermediaire",
    workflow: {
      id: crypto.randomUUID(),
      name: "Moniteur de Temperature",
      boardId: "arduino-uno",
      nodes: [n1.wfNode, n2.wfNode, n3.wfNode, n4.wfNode, n5.wfNode, n6.wfNode],
      edges: [e1.wfEdge, e2.wfEdge, e3.wfEdge, e4.wfEdge, e5.wfEdge, e6.wfEdge],
      variables: [],
      arguments: [],
      isMain: true,
      createdAt: now,
      updatedAt: now,
    },
    nodes: [n1.rfNode, n2.rfNode, n3.rfNode, n4.rfNode, n5.rfNode, n6.rfNode],
    edges: [e1.rfEdge, e2.rfEdge, e3.rfEdge, e4.rfEdge, e5.rfEdge, e6.rfEdge],
  };
}

// ---- Template 3: Servo Sweep ----
function servoSweep(): WorkflowTemplate {
  const n1 = makeNode("t3-1", "logic.repeat", "Repeter 180 fois", "🔄", "#8b5cf6", "Logique", { fois: 180 }, { x: 100, y: 50 });
  const n2 = makeNode("t3-2", "actuators.servo", "Servo aller", "🔧", "#f97316", "Actuateurs", { pin: 9, angle: 0 }, { x: 100, y: 200 });
  const n3 = makeNode("t3-3", "timing.wait", "Pause 15ms", "⏱️", "#f59e0b", "Temps", { duree: 15 }, { x: 100, y: 350 });

  const e1 = makeEdge("t3-e1", "t3-1", "t3-2", "exec_body", "exec_in");
  const e2 = makeEdge("t3-e2", "t3-2", "t3-3");

  const now = new Date().toISOString();
  return {
    id: "template-servo-sweep",
    name: "Balayage Servo",
    description: "Fait balayer un servo-moteur de 0° a 180° en boucle.",
    icon: "🔧",
    boardId: "arduino-uno",
    difficulty: "debutant",
    workflow: {
      id: crypto.randomUUID(),
      name: "Balayage Servo",
      boardId: "arduino-uno",
      nodes: [n1.wfNode, n2.wfNode, n3.wfNode],
      edges: [e1.wfEdge, e2.wfEdge],
      variables: [],
      arguments: [],
      isMain: true,
      createdAt: now,
      updatedAt: now,
    },
    nodes: [n1.rfNode, n2.rfNode, n3.rfNode],
    edges: [e1.rfEdge, e2.rfEdge],
  };
}

// ---- Template 4: Feu de Circulation ----
function trafficLight(): WorkflowTemplate {
  const n1 = makeNode("t4-1", "gpio.turn_on", "Vert ON", "💡", "#22c55e", "GPIO", { composant: "LED", pin: 10 }, { x: 100, y: 50 });
  const n2 = makeNode("t4-2", "timing.wait", "5 secondes", "⏱️", "#f59e0b", "Temps", { duree: 5000 }, { x: 100, y: 180 });
  const n3 = makeNode("t4-3", "gpio.turn_off", "Vert OFF", "🔌", "#ef4444", "GPIO", { composant: "LED", pin: 10 }, { x: 100, y: 310 });
  const n4 = makeNode("t4-4", "gpio.turn_on", "Orange ON", "💡", "#22c55e", "GPIO", { composant: "LED", pin: 11 }, { x: 100, y: 440 });
  const n5 = makeNode("t4-5", "timing.wait", "2 secondes", "⏱️", "#f59e0b", "Temps", { duree: 2000 }, { x: 100, y: 570 });
  const n6 = makeNode("t4-6", "gpio.turn_off", "Orange OFF", "🔌", "#ef4444", "GPIO", { composant: "LED", pin: 11 }, { x: 100, y: 700 });
  const n7 = makeNode("t4-7", "gpio.turn_on", "Rouge ON", "💡", "#22c55e", "GPIO", { composant: "LED", pin: 12 }, { x: 100, y: 830 });
  const n8 = makeNode("t4-8", "timing.wait", "5 secondes", "⏱️", "#f59e0b", "Temps", { duree: 5000 }, { x: 100, y: 960 });
  const n9 = makeNode("t4-9", "gpio.turn_off", "Rouge OFF", "🔌", "#ef4444", "GPIO", { composant: "LED", pin: 12 }, { x: 100, y: 1090 });

  const e1 = makeEdge("t4-e1", "t4-1", "t4-2");
  const e2 = makeEdge("t4-e2", "t4-2", "t4-3");
  const e3 = makeEdge("t4-e3", "t4-3", "t4-4");
  const e4 = makeEdge("t4-e4", "t4-4", "t4-5");
  const e5 = makeEdge("t4-e5", "t4-5", "t4-6");
  const e6 = makeEdge("t4-e6", "t4-6", "t4-7");
  const e7 = makeEdge("t4-e7", "t4-7", "t4-8");
  const e8 = makeEdge("t4-e8", "t4-8", "t4-9");

  const now = new Date().toISOString();
  return {
    id: "template-traffic-light",
    name: "Feu de Circulation",
    description: "Simule un feu tricolore avec 3 LEDs (vert, orange, rouge) sur les pins 10, 11, 12.",
    icon: "🚦",
    boardId: "arduino-uno",
    difficulty: "debutant",
    workflow: {
      id: crypto.randomUUID(),
      name: "Feu de Circulation",
      boardId: "arduino-uno",
      nodes: [n1.wfNode, n2.wfNode, n3.wfNode, n4.wfNode, n5.wfNode, n6.wfNode, n7.wfNode, n8.wfNode, n9.wfNode],
      edges: [e1.wfEdge, e2.wfEdge, e3.wfEdge, e4.wfEdge, e5.wfEdge, e6.wfEdge, e7.wfEdge, e8.wfEdge],
      variables: [],
      arguments: [],
      isMain: true,
      createdAt: now,
      updatedAt: now,
    },
    nodes: [n1.rfNode, n2.rfNode, n3.rfNode, n4.rfNode, n5.rfNode, n6.rfNode, n7.rfNode, n8.rfNode, n9.rfNode],
    edges: [e1.rfEdge, e2.rfEdge, e3.rfEdge, e4.rfEdge, e5.rfEdge, e6.rfEdge, e7.rfEdge, e8.rfEdge],
  };
}

// ---- Template 5: Distance Alarm ----
function distanceAlarm(): WorkflowTemplate {
  const n1 = makeNode("t5-1", "sensors.read_distance", "Lire distance", "📏", "#3b82f6", "Capteurs", { capteur: "HC-SR04", trigPin: 7, echoPin: 6 }, { x: 100, y: 50 });
  const n2 = makeNode("t5-2", "logic.if_then", "Si distance < 20cm", "🔀", "#f59e0b", "Logique", { variable: "distance", operateur: "<", valeur: 20 }, { x: 100, y: 200 });
  const n3 = makeNode("t5-3", "actuators.buzzer", "Alarme ON", "🔔", "#f97316", "Actuateurs", { pin: 5, frequence: 1000 }, { x: 0, y: 350 });
  const n4 = makeNode("t5-4", "gpio.turn_off", "Alarme OFF", "🔌", "#ef4444", "GPIO", { composant: "Buzzer", pin: 5 }, { x: 250, y: 350 });
  const n5 = makeNode("t5-5", "timing.wait", "Pause 200ms", "⏱️", "#f59e0b", "Temps", { duree: 200 }, { x: 100, y: 500 });

  const e1 = makeEdge("t5-e1", "t5-1", "t5-2");
  const e2 = makeEdge("t5-e2", "t5-2", "t5-3", "exec_true", "exec_in");
  const e3 = makeEdge("t5-e3", "t5-2", "t5-4", "exec_false", "exec_in");
  const e4 = makeEdge("t5-e4", "t5-3", "t5-5");
  const e5 = makeEdge("t5-e5", "t5-4", "t5-5");

  const now = new Date().toISOString();
  return {
    id: "template-distance-alarm",
    name: "Alarme de Distance",
    description: "Declenche un buzzer quand un objet est a moins de 20cm (capteur ultrason HC-SR04).",
    icon: "📏",
    boardId: "arduino-uno",
    difficulty: "intermediaire",
    workflow: {
      id: crypto.randomUUID(),
      name: "Alarme de Distance",
      boardId: "arduino-uno",
      nodes: [n1.wfNode, n2.wfNode, n3.wfNode, n4.wfNode, n5.wfNode],
      edges: [e1.wfEdge, e2.wfEdge, e3.wfEdge, e4.wfEdge, e5.wfEdge],
      variables: [],
      arguments: [],
      isMain: true,
      createdAt: now,
      updatedAt: now,
    },
    nodes: [n1.rfNode, n2.rfNode, n3.rfNode, n4.rfNode, n5.rfNode],
    edges: [e1.rfEdge, e2.rfEdge, e3.rfEdge, e4.rfEdge, e5.rfEdge],
  };
}

export function getTemplates(): WorkflowTemplate[] {
  return [ledBlink(), servoSweep(), trafficLight(), temperatureMonitor(), distanceAlarm()];
}
