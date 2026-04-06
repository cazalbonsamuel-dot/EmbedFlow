export interface PropertyOption {
  label: string;
  value: string;
  icon?: string;
  photo?: string;
}

export interface PropertyValidation {
  rule: string;
  errorMessage: string;
}

export interface PropertyDef {
  name: string;
  label: string;
  type: "choice" | "pin" | "number" | "slider" | "toggle" | "text" | "variable";
  required: boolean;
  level: "essential" | "options" | "expert";
  default?: unknown;
  options?: PropertyOption[];
  validation?: PropertyValidation;
  helpText?: string;
}

export interface PortDef {
  id: string;
  name: string;
  type: "execution" | "number" | "boolean" | "string";
}

export interface LibraryDep {
  name: string;
  version: string;
}

export interface WiringInstruction {
  from: string;
  to: string;
  color: string;
  label: string;
}

export interface SimulateConfig {
  defaultValue: unknown;
  range?: [number, number];
  unit?: string;
  controlType: "slider" | "toggle" | "button" | "input";
}

export interface CodegenConfig {
  libraries: LibraryDep[];
  includes: string[];
  globals: (props: Record<string, unknown>) => string;
  setup: (props: Record<string, unknown>) => string;
  loop: (
    props: Record<string, unknown>,
    inputs: Record<string, string>,
    outputs: Record<string, string>,
  ) => string;
  errorHandling?: (props: Record<string, unknown>) => string;
}

export interface ActivityDefinition {
  id: string;
  category: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  supportedBoards: string[];
  properties: PropertyDef[];
  inputs: PortDef[];
  outputs: PortDef[];
  codegen: CodegenConfig;
  validate: (
    props: Record<string, unknown>,
    context: { usedPins: Set<number>; boardId: string },
  ) => { valid: boolean; messages: string[] };
  wiring: (
    props: Record<string, unknown>,
    board: { id: string },
  ) => WiringInstruction[];
  simulate: SimulateConfig;
}
