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

registerBoard({
  id: "arduino-nano",
  name: "Arduino Nano",
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
    { number: 20, name: "A6", types: ["analog"], position: { x: 1, y: 6 } },
    { number: 21, name: "A7", types: ["analog"], position: { x: 1, y: 7 } },
  ],
});

registerBoard({
  id: "arduino-mega",
  name: "Arduino Mega 2560",
  manufacturer: "Arduino",
  microcontroller: "ATmega2560",
  clockSpeed: "16 MHz",
  ram: 8192,
  flash: 262144,
  voltage: 5,
  features: ["digital", "analog", "pwm", "i2c", "spi", "uart"],
  pins: [
    // Left side — digital pins
    { number: 0, name: "D0/RX0", types: ["digital", "uart"], position: { x: 0, y: 0 } },
    { number: 1, name: "D1/TX0", types: ["digital", "uart"], position: { x: 0, y: 1 } },
    { number: 2, name: "D2", types: ["digital", "pwm"], position: { x: 0, y: 2 } },
    { number: 3, name: "D3", types: ["digital", "pwm"], position: { x: 0, y: 3 } },
    { number: 4, name: "D4", types: ["digital", "pwm"], position: { x: 0, y: 4 } },
    { number: 5, name: "D5", types: ["digital", "pwm"], position: { x: 0, y: 5 } },
    { number: 6, name: "D6", types: ["digital", "pwm"], position: { x: 0, y: 6 } },
    { number: 7, name: "D7", types: ["digital", "pwm"], position: { x: 0, y: 7 } },
    { number: 8, name: "D8", types: ["digital", "pwm"], position: { x: 0, y: 8 } },
    { number: 9, name: "D9", types: ["digital", "pwm"], position: { x: 0, y: 9 } },
    { number: 10, name: "D10", types: ["digital", "pwm", "spi"], position: { x: 0, y: 10 } },
    { number: 11, name: "D11", types: ["digital", "pwm", "spi"], position: { x: 0, y: 11 } },
    { number: 12, name: "D12", types: ["digital", "pwm", "spi"], position: { x: 0, y: 12 } },
    { number: 13, name: "D13", types: ["digital", "pwm", "spi"], position: { x: 0, y: 13 } },
    { number: 14, name: "D14/TX3", types: ["digital", "uart"], position: { x: 0, y: 14 } },
    { number: 15, name: "D15/RX3", types: ["digital", "uart"], position: { x: 0, y: 15 } },
    { number: 16, name: "D16/TX2", types: ["digital", "uart"], position: { x: 0, y: 16 } },
    { number: 17, name: "D17/RX2", types: ["digital", "uart"], position: { x: 0, y: 17 } },
    { number: 18, name: "D18/TX1", types: ["digital", "uart"], position: { x: 0, y: 18 } },
    { number: 19, name: "D19/RX1", types: ["digital", "uart"], position: { x: 0, y: 19 } },
    { number: 20, name: "D20/SDA", types: ["digital", "i2c"], position: { x: 0, y: 20 } },
    { number: 21, name: "D21/SCL", types: ["digital", "i2c"], position: { x: 0, y: 21 } },
    { number: 22, name: "D22", types: ["digital"], position: { x: 0, y: 22 } },
    { number: 24, name: "D24", types: ["digital"], position: { x: 0, y: 23 } },
    { number: 26, name: "D26", types: ["digital"], position: { x: 0, y: 24 } },
    { number: 28, name: "D28", types: ["digital"], position: { x: 0, y: 25 } },
    { number: 30, name: "D30", types: ["digital"], position: { x: 0, y: 26 } },
    // Right side — analog + high digital
    { number: 54, name: "A0", types: ["analog", "digital"], position: { x: 1, y: 0 } },
    { number: 55, name: "A1", types: ["analog", "digital"], position: { x: 1, y: 1 } },
    { number: 56, name: "A2", types: ["analog", "digital"], position: { x: 1, y: 2 } },
    { number: 57, name: "A3", types: ["analog", "digital"], position: { x: 1, y: 3 } },
    { number: 58, name: "A4", types: ["analog", "digital"], position: { x: 1, y: 4 } },
    { number: 59, name: "A5", types: ["analog", "digital"], position: { x: 1, y: 5 } },
    { number: 60, name: "A6", types: ["analog", "digital"], position: { x: 1, y: 6 } },
    { number: 61, name: "A7", types: ["analog", "digital"], position: { x: 1, y: 7 } },
    { number: 62, name: "A8", types: ["analog", "digital"], position: { x: 1, y: 8 } },
    { number: 63, name: "A9", types: ["analog", "digital"], position: { x: 1, y: 9 } },
    { number: 64, name: "A10", types: ["analog", "digital"], position: { x: 1, y: 10 } },
    { number: 65, name: "A11", types: ["analog", "digital"], position: { x: 1, y: 11 } },
    { number: 66, name: "A12", types: ["analog", "digital"], position: { x: 1, y: 12 } },
    { number: 67, name: "A13", types: ["analog", "digital"], position: { x: 1, y: 13 } },
    { number: 68, name: "A14", types: ["analog", "digital"], position: { x: 1, y: 14 } },
    { number: 69, name: "A15", types: ["analog", "digital"], position: { x: 1, y: 15 } },
    { number: 44, name: "D44", types: ["digital", "pwm"], position: { x: 1, y: 16 } },
    { number: 45, name: "D45", types: ["digital", "pwm"], position: { x: 1, y: 17 } },
    { number: 46, name: "D46", types: ["digital", "pwm"], position: { x: 1, y: 18 } },
    { number: 50, name: "D50/MISO", types: ["digital", "spi"], position: { x: 1, y: 19 } },
    { number: 51, name: "D51/MOSI", types: ["digital", "spi"], position: { x: 1, y: 20 } },
    { number: 52, name: "D52/SCK", types: ["digital", "spi"], position: { x: 1, y: 21 } },
    { number: 53, name: "D53/SS", types: ["digital", "spi"], position: { x: 1, y: 22 } },
  ],
});

registerBoard({
  id: "esp8266",
  name: "ESP8266 NodeMCU",
  manufacturer: "Espressif",
  microcontroller: "ESP8266",
  clockSpeed: "80 MHz",
  ram: 81920,
  flash: 4194304,
  voltage: 3.3,
  features: ["digital", "analog", "pwm", "i2c", "spi", "uart", "wifi"],
  pins: [
    { number: 16, name: "D0/GPIO16", types: ["digital"], position: { x: 0, y: 0 } },
    { number: 5, name: "D1/GPIO5/SCL", types: ["digital", "pwm", "i2c"], position: { x: 0, y: 1 } },
    { number: 4, name: "D2/GPIO4/SDA", types: ["digital", "pwm", "i2c"], position: { x: 0, y: 2 } },
    { number: 0, name: "D3/GPIO0", types: ["digital", "pwm"], position: { x: 0, y: 3 } },
    { number: 2, name: "D4/GPIO2", types: ["digital", "pwm"], position: { x: 0, y: 4 } },
    { number: 14, name: "D5/GPIO14/SCK", types: ["digital", "pwm", "spi"], position: { x: 1, y: 0 } },
    { number: 12, name: "D6/GPIO12/MISO", types: ["digital", "pwm", "spi"], position: { x: 1, y: 1 } },
    { number: 13, name: "D7/GPIO13/MOSI", types: ["digital", "pwm", "spi"], position: { x: 1, y: 2 } },
    { number: 15, name: "D8/GPIO15/SS", types: ["digital", "pwm", "spi"], position: { x: 1, y: 3 } },
    { number: 17, name: "A0", types: ["analog"], position: { x: 1, y: 4 } },
  ],
});
