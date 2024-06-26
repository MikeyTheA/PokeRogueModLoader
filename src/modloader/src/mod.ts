import LZstring from "../lib/lz-string.js";

import StaticManager from "./data";
import { LoaderData } from "./main";
import { Sandbox } from "./sandbox";
import { WindowFlags, windowHandler } from "./windows";

import PokeRogue from "./all-modules";
window["PokeRogue"] = PokeRogue;
export type ModData = {
  id?: string;
  name?: string;
  description?: string;
  author?: string;
  version?: number;
  scripts?: Array<ScriptData>;
};

export type ScriptData = {
  id?: string;
  name?: string;
  code?: string;
};

export type Hook = {
  phase: string;
  func: Function;
};

export class ModsHandler {
  public mods: Array<Mod>;

  constructor() {
    this.mods = [];
  }

  addMod(data: ModData = {}) {
    const mod = new Mod(data, this);
    this.mods.push(mod);
    this.save();
  }

  deleteMod(id: string) {
    const mod = this.getMod(id);
    if (mod) {
      mod.delete();
      return true;
    } else {
      return false;
    }
  }

  getMod(id: string) {
    return this.mods.find((mod) => mod.id === id);
  }

  save() {
    const mods = this.compress();
    localStorage.setItem("MokeRogueMods", LZstring.compressToUTF16(JSON.stringify(mods)));
    return true;
  }

  compress() {
    const mods: Array<ModData> = this.mods.map((mod) => ({
      id: mod.id,
      name: mod.name,
      description: mod.description,
      author: mod.author,
      version: mod.version,
      scripts: mod.scripts.map((script) => ({
        id: script.id,
        name: script.name,
        code: script.code,
      })),
    }));

    return mods;
  }

  load() {
    const mods = LZstring.decompressFromUTF16(localStorage.getItem("MokeRogueMods"));
    if (mods) {
      const parsedMods: Array<ModData> = JSON.parse(mods);
      parsedMods.map((modData) => this.addMod(modData));
    }
  }
}

class Mod {
  public id: string;
  public name: string;
  public description: string;
  public author: string;
  public version: number;
  public scripts: Array<Script>;
  public modsHandler: ModsHandler;
  public data: StaticManager;

  public github: boolean;

  constructor(data: ModData, modsHandler: ModsHandler) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || "Unnamed mod";
    this.description = data.description || "";
    this.author = data.author || "Unknown author";
    this.version = data.version || 1;
    this.modsHandler = modsHandler;

    this.data = new StaticManager(this.id);

    this.github = this.id.startsWith("https://github.com/");
    this.scripts = (data.scripts || []).map((scriptData) => new Script(scriptData, this));
  }

  delete() {
    this.scripts.forEach((script) => script.delete());
    this.modsHandler.mods = this.modsHandler.mods.filter((mod) => mod.id !== this.id);
    this.modsHandler.save();
  }

  addScript(data: ScriptData) {
    const script = new Script(data, this);
    this.scripts.push(script);
    this.modsHandler.save();
  }

  deleteScript(id: string) {
    this.scripts.find((script) => script.id !== id).delete();
  }
}

class Script {
  public id: string;
  public name: string;
  private _code: string;
  public hooks: Array<Hook>;
  public mod: Mod;
  public sandbox: Sandbox;

  constructor(data: ScriptData, mod: Mod) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || "Unnamed script";
    this.hooks = [];
    this.mod = mod;

    this.sandbox = new Sandbox({
      ImGui: ImGui,
      data: this.mod.data,
      globalData: new StaticManager("global"),
      log: (message: string) => {
        const logs = LoaderData.getData(`LogsForMod${this.mod.id}`, [], false);
        logs.push(["log", message]);
        LoaderData.setData(`LogsForMod${this.mod.id}`, logs);
      },
      error: (message: string) => {
        const logs = LoaderData.getData(`LogsForMod${this.mod.id}`, [], false);
        logs.push(["error", message]);
        LoaderData.setData(`LogsForMod${this.mod.id}`, logs);
      },
      getBattleScene: () => {
        if (window.Phaser && Phaser.Display && Phaser.Display.Canvas && Phaser.Display.Canvas.CanvasPool && (Phaser.Display.Canvas.CanvasPool as any).pool[1] && (Phaser.Display.Canvas.CanvasPool as any).pool[1].parent && (Phaser.Display.Canvas.CanvasPool as any).pool[1].parent.scene) {
          return (Phaser.Display.Canvas.CanvasPool as any).pool[1].parent.scene;
        }
        return false;
      },
      addWindow: (name: string, show: Function, flags: WindowFlags) => {
        windowHandler.addWindow(name, show, flags, `${this.id}|${name}`);
      },
      hook: (phase: string, func: Function) => {
        this.hooks.push({ phase: phase, func: func });
      },
      getInstalledMods: () => {
        return this.mod.modsHandler.mods.map((mod) => ({
          name: mod.name,
          version: mod.version,
          author: mod.author,
        }));
      },
      PokeRogue: PokeRogue,
      getWindowOpenAccess: (windowName: string) => {
        const window = windowHandler.Windows.find(window => window.name === windowName && window.identifier === `${this.id}|${windowName}`)
        if (window) {
          return LoaderData.getAccess(`WindowOpenState${this.id}|${windowName}`, window.flags.open, window.flags.persistentOpen)
        }
        return false
      }
    });

    this.code = data.code || "print(\"Hello world!\")";
  }

  reload() {
    this.clean();
    this.sandbox.clearEnv();
    this.sandbox.refreshEnv();
    this.sandbox.eval(this.code);
  }

  clean() {
    if (this.sandbox.sandboxWindow.cleanup) {
      this.sandbox.sandboxWindow.cleanup();
    }

    this.sandbox.sandboxWindow.cleanup = undefined;
    this.sandbox.sandboxWindow.update = undefined;
    this.sandbox.sandboxWindow.onPhasePush = undefined;

    this.hooks = [];

    windowHandler.Windows = windowHandler.Windows.filter((window) => !window.identifier.startsWith(this.id as string));

    this.mod.data.cleanListeners(this.id);
  }

  delete() {
    this.clean();
    this.mod.scripts = this.mod.scripts.filter((script) => script.id !== this.id);
    this.mod.modsHandler.save();
  }

  set code(newCode: string) {
    this._code = newCode;
    LoaderData.setData(`JSBeautified|${this.id}`, undefined, false);
    this.reload();
  }

  get code() {
    return this._code;
  }
}
