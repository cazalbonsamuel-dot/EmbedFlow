// --- Types ---

export type PinType = "digital" | "analog" | "pwm" | "i2c" | "spi" | "uart";

export interface PinDefinition {
  number: number;
  name: string;
  types: PinType[];
  position: { x: number; y: number };
}

export interface BoardDefinition {
  id: string;
  name: string;
  manufacturer: string;
  microcontroller: string;
  clockSpeed: string;
  ram: number;
  flash: number;
  voltage: number;
  pins: PinDefinition[];
  features: string[];
}

// --- Registry ---

const boards = new Map<string, BoardDefinition>();

export function registerBoard(board: BoardDefinition): void {
  boards.set(board.id, board);
}

export function getBoard(id: string): BoardDefinition | undefined {
  return boards.get(id);
}

export function listBoards(): BoardDefinition[] {
  return Array.from(boards.values());
}

// --- Pre-registered boards ---

registerBoard({
  id: "arduino-uno",
  name: "Arduino Uno R3",
  manufacturer: "Arduino",
  microcontroller: "ATmega328P",
  clockSpeed: "16 MHz",
  ram: 2048,
  flash: 32768,
  voltage: 5,
  features: ["digital", "analog", "pwm", "i2c", "spi", "uart"],
  pins: [
    { number: 0, name: "D0/RX", types: ["digital", "uart"], position: { x: 0, y: 0 } },
    { number: 1, name: "D1/TX", types: ["digital", "uart"], position: { x: 0, y: 1 } },
    { number: 2, name: "D2", types: ["digital"], position: { x: 0, y: 2 } },
    { number: 3, name: "D3", types: ["digital", "pwm"], position: { x: 0, y: 3 } },
    { number: 4, name: "D4", types: ["digital"], position: { x: 0, y: 4 } },
    { number: 5, name: "D5", types: ["digital", "pwm"], position: { x: 0, y: 5 } },
    { number: 6, name: "D6", types: ["digital", "pwm"], position: { x: 0, y: 6 } },
    { number: 7, name: "D7", types: ["digital"], position: { x: 0, y: 7 } },
    { number: 8, name: "D8", types: ["digital"], position: { x: 0, y: 8 } },
    { number: 9, name: "D9", types: ["digital", "pwm"], position: { x: 0, y: 9 } },
    { number: 10, name: "D10", types: ["digital", "pwm", "spi"], position: { x: 0, y: 10 } },
    { number: 11, name: "D11", types: ["digital", "pwm", "spi"], position: { x: 0, y: 11 } },
    { number: 12, name: "D12", types: ["digital", "spi"], position: { x: 0, y: 12 } },
    { number: 13, name: "D13", types: ["digital", "spi"], position: { x: 0, y: 13 } },
    { number: 14, name: "A0", types: ["analog", "digital"], position: { x: 1, y: 0 } },
    { number: 15, name: "A1", types: ["analog", "digital"], position: { x: 1, y: 1 } },
    { number: 16, name: "A2", types: ["analog", "digital"], position: { x: 1, y: 2 } },
    { number: 17, name: "A3", types: ["analog", "digital"], position: { x: 1, y: 3 } },
    { number: 18, name: "A4/SDA", types: ["analog", "digital", "i2c"], position: { x: 1, y: 4 } },
    { number: 19, name: "A5/SCL", types: ["analog", "digital", "i2c"], position: { x: 1, y: 5 } },
  ],
});

registerBoard({
  id: "esp32",
  name: "ESP32 DevKit V1",
  manufacturer: "Espressif",
  microcontroller: "ESP32-WROOM-32",
  clockSpeed: "240 MHz",
  ram: 520192,
  flash: 4194304,
  voltage: 3.3,
  features: ["digital", "analog", "pwm", "i2c", "spi", "uart", "wifi", "bluetooth"],
  pins: [
    { number: 0, name: "GPIO0", types: ["digital", "pwm"], position: { x: 0, y: 0 } },
    { number: 2, name: "GPIO2", types: ["digital", "pwm"], position: { x: 0, y: 1 } },
    { number: 4, name: "GPIO4", types: ["digital", "pwm"], position: { x: 0, y: 2 } },
    { number: 5, name: "GPIO5", types: ["digital", "pwm", "spi"], position: { x: 0, y: 3 } },
    { number: 12, name: "GPIO12", types: ["digital", "pwm", "analog"], position: { x: 0, y: 4 } },
    { number: 13, name: "GPIO13", types: ["digital", "pwm", "analog"], position: { x: 0, y: 5 } },
    { number: 14, name: "GPIO14", types: ["digital", "pwm", "analog"], position: { x: 0, y: 6 } },
    { number: 15, name: "GPIO15", types: ["digital", "pwm", "analog"], position: { x: 0, y: 7 } },
    { number: 16, name: "GPIO16/RX2", types: ["digital", "pwm", "uart"], position: { x: 0, y: 8 } },
    { number: 17, name: "GPIO17/TX2", types: ["digital", "pwm", "uart"], position: { x: 0, y: 9 } },
    { number: 18, name: "GPIO18", types: ["digital", "pwm", "spi"], position: { x: 0, y: 10 } },
    { number: 19, name: "GPIO19", types: ["digital", "pwm", "spi"], position: { x: 0, y: 11 } },
    { number: 21, name: "GPIO21/SDA", types: ["digital", "pwm", "i2c"], position: { x: 1, y: 0 } },
    { number: 22, name: "GPIO22/SCL", types: ["digital", "pwm", "i2c"], position: { x: 1, y: 1 } },
    { number: 23, name: "GPIO23", types: ["digital", "pwm", "spi"], position: { x: 1, y: 2 } },
    { number: 25, name: "GPIO25", types: ["digital", "pwm", "analog"], position: { x: 1, y: 3 } },
    { number: 26, name: "GPIO26", types: ["digital", "pwm", "analog"], position: { x: 1, y: 4 } },
    { number: 27, name: "GPIO27", types: ["digital", "pwm", "analog"], position: { x: 1, y: 5 } },
    { number: 32, name: "GPIO32", types: ["digital", "pwm", "analog"], position: { x: 1, y: 6 } },
    { number: 33, name: "GPIO33", types: ["digital", "pwm", "analog"], position: { x: 1, y: 7 } },
    { number: 34, name: "GPIO34", types: ["analog"], position: { x: 1, y: 8 } },
    { number: 35, name: "GPIO35", types: ["analog"], position: { x: 1, y: 9 } },
    { number: 36, name: "GPIO36/VP", types: ["analog"], position: { x: 1, y: 10 } },
    { number: 39, name: "GPIO39/VN", types: ["analog"], position: { x: 1, y: 11 } },
  ],
});
