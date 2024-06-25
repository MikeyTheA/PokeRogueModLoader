import LZString from "../lib/lz-string.js";

const _staticMap = new Map();
const _persistentMap = new Map();

export type Listener = {
  id: string;
  listener: Function;
};

class Static {
  public value: any;
  private saveCallback: Function | undefined;
  public listeners: Array<Listener>;

  constructor(value: any, saveCallback: Function | undefined) {
    this.value = value;
    this.saveCallback = saveCallback;
    this.listeners = [];
  }

  access = (value: any = this.value) => {
    const changed: boolean = this.value !== value;
    this.value = value;

    if (changed) {
      this.notifyListeners();

      if (this.saveCallback) {
        this.saveCallback();
      }
    }

    return this.value;
  };

  addListener(listener: Function, identifier: string) {
    this.listeners.push({
      listener: listener,
      id: identifier,
    });
  }

  removeListener(identifier: string) {
    const listener = this.listeners.findIndex((lis) => lis.id === identifier);
    if (listener) {
      delete this.listeners[listener];
    }
  }

  notifyListeners() {
    this.listeners.forEach((listener: { listener: Function; id: string }) => {
      listener.listener(this.value);
    });
  }
}

export default class StaticManager {
  private prefix: string;

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  private getStatic(key: string, init: any, persistent: boolean = false): Static {
    const map = persistent ? _persistentMap : _staticMap;
    const fullKey = this.prefix ? `${this.prefix}/${key}` : key;

    if (!map.has(fullKey)) {
      const saveCallback = persistent ? () => this.savePersistentData() : null;
      map.set(fullKey, new Static(init, saveCallback));
    }
    return map.get(fullKey);
  }

  getData(key: string, init: any, persistent: boolean = false) {
    return this.getStatic(key, init, persistent).value;
  }

  setData(key: string, value: any, persistent: boolean = false) {
    this.getAccess(key, value, persistent)(value);
  }

  getAccess(key: string, init: any, persistent: boolean = false) {
    return this.getStatic(key, init, persistent).access;
  }

  savePersistentData() {
    const dataToSave = {};
    _persistentMap.forEach((staticInstance, key) => {
      dataToSave[key] = staticInstance.value;
    });

    try {
      localStorage.setItem("MokeRoguePersistentData", LZString.compressToUTF16(JSON.stringify(dataToSave)));
    } catch (e) {
      throw new Error(e);
    }
  }

  loadPersistentData() {
    const savedData = localStorage.getItem("MokeRoguePersistentData");

    if (savedData) {
      const data = JSON.parse(LZString.decompressFromUTF16(savedData));
      console.log(data);
      for (const key in data) {
        _persistentMap.set(key, new Static(data[key], this.savePersistentData));
      }
    }
  }

  addListener(key: string, init: any, listener: Function, persistent: boolean = false, identifier: string = crypto.randomUUID()) {
    const staticInstance = this.getStatic(key, init, persistent);
    staticInstance.addListener(listener, identifier);
  }

  cleanListeners(identifier: string) {
    const removeListeners = (map: Map<string, Static>) => {
      for (const [, staticInstance] of map.entries()) {
        staticInstance.listeners.forEach((listener, index) => {
          if (listener.id === identifier) {
            delete staticInstance.listeners[index];
          }
        });
      }
    };

    removeListeners(_persistentMap);
    removeListeners(_staticMap);
  }
}
