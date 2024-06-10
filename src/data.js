const _staticMap = new Map();
const _persistentMap = new Map();

class Static {
    constructor(value, saveCallback = null) {
        this.value = value;
        this.saveCallback = saveCallback;
        this.listeners = {};
    }

    access = (value = this.value) => {
        const changed = this.value !== value;
        this.value = value;
        if (changed && this.saveCallback) {
            this.saveCallback(this.value);
        }
        if (changed) {
            this.notifyListeners();
        }
        return this.value;
    };

    addListener(listener, id = 0) {
        if (this.listeners[0] === undefined) {
            this.listeners[id] = [];
        }
        this.listeners[id].push(listener);
    }

    notifyListeners() {
        for (const [_id, listeners] of Object.entries(this.listeners)) {
            listeners.forEach((listener) => {
                listener(this.value);
            });
        }
    }
}

class StaticManager {
    constructor(prefix = '') {
        this.prefix = prefix;
    }

    _getStatic(key, init, persistent = false) {
        const map = persistent ? _persistentMap : _staticMap;
        const fullKey = this.prefix ? `${this.prefix}/${key}` : key;

        if (!map.has(fullKey)) {
            const saveCallback = persistent ? () => this.savePersistentData() : null;
            map.set(fullKey, new Static(init, saveCallback));
        }
        return map.get(fullKey);
    }

    getData(key, init, persistent = false) {
        return this._getStatic(key, init, persistent).value;
    }

    setData(key, value, persistent = false) {
        this.getAccess(key, value, persistent)(value);
        if (persistent) {
            this.savePersistentData();
        }
    }

    getAccess(key, init, persistent = false) {
        return this._getStatic(key, init, persistent).access;
    }

    savePersistentData() {
        const dataToSave = {};
        _persistentMap.forEach((staticInstance, key) => {
            dataToSave[key] = staticInstance.value;
        });

        localStorage.setItem('PRModLoaderPersistentData', LZString.compressToUTF16(JSON.stringify(dataToSave)));
    }

    loadPersistentData() {
        const savedData = LZString.decompressFromUTF16(localStorage.getItem('PRModLoaderPersistentData'));
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const key in data) {
                _persistentMap.set(key, new Static(data[key], () => this.savePersistentData()));
            }
        }
    }

    addListener(key, init, listener, persistent = false, scriptId = 0) {
        const staticInstance = this._getStatic(key, init, persistent);
        staticInstance.addListener(listener, scriptId);
    }
}

class StaticManagerForScripts {
    #StaticManager;

    constructor(modid, scriptid) {
        this.modid = modid;
        this.scriptid = scriptid;
        this.#StaticManager = new StaticManager(modid);
    }

    getData(key, init, persistent) {
        return this.#StaticManager.getData(key, init, persistent);
    }

    setData(key, value, persistent) {
        return this.#StaticManager.setData(key, value, persistent);
    }

    getAccess(key, init, persistent) {
        return this.#StaticManager.getAccess(key, init, persistent);
    }

    loadPersistentData() {
        return this.#StaticManager.loadPersistentData();
    }

    addListener(key, init, listener, persistent = false) {
        return this.#StaticManager.addListener(key, init, listener, persistent, this.scriptid);
    }
}
