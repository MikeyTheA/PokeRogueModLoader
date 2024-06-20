import fs from 'fs';
import { WebSocketServer } from 'ws';

class fileHandler {
    constructor() {
        this.start();
    }

    start = async () => {
        if (!(await fs.existsSync('mods/'))) {
            await fs.mkdirSync('mods');
        }

        this.wss = new WebSocketServer({
            port: 5828,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    // See zlib defaults.
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3,
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024,
                },
                // Other options settable:
                clientNoContextTakeover: true, // Defaults to negotiated value.
                serverNoContextTakeover: true, // Defaults to negotiated value.
                serverMaxWindowBits: 10, // Defaults to negotiated value.
                // Below options specified as default values.
                concurrencyLimit: 10, // Limits zlib concurrency for perf.
                threshold: 1024, // Size (in bytes) below which messages
                // should not be compressed if context takeover is disabled.
            },
        });

        this.wss.on('connection', async (ws) => {
            // yes, we're doing it everytime since i want this released quick, will split in a future update

            const sendInvalidMod = (name, description) => {
                ws.send(
                    JSON.stringify({
                        type: 'modchange',
                        data: {
                            name: name,
                            description: description,
                            author: 'INVALID MOD',
                            scripts: [],
                        },
                    })
                );
            };

            const reconstructModAndSend = async (name) => {
                if (!(await fs.existsSync(`mods/${name}/mod.json`))) {
                    return sendInvalidMod(name, 'no mod.json found');
                }
                let data = await fs.readFileSync(`mods/${name}/mod.json`);
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return sendInvalidMod(name, 'invalid json in mod.json');
                }

                data.name = name;
                data.scripts = [];
                const files = fs.readdirSync(`mods/${name}`);
                for (let script of files) {
                    if (script.endsWith('.js')) {
                        let scriptname = script.slice(0, -3);
                        let toggleable = false;

                        if (scriptname.endsWith('.toggle')) {
                            scriptname = scriptname.slice(0, -7);
                            toggleable = true;
                        }

                        const code = await fs.readFileSync(`mods/${name}/${script}`, 'utf-8');
                        data.scripts.push({
                            name: scriptname,
                            toggleable: toggleable,
                            code: code,
                        });
                    }
                }

                ws.send(
                    JSON.stringify({
                        type: 'changemod',
                        data: data,
                    })
                );
            };

            const modsWatcher = fs.watch('mods', async (event, filename) => {
                console.log(event, filename);
                if (event === 'rename' && !(await fs.existsSync(`mods/${filename}`))) {
                    ws.send(
                        JSON.stringify({
                            type: 'deletemod',
                            data: filename,
                        })
                    );
                } else if (event === 'rename') {
                    watchers.push(
                        fs.watch(`mods/${filename}`, async (event, filename) => {
                            reconstructModAndSend(filename);
                        })
                    );
                    reconstructModAndSend(filename);
                }

                if (event === 'change') {
                    reconstructModAndSend(filename);
                }
            });

            const watchers = [];

            (await fs.readdirSync('mods/')).forEach((mod) => {
                watchers.push(
                    fs.watch(`mods/${mod}`, async (event, filename) => {
                        reconstructModAndSend(mod);
                    })
                );
                reconstructModAndSend(mod);
            });

            ws.on('error', console.error);

            ws.on('close', () => {
                modsWatcher.close();
                watchers.forEach((watcher) => {
                    watcher.close();
                });
            });

            ws.on('message', async (data) => {
                data = data.toString(); // from buf
                data = JSON.parse(data);
                console.log(data);
                if (data.type === 'modlist') {
                    const mods = await fs.readdirSync('mods/');
                    const missingMods = data.mods.filter((mod) => !mods.includes(mod.name)).map((mod) => mod.id);
                    if (missingMods.length > 0) {
                        ws.send(JSON.stringify({ type: 'missingmods', data: missingMods }));
                    }
                } else if (data.type === 'missingmods') {
                    data.data.forEach(async (mod) => {
                        await fs.mkdirSync(`mods/${mod.name}`);
                        await fs.writeFileSync(
                            `mods/${mod.name}/mod.json`,
                            JSON.stringify(
                                {
                                    description: mod.description,
                                    version: mod.version,
                                    author: mod.author,
                                },
                                null,
                                4
                            )
                        );
                        mod.scripts.forEach(async (script) => {
                            await fs.writeFileSync(`mods/${mod.name}/${script.name}${script.toggleable ? '.toggle' : ''}.js`, script.code);
                        });
                    });
                }
            });
        });
    };
}

const files = new fileHandler();
