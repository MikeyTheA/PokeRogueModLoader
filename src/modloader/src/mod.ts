import { LoaderData } from './main';

export type ModData = {
    id?: String;
    name?: String;
    description?: String;
    author?: String;
    version?: Number;
    scripts?: Array<ScriptData>;
};

export type ScriptData = {
    id?: String;
    name?: String;
    code?: String;
};

export class ModsHandler {
    public mods: Array<Mod>;

    constructor() {
        this.mods = [];
        this.load();
    }

    addMod(data: ModData = {}) {
        const mod = new Mod(data, this);
        this.mods.push(mod);
        this.save();
    }

    deleteMod(id: String) {
        const mod = this.getMod(id);
        if (mod) {
            mod.delete();
            return true;
        } else {
            return false;
        }
    }

    getMod(id: String) {
        return this.mods.find((mod) => mod.id === id);
    }

    save() {
        const mods = this.compress();
        localStorage.setItem('MokeRogueMods', LZString.compressToUTF16(JSON.stringify(mods)));
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
        const mods = LZString.decompressFromUTF16(localStorage.getItem('MokeRogueMods'));
        if (mods) {
            const parsedMods: Array<ModData> = JSON.parse(mods);
            parsedMods.map((modData) => this.addMod(modData));
        }
    }
}

class Mod {
    public id: String;
    public name: String;
    public description: String;
    public author: String;
    public version: Number;
    public scripts: Array<Script>;
    public modsHandler: ModsHandler;

    public github: Boolean;

    constructor(data: ModData, modsHandler: ModsHandler) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name || 'Unnamed mod';
        this.description = data.description || '';
        this.author = data.author || 'Unknown author';
        this.version = data.version || 1;
        this.modsHandler = modsHandler;

        this.github = this.id.startsWith('https://github.com/');
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

    deleteScript(id: String) {
        this.scripts.find((script) => script.id !== id).delete();
    }
}

class Script {
    public id: String;
    public name: String;
    private _code: String;
    public hooks: Object;
    public mod: Mod;

    constructor(data: ScriptData, mod: Mod) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name || 'Unnamed script';
        this.code = data.code || 'print("Hello world!")';
        this.hooks = {};
        this.mod = mod;
    }

    reload() {
        this.clean();
    }

    clean() {}

    delete() {
        this.clean();
        this.mod.scripts = this.mod.scripts.filter((script) => script.id !== this.id);
        this.mod.modsHandler.save();
    }

    set code(newCode: String) {
        this._code = newCode;
    }

    get code() {
        return this._code;
    }
}
