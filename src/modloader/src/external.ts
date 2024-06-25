import { LoaderData, modsHandler } from "./main";
import { ModData } from "./mod";

export class ExternalHandler {
  private port: number;
  private webSocket: WebSocket;
  private retryInterval: number = 5000; // 5s
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(port: number) {
    this.port = port;
  }

  connect() {
    this.webSocket = new WebSocket(`ws://localhost:${this.port}`);

    this.webSocket.onopen = () => {
      LoaderData.setData("WebSocketSuccess", true, false);
      if (this.retryTimer) {
        clearInterval(this.retryTimer);
        this.retryTimer = null;
      }
    };

    this.webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "connect") {
        const data: Array<ModData> = message.data;
        modsHandler.mods
          .filter((mod) => mod.github === false && !data.find(datamod => datamod.name === mod.name))
          .forEach((mod) => {
            mod.delete();
          });

        data.forEach((mod: ModData) => {
          const existingMod = modsHandler.mods.find((modsearch) => modsearch.name === mod.name && modsearch.github === false);
          if (existingMod) {
            existingMod.author = mod.author;
            existingMod.description = mod.description;
            existingMod.version = mod.version;

            existingMod.scripts.forEach((script) => {
              if (!mod.scripts.find((scr) => scr.name === script.name)) {
                script.delete();
              }
            });

            mod.scripts.forEach((script) => {
              const existingScript = existingMod.scripts.find((scriptsearch) => scriptsearch.name === script.name);
              if (existingScript) {
                existingScript.code = script.code;
              } else {
                existingMod.addScript(script);
              }
            });
          } else {
            modsHandler.addMod(mod);
          }
        });
      } else if (message.type === "update") {
      } else if (message.type === "newmod") {
        const existingMod = modsHandler.mods.find((modsearch) => modsearch.name === message.data && modsearch.github === false);
        if (!existingMod) {
          modsHandler.addMod({
            name: message.data,
          });
        }
      } else if (message.type === "deletemod") {
        const mod = modsHandler.mods.find((modsearch) => modsearch.name === message.data && !modsearch.github);
        if (mod) {
          mod.delete();
        }
      } else if (message.type === "addscript") {
        const mod = modsHandler.mods.find((modsearch) => modsearch.name === message.data.mod && !modsearch.github);
        if (mod) {
          mod.addScript(message.data.script);
        }
      } else if (message.type === "deletescript") {
        const mod = modsHandler.mods.find((modsearch) => modsearch.name === message.data.mod && !modsearch.github);
        if (mod) {
          const script = mod.scripts.find((scriptsearch) => scriptsearch.name === message.data.script);
          if (script) {
            script.delete();
          }
        }
      } else if (message.type === "updatemoddata") {
        const mod = modsHandler.mods.find((modsearch) => modsearch.name === message.data.mod && !modsearch.github);
        if (mod) {
          mod.author = message.data.data.author || mod.author;
          mod.version = message.data.data.version || mod.version;
          mod.description = message.data.data.description || mod.description;
        }
      } else if (message.type === "updatescript") {
        const mod = modsHandler.mods.find((modsearch) => modsearch.name === message.data.mod && !modsearch.github);
        if (mod) {
          const script = mod.scripts.find((scriptsearch) => scriptsearch.name === message.data.script.name);
          if (script) {
            script.code = message.data.script.code;
            script.reload();
          }
        }
      }
      modsHandler.save();
    };

    this.webSocket.onclose = () => {
      LoaderData.setData("WebSocketSuccess", false, false);
      this.retryConnection();
    };
  }

  private retryConnection() {
    if (!this.retryTimer) {
      this.retryTimer = setInterval(() => {
        this.connect();
      }, this.retryInterval);
    }
  }
}
