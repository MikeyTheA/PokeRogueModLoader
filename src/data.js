const _staticMap = new Map();
const _persistentMap = new Map();

class Static {
    constructor(value, saveCallback = null) {
        this.value = value;
        this.saveCallback = saveCallback;
    }

    access = (value = this.value) => {
        const changed = this.value !== value;
        this.value = value;
        if (changed && this.saveCallback) {
            this.saveCallback(this.value);
        }
        return this.value;
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
        const staticInstance = this._getStatic(key, value, persistent);
        staticInstance.value = value;
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
}
