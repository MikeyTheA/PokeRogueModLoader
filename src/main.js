async function main() {
    // Utility Setup
    const data = new StaticManager();
    const Windows = {};
    const mods = new ModsHandler({ data, addWindow, Windows });

    data.loadPersistentData();

    addWindow('PokeRogue+', showMainMenu, {
        open: true,
        hidden: true,
        noClose: true,
    });

    addWindow('Installed mods', showModList, {
        hidden: false,
        noClose: false,
        persistentOpen: true,
    });

    addWindow('Mod browser', showModBrowser, {
        hidden: false,
        noClose: false,
        persistentOpen: true,
    });

    addWindow('Edit mod', showEditMod, {
        open: false,
        hidden: true,
        noClose: false,
        initialWidth: 200,
        initialHeight: 200,
        persistentOpen: false,
    });

    addWindow('Edit script', showEditScript, {
        open: false,
        hidden: true,
        noClose: false,
        initialWidth: 200,
        initialHeight: 200,
        persistentOpen: false,
    });

    mods.load();
    // ImGui Setup
    await ImGui.default();

    if (data.getData('ExternalEditing', false, true)) {
        startWS(data, mods);
    }

    const canvas = document.getElementById('output');

    const resize = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.scrollWidth * devicePixelRatio;
        canvas.height = canvas.scrollHeight * devicePixelRatio;
    };
    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('visibilitychange', resize);

    ImGui.CreateContext();
    ImGui_Impl.Init(canvas);

    ImGui.StyleColorsDark();
    const IO = ImGui.GetIO();

    let done = false;

    let mousePos = { x: 0, y: 0 };
    document.addEventListener('mousemove', (event) => {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;
    });

    window.requestAnimationFrame(_loop);

    function _loop(time) {
        try {
            // Attempt to set up hooking
            const battleScene = getBattleScene();
            if (data.getData('phaseHooksDone', false, false) === false && battleScene !== undefined && battleScene.pushPhase) {
                const originalPushPhase = battleScene.pushPhase;
                const originalUnshiftPhase = battleScene.unshiftPhase;
                const originalOverridePhase = battleScene.overridePhase;
                const originalTryReplacePhase = battleScene.tryReplacePhase;
                battleScene.pushPhase = function (phase, defer) {
                    interceptPhase(phase);
                    originalPushPhase.call(this, phase, defer);
                }.bind(battleScene);

                battleScene.unshiftPhase = function (phase) {
                    interceptPhase(phase);
                    originalUnshiftPhase.call(this, phase);
                }.bind(battleScene);

                battleScene.overridePhase = function (phase) {
                    interceptPhase(phase);
                    originalOverridePhase.call(this, phase);
                }.bind(battleScene);

                battleScene.tryReplacePhase = function (phase) {
                    interceptPhase(phase);
                    originalTryReplacePhase.call(this, phase);
                }.bind(battleScene);
                data.setData('phaseHooksDone', true, false);
            }

            // Set up frame
            const rect = canvas.getBoundingClientRect();
            IO.MousePos.x = mousePos.x - rect.left; // For WantCaptureMouse to work
            IO.MousePos.y = mousePos.y - rect.top;
            ImGui_Impl.NewFrame(time);
            ImGui.NewFrame();

            //Windows
            for (const [key, value] of Object.entries(Windows)) {
                ImGui.SetNextWindowSize(new ImGui.Vec2(value.flags.initialWidth, value.flags.initialHeight), ImGui.Cond.FirstUseEver);
                if (value.open() && ImGui.Begin(key, (!value.flags.noClose && value.open) || undefined)) {
                    try {
                        if (value.flags.scriptId === 0) {
                            value.show({ data, mods, Windows });
                        } else {
                            value.show();
                        }
                    } catch (e) {
                        ImGui.TextColored(new ImGui.ImVec4(1.0, 0.0, 0.0, 1.0), 'error: ');
                        ImGui.SameLine();
                        ImGui.Text(e.message);
                    }
                    ImGui.End();
                }
            }

            mods.mods.forEach((mod) => {
                mod.scripts.forEach((script) => {
                    const toggled = data.getData('ModListModOptions ' + mod.id + ' ScriptsToggle ' + script.id, true, true);
                    if (script.toggled !== toggled) {
                        script.toggled = toggled;
                        script.sandbox.sandboxWindow.toggled = toggled;
                        if (script.sandbox.sandboxWindow.onToggle) {
                            script.sandbox.sandboxWindow.onToggle(toggled);
                        }
                    }

                    if (script.sandbox.sandboxWindow.update) {
                        script.sandbox.sandboxWindow.update();
                    }
                });
            });

            // ImGui ending

            ImGui.EndFrame();

            ImGui.Render();
            const gl = ImGui_Impl.gl;
            gl && gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl && gl.clear(gl.COLOR_BUFFER_BIT);

            ImGui_Impl.RenderDrawData(ImGui.GetDrawData());

            if (battleScene !== false && battleScene.input) {
                if (IO.WantCaptureKeyboard) {
                    battleScene.input.keyboard.enabled = false;
                } else {
                    battleScene.input.keyboard.enabled = true;
                }
            }

            if (IO.WantCaptureMouse) {
                // allow interacting with ImGui and also PokeRogue
                canvas.style.pointerEvents = 'auto';
            } else {
                canvas.style.pointerEvents = 'none';
            }

            window.requestAnimationFrame(done ? _done : _loop);
        } catch (e) {
            console.log(e);
        }
    }

    function _done() {
        ImGui_Impl.Shutdown();
        ImGui.DestroyContext();
    }

    function addWindow(name, show, flags = {}, scriptId) {
        Windows[name] = {
            open: data.getAccess(name + ' Window', flags.open === true || false, flags.persistentOpen === true || false),
            show: show,
            flags: {
                open: flags.open || false,
                persistentOpen: flags.persistentOpen || true,
                hidden: flags.hidden || false,
                noClose: flags.noClose || false,
                initialWidth: flags.initialWidth || 500,
                initialHeight: flags.initialHeight || 440,
                scriptId: scriptId || 0,
            },
        };
    }

    function getBattleScene() {
        if (window.Phaser && Phaser.Display && Phaser.Display.Canvas && Phaser.Display.Canvas.CanvasPool && Phaser.Display.Canvas.CanvasPool.pool[1] && Phaser.Display.Canvas.CanvasPool.pool[1].parent && Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene) {
            return Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene;
        }
        return false;
    }

    function interceptPhase(phase) {
        const name = phase.constructor.name;

        mods.mods.forEach((mod) => {
            mod.scripts.forEach((script) => {
                if (typeof script.sandbox.sandboxWindow.onPhasePush === 'function') {
                    script.sandbox.sandboxWindow.onPhasePush(phase);
                }
            });
        });

        mods.mods.forEach((mod) => {
            mod.scripts.forEach((script) => {
                for (const [phaseTarget, funcs] of Object.entries(script.hooks)) {
                    funcs.forEach((func) => {
                        if (phaseTarget === name) {
                            try {
                                func(phase);
                            } catch (e) {
                                const logs = data.getData(`LogsForMod${mod.id}`, [], false);
                                logs.push(['error', e.message]);
                                data.setData(`LogsForMod${mod.id}`, logs);
                            }
                        }
                    });
                }
            });
        });
    }
}

main();
