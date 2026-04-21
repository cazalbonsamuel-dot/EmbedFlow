import { spawn, ChildProcess } from "child_process";

export class SerialConnection {
  private process: ChildProcess | null = null;
  private dataCallbacks: ((line: string) => void)[] = [];
  private errorCallbacks: ((err: string) => void)[] = [];

  async open(portPath: string, fqbn: string, baudRate: number): Promise<void> {
    if (this.process) {
      await this.close();
    }

    this.process = spawn("arduino-cli", [
      "monitor",
      "--port", portPath,
      "--fqbn", fqbn,
      "--config", `baudrate=${baudRate}`,
    ]);

    let buffer = "";
    this.process.stdout?.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) {
          for (const cb of this.dataCallbacks) cb(line);
        }
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        for (const cb of this.errorCallbacks) cb(msg);
      }
    });
  }

  onData(callback: (line: string) => void): void {
    this.dataCallbacks.push(callback);
  }

  onError(callback: (err: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  send(data: string): void {
    this.process?.stdin?.write(data + "\n");
  }

  async close(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.dataCallbacks = [];
    this.errorCallbacks = [];
  }

  isOpen(): boolean {
    return this.process !== null;
  }
}
