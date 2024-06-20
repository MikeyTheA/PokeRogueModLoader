const url = 'ws://localhost:5828';

let webSocket;

const handleWSMessage = (event, data, mods) => {
    const eventData = JSON.parse(event.data);
    console.log(eventData);
    if (eventData.type === 'missingmods') {
        webSocket.send(
            JSON.stringify({
                type: 'missingmods',
                data: mods.compress().filter((mod) => eventData.data.includes(mod.id)),
            })
        );
    }

    if (eventData.type === 'deletemod') {
        const mod = mods.mods.filter((mod) => mod.external && mod.name === eventData.data);
        if (mod.length > 0) {
            mods.deleteMod(mod[0].id);
        }
        mods.save();
    }

    if (eventData.type === 'deletescript') {
        //unused
        const mod = mods.mods.filter((mod) => mod.external && mod.name === eventData.data.mod);
        const script = mod.scripts.filter((script) => script.name === eventData.data.script);
        if (mod.length > 0) {
            script.delete();
        }
    }

    if (eventData.type === 'changemod') {
        const mod = mods.mods.find((mod) => mod.external && mod.name === eventData.data.name);
        if (mod) {
            mod.description = eventData.data.description || '';
            mod.author = eventData.data.author || 'Unknown author';
            mod.version = eventData.data.version || '1.0';

            eventData.data.scripts.forEach((script) => {
                const changescript = mod.scripts.find((scriptcheck) => scriptcheck.name === script.name);
                if (changescript) {
                    changescript.toggleable = script.toggleable;
                    changescript.code = script.code;
                    changescript.reload();
                } else {
                    mod.scripts.push(
                        new Script(
                            {
                                toggleable: script.toggleable,
                                name: script.name,
                                code: script.code,
                            },
                            mod
                        )
                    );
                }
            });

            mod.scripts.forEach((script) => {
                if (!eventData.data.scripts.find((scriptcheck) => scriptcheck.name === script.name)) {
                    script.delete();
                }
            });
        } else {
            mods.newMod({
                name: eventData.data.name,
                description: eventData.data.description || '',
                author: eventData.data.author || 'Unknown author',
                version: eventData.data.version || '1.0',
                external: true,
            });
            handleWSMessage(event, data, mods);
        }
        mods.save();
    }
};

const newModWS = (mods) => {
    if (webSocket) {
        webSocket.send(
            JSON.stringify({
                type: 'modlist',
                mods: mods.mods.filter((mod) => mod.external).map((mod) => ({ id: mod.id, name: mod.name })),
            })
        );
    }
};

const startWS = (data, mods) => {
    webSocket = new WebSocket(url);

    webSocket.onopen = () => {
        data.setData('WebSocketSuccess', true, false);
        newModWS(mods);
    };

    webSocket.onerror = () => {
        data.setData('WebSocketSuccess', false, false);
    };

    webSocket.onmessage = (event) => {
        handleWSMessage(event, data, mods);
    };

    webSocket.onclose = () => {
        data.setData('WebSocketSuccess', false, false);
    };
};

const stopWS = () => {
    webSocket.close();
};

const sendWS = (message) => {
    webSocket.send(message);
};
