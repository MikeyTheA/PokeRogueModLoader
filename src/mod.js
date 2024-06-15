class ModsHandler {
    constructor(env) {
        this.data = env.data;
        this.addWindow = env.addWindow;
        this.Windows = env.Windows;
        this.mods = [];
    }

    newMod(data) {
        const mod = new Mod(data, this.data, this.addWindow, this.Windows, this);
        this.mods.push(mod);
    }

    deleteMod(id) {
        const mod = this.getMod(id);
        if (mod) {
            mod.scripts.forEach((script) => script.delete());
            this.mods = this.mods.filter((mod) => mod.id !== id);
        }
    }

    getMod(id) {
        return this.mods.find((mod) => mod.id === id);
    }

    save() {
        const mods = this.compress();
        localStorage.setItem('PRModLoaderMODS', LZString.compressToUTF16(JSON.stringify(mods)));
        return true;
    }

    compress() {
        const mods = this.mods.map((mod) => ({
            id: mod.id,
            name: mod.name,
            description: mod.description,
            author: mod.author,
            external: mod.external,
            version: mod.version,
            scripts: mod.scripts.map((script) => ({
                id: script.id,
                name: script.name,
                code: script.code,
                toggleable: script.toggleable,
            })),
        }));
        return mods;
    }

    load() {
        const mods = LZString.decompressFromUTF16(localStorage.getItem('PRModLoaderMODS'));
        if (mods) {
            const parsedMods = JSON.parse(mods);
            this.mods = parsedMods.map((modData) => new Mod(modData, this.data, this.addWindow, this.Windows, this));
        }
    }
}

class Mod {
    constructor(data = {}, dataConfig, addWindow, Windows, mods) {
        this.dataConfig = dataConfig;
        this.id = data.id || uuid.v4();
        this.name = data.name || 'Unnamed mod';
        this.description = data.description || '';
        this.author = data.author || 'Unknown author';
        this.addWindow = addWindow;
        this.Windows = Windows;
        this.version = data.version || '1.0';
        this.mods = mods;

        this.external = data.external || false;
        this.github = this.id.startsWith('https://github.com/');
        this.scripts = (data.scripts || []).map((scriptData) => new Script(scriptData, this));
    }
}

class Script {
    constructor(data = {}, mod) {
        this.id = data.id || uuid.v4();
        this.name = data.name || 'Unnamed script';
        this.code = data.code || 'print("Hello world!")';
        this.toggleable = data.toggleable || false;
        this.mod = mod;
        this.toggled = this.mod.dataConfig.getData('ModListModOptions ' + this.mod.id + ' ScriptsToggle ' + this.id, true, true);
        this.hooks = {};
        this.data = new StaticManagerForScripts(this.mod.id, this.id);

        this.sandbox = new Sandbox({
            ImGui: ImGui,
            //log: console.log,
            error: (e) => {
                const logs = this.mod.dataConfig.getData(`LogsForMod${this.mod.id}`, [], false);
                let message = '';
                if (typeof e == 'string') {
                    message = e;
                } else {
                    message = e.message;
                    if (e.stack) {
                        e.stack
                            .split('\n')
                            .slice(1)
                            .map((r) => r.match(/\((?<file>.*):(?<line>\d+):(?<pos>\d+)\)/))
                            .forEach((r) => {
                                if (r && r.groups && r.groups.file.substr(0, 8) !== 'internal') {
                                    const { file, line, pos } = r.groups;
                                    message += ` @ ${line}:${pos}`;
                                }
                            });
                    }
                }
                logs.push(['error', message]);
                this.mod.dataConfig.setData(`LogsForMod${this.mod.id}`, logs);
            },
            print: (msg) => {
                const logs = this.mod.dataConfig.getData(`LogsForMod${this.mod.id}`, [], false);
                logs.push(['log', msg]);
                this.mod.dataConfig.setData(`LogsForMod${this.mod.id}`, logs);
            },
            getBattleScene: () => {
                if (window.Phaser && Phaser.Display && Phaser.Display.Canvas && Phaser.Display.Canvas.CanvasPool && Phaser.Display.Canvas.CanvasPool.pool[1] && Phaser.Display.Canvas.CanvasPool.pool[1].parent && Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene) {
                    return Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene;
                }
                return false;
            },
            getHandler: (name) => {
                if (window.Phaser && Phaser.Display && Phaser.Display.Canvas && Phaser.Display.Canvas.CanvasPool && Phaser.Display.Canvas.CanvasPool.pool[1] && Phaser.Display.Canvas.CanvasPool.pool[1].parent && Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene) {
                    const battleScene = Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene;
                    if (battleScene.ui && battleScene.ui.handlers) {
                        const handlers = battleScene.ui.handlers;

                        for (const handler of handlers) {
                            if (handler.constructor.name === name) {
                                return handler;
                            }
                        }
                    }
                }
                return false;
            },
            addWindow: (name, show, flags) => {
                this.mod.addWindow(name, show, flags, this.id);
            },
            data: this.data,
            globalData: new StaticManagerForScripts('global', this.id),
            hook: (phase, func) => {
                if (this.hooks[phase] === undefined) {
                    this.hooks[phase] = [];
                }
                this.hooks[phase].push(func);
            },
            toggled: this.toggled,
            getInstalledMods: () => {
                return this.mod.mods.mods.map((mod) => ({
                    name: mod.name,
                    version: mod.version,
                    author: mod.author,
                }));
            },
        });

        this.reload();
    }

    clean() {
        if (this.sandbox.sandboxWindow.cleanup) {
            this.sandbox.sandboxWindow.cleanup();
        }

        this.sandbox.sandboxWindow.cleanup = undefined;
        this.sandbox.sandboxWindow.update = undefined;
        this.sandbox.sandboxWindow.onToggle = undefined;
        this.sandbox.sandboxWindow.onPhasePush = undefined;

        this.hooks = {};

        for (const [key, value] of Object.entries(this.mod.Windows)) {
            if (value.flags.scriptId === this.id) {
                this.mod.Windows[key] = undefined;
                delete this.mod.Windows[key];
            }
        }

        const removeListeners = (map) => {
            for (const [fullKey, staticInstance] of map.entries()) {
                if (staticInstance.listeners[this.id]) {
                    delete staticInstance.listeners[this.id];
                }
            }
        };

        removeListeners(_staticMap);
        removeListeners(_persistentMap);
    }

    reload() {
        this.clean();

        this.sandbox.eval(this.code);
    }

    delete() {
        this.clean();
        this.sandbox.destroy();
        this.mod.scripts = this.mod.scripts.filter((script) => script.id !== this.id);
    }
}
