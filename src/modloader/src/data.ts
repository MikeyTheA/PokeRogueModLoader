import LZString from '../lib/lz-string.js';

const _staticMap = new Map();
const _persistentMap = new Map();

export type Listener = {
    id: String;
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
        const changed: Boolean = this.value !== value;
        this.value = value;

        if (changed) {
            this.notifyListeners();

            if (this.saveCallback) {
                this.saveCallback();
            }
        }

        return this.value;
    };

    addListener(listener: Function, identifier: String) {
        this.listeners.push({
            listener: listener,
            id: identifier,
        });
    }

    removeListener(identifier: String) {
        const listener = this.listeners.findIndex((lis) => lis.id === identifier);
        if (listener) {
            delete this.listeners[listener];
        }
    }

    notifyListeners() {
        this.listeners.forEach((listener: { listener: Function; id: String }) => {
            listener.listener(this.value);
        });
    }
}

export default class StaticManager {
    private prefix: String;

    constructor(prefix: String = '') {
        this.prefix = prefix;
    }

    private getStatic(key: String, init: any, persistent: Boolean = false): Static {
        const map = persistent ? _persistentMap : _staticMap;
        const fullKey = this.prefix ? `${this.prefix}/${key}` : key;

        if (!map.has(fullKey)) {
            const saveCallback = persistent ? () => this.savePersistentData() : null;
            map.set(fullKey, new Static(init, saveCallback));
        }
        return map.get(fullKey);
    }

    getData(key: String, init: any, persistent: Boolean = false) {
        return this.getStatic(key, init, persistent).value;
    }

    setData(key: String, value: any, persistent: Boolean = false) {
        this.getAccess(key, value, persistent)(value);
    }

    getAccess(key: String, init: any, persistent: Boolean = false) {
        return this.getStatic(key, init, persistent).access;
    }

    savePersistentData() {
        const dataToSave = {};
        _persistentMap.forEach((staticInstance, key) => {
            dataToSave[key] = staticInstance.value;
        });

        try {
            localStorage.setItem('MokeRoguePersistentData', LZString.compressToUTF16(JSON.stringify(dataToSave)));
        } catch (e) {
            throw new Error(e);
        }
    }

    loadPersistentData() {
        const savedData = LZString.decompressFromUTF16(localStorage.getItem('MokeRoguePersistentData'));

        if (savedData) {
            const data = JSON.parse(savedData);
            for (const key in data) {
                _persistentMap.set(key, new Static(data[key], () => this.savePersistentData()));
            }
        }
    }

    addListener(key: String, init: any, listener: Function, persistent: Boolean = false, identifier: String = crypto.randomUUID()) {
        const staticInstance = this.getStatic(key, init, persistent);
        staticInstance.addListener(listener, identifier);
    }

    cleanListeners(identifier: String) {
        const removeListeners = (map: Map<String, Static>) => {
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
