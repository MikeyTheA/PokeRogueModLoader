class Static {
    constructor(value) {
        this.value = value;
    }
    access = (value = this.value) => (this.value = value);
}

const _static_map = new Map();

function STATIC(key, init) {
    let value = _static_map.get(key);
    if (value === undefined) {
        _static_map.set(key, (value = new Static(init)));
    }
    return value;
}

const HookTypes = ['Phase', 'Handler'];

const HookPhaseTypes = ['Function/Pre', 'Function/Post'];

async function main() {
    await ImGui.default();
    const canvas = document.getElementById('output');
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.scrollWidth * devicePixelRatio;
    canvas.height = canvas.scrollHeight * devicePixelRatio;
    window.addEventListener('resize', () => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.scrollWidth * devicePixelRatio;
        canvas.height = canvas.scrollHeight * devicePixelRatio;
    });

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

    let Windows = {};
    addWindow('Mods', false, showModListWindow);
    addWindow('Phase Spy', false, showPhaseSpyWindow);
    addWindow('UI Handler Viewer', false, showUiHandlerSpyWindow);
    addWindow('New Mod', false, showNewModWindow, true);
    addWindow('New Hook', false, showNewHookWindow, true);

    let Mods = {};

    load();

    window.requestAnimationFrame(_loop);
    function _loop(time) {
        try {
            const battleScene = STATIC('battleScene', undefined);
            const phaseDone = STATIC('phaseDone', false);
            if (window.Phaser && Phaser.Display && Phaser.Display.Canvas && Phaser.Display.Canvas.CanvasPool && Phaser.Display.Canvas.CanvasPool.pool[1] && Phaser.Display.Canvas.CanvasPool.pool[1].parent && Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene) {
                battleScene.value = Phaser.Display.Canvas.CanvasPool.pool[1].parent.scene;
            }

            if (phaseDone.value === false && battleScene.value && battleScene.value.pushPhase) {
                const originalPushPhase = battleScene.value.pushPhase;
                const originalUnshiftPhase = battleScene.value.unshiftPhase;
                const originalOverridePhase = battleScene.value.overridePhase;
                const originalTryReplacePhase = battleScene.value.tryReplacePhase;
                battleScene.value.pushPhase = function (phase, defer) {
                    interceptPhase(phase);
                    originalPushPhase.call(this, phase, defer);
                }.bind(battleScene.value);

                battleScene.value.unshiftPhase = function (phase) {
                    interceptPhase(phase);
                    originalUnshiftPhase.call(this, phase);
                }.bind(battleScene.value);

                battleScene.value.overridePhase = function (phase) {
                    interceptPhase(phase);
                    originalOverridePhase.call(this, phase);
                }.bind(battleScene.value);

                battleScene.value.tryReplacePhase = function (phase) {
                    interceptPhase(phase);
                    originalTryReplacePhase.call(this, phase);
                }.bind(battleScene.value);
                phaseDone.value = true;
            }

            const rect = canvas.getBoundingClientRect();
            IO.MousePos.x = mousePos.x - rect.left;
            IO.MousePos.y = mousePos.y - rect.top;
            ImGui_Impl.NewFrame(time);
            ImGui.NewFrame();

            showMainMenu(true);

            for (const [key, value] of Object.entries(Windows)) {
                ImGui.SetNextWindowSize(new ImGui.Vec2(500, 440), ImGui.Cond.FirstUseEver); // todo - allow changing window size
                if (value.open.value && ImGui.Begin(key, Windows[key].open.access)) {
                    try {
                        value.show();
                    } catch (e) {
                        ImGui.Text(`Error: ${e.message}`);
                    }
                }
            }

            ImGui.End();

            ImGui.EndFrame();

            ImGui.Render();
            const gl = ImGui_Impl.gl;
            gl && gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl && gl.clear(gl.COLOR_BUFFER_BIT);

            ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
            if (battleScene.value) {
                if (IO.WantCaptureKeyboard) {
                    battleScene.value.input.keyboard.enabled = false;
                } else {
                    battleScene.value.input.keyboard.enabled = true;
                }
            }
            if (IO.WantCaptureMouse) {
                canvas.style.pointerEvents = 'auto';
            } else {
                canvas.style.pointerEvents = 'none';
            }

            window.requestAnimationFrame(done ? _done : _loop);
        } catch (e) {
            console.log(e.message);
        }
    }

    function _done() {
        ImGui_Impl.Shutdown();
        ImGui.DestroyContext();
    }

    function addWindow(name, defaultOpen, show, hidden) {
        Windows[name] = {
            open: STATIC(name, defaultOpen),
            hidden: hidden,
        };
        Windows[name]['show'] = () => {
            show(Windows[name].open);
        };
    }

    function addMod(data) {
        Mods[data.name] = data;
    }

    function exportMod(modData) {
        modData = JSON.stringify(Mods);
        modData = LZString.compressToUTF16(modData);
        return modData;
    }

    function save() {
        let modData = JSON.stringify(Mods);
        modData = LZString.compressToUTF16(modData); // compress incase of big scripts
        localStorage.setItem('PRExtraModData', modData);
    }

    function load() {
        let modData = localStorage.getItem('PRExtraModData');
        if (modData) {
            modData = LZString.decompressFromUTF16(modData);
            Mods = JSON.parse(modData);
        }
    }

    function showMainMenu() {
        ImGui.SetNextWindowPos(new ImGui.ImVec2(20, 20), ImGui.Cond.FirstUseEver);
        ImGui.SetNextWindowSize(new ImGui.ImVec2(294, 140), ImGui.Cond.FirstUseEver);

        if (ImGui.Begin('PokeRogue+')) {
            if (ImGui.CollapsingHeader('Settings')) {
            }

            if (ImGui.CollapsingHeader('Windows')) {
                for (const [key, value] of Object.entries(Windows)) {
                    if (!Windows[key]['hidden']) {
                        ImGui.Checkbox(key, Windows[key].open.access);
                    }
                }
            }
        }
    }

    function showModListWindow() {
        //ImGui.SetNextWindowSize(new ImGui.Vec2(500, 440), ImGui.Cond.FirstUseEver)
        if (ImGui.Begin('Mods', Windows['Mods'].open.access)) {
            const selected = STATIC('selected#modlist', null);
            {
                ImGui.BeginGroup();
                ImGui.BeginChild('left pane##ModList', new ImGui.Vec2(140, -ImGui.GetFrameHeightWithSpacing()), true);

                for (const [key, value] of Object.entries(Mods)) {
                    const label = key;
                    if (ImGui.Selectable(label, selected.value === key)) selected.value = key;
                }

                ImGui.EndChild();
                ImGui.BeginChild('buttons row##ModList', new ImGui.Vec2(140, 0));
                ImGui.Button('Load##ModList');
                ImGui.SameLine();
                if (ImGui.Button('New##ModList')) {
                    Windows['New Mod'].open.value = true;
                }
                ImGui.EndChild();
                ImGui.EndGroup();
            }
            ImGui.SameLine();
            {
                ImGui.BeginGroup();
                ImGui.BeginChild('item view##ModList', new ImGui.Vec2(0, 0));
                ImGui.Text(selected.value || ``);
                if (selected.value && ImGui.BeginTabBar('##ModList', ImGui.TabBarFlags.None)) {
                    if (ImGui.BeginTabItem('Details##ModList')) {
                        ImGui.TextWrapped(`Description: ${Mods[selected.value].description}`);
                        ImGui.Text(`Author: ${Mods[selected.value].author}`);
                        if (Mods[selected.value].links?.length > 0) {
                            Mods[selected.value].links.forEach((link) => {
                                ImGui.Text(`${link.title}: ${link.link}`);
                            });
                        }
                        ImGui.EndTabItem();
                    }
                    if (ImGui.BeginTabItem('Hooks##ModList')) {
                        ImGui.BeginChild('hooks##ModList', new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), true);

                        if (Mods[selected.value].hooks) {
                            const Hooks = [[[], []], {}];

                            Mods[selected.value].hooks.forEach((hook) => {
                                if (hook.type === 0) {
                                    Hooks[hook.type][hook.phaseType].push(hook);
                                }
                            });

                            const phaseHooks = Hooks[0];
                            if (Object.values(phaseHooks).some((hookArray) => hookArray.length > 0)) {
                                if (ImGui.TreeNode('Phase Hooks')) {
                                    renderHookTree('Function/Pre', phaseHooks[0], selected);
                                    renderHookTree('Function/Post', phaseHooks[1], selected);
                                    ImGui.TreePop();
                                }
                            }
                        }

                        ImGui.EndChild();

                        ImGui.BeginChild('hooksbuttons##ModList', new ImGui.Vec2(140, 0));
                        if (ImGui.Button('New##ModListHooks')) {
                            console.log(selected.value);
                            const newhookmodbuf = STATIC('newhookmod#ModListNewHook', selected.value);
                            newhookmodbuf.value = selected.value;
                            Windows['New Hook'].open.value = true;
                        }
                        ImGui.EndChild();

                        ImGui.EndTabItem();
                    }
                    if (ImGui.BeginTabItem('UI##ModList')) {
                        ImGui.EndTabItem();
                    }
                    if (ImGui.BeginTabItem('Logs##ModList')) {
                        ImGui.EndTabItem();
                    }
                    ImGui.EndTabBar();
                    ImGui.SameLine(ImGui.GetWindowContentRegionMax().x - 50);
                    if (ImGui.Button('Delete##ModList') && selected.value) {
                        delete Mods[selected.value];
                        selected.value = null;
                        save();
                    }
                    /*ImGui.SameLine(ImGui.GetWindowContentRegionMax().x-90)
                              if (ImGui.Button("Edit##ModList")) {
                                  //TODO
                              }*/
                }
                ImGui.EndChild();
                ImGui.EndGroup();
            }
        }
    }

    function showNewModWindow() {
        ImGui.BeginGroup();
        ImGui.BeginChild('creation##NewMod', new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), false);

        const error = STATIC('error#newmod', undefined);

        const modnamebuf = STATIC('newmodname#newmod', 'Example Mod Name');
        ImGui.InputText('Name##NewMod', modnamebuf.access, 256);

        const modauthorbuf = STATIC('newmodauthor#newmod', 'MikeyTheA');
        ImGui.InputText('Author##NewMod', modauthorbuf.access, 256);

        const moddescbuf = STATIC('newmoddesc#newmod', 'This mod does something cool... sick....!');
        ImGui.InputText('Description##NewMod', moddescbuf.access, 256);

        const modlinksbuf = STATIC('linkamount#newmod', 0);
        ImGui.Text('Links (discord, github, yt tutorial, etc):');
        ImGui.SameLine();
        if (ImGui.SmallButton('+')) {
            modlinksbuf.value += 1;
        }
        ImGui.SameLine();
        if (ImGui.SmallButton('-')) {
            modlinksbuf.value -= 1;
        }

        for (let i = 0; i < modlinksbuf.value; i++) {
            const modlinktitlebuf = STATIC(`linktitle${i}#NewMod`, 'Github');
            const modlinkbuf = STATIC(`link${i}#NewMod`, 'https://github.com/MikeyTheA/');
            ImGui.PushItemWidth(ImGui.GetWindowContentRegionWidth() * 0.35);
            ImGui.InputText(`Title##Link${i}NewMod`, modlinktitlebuf.access, 256);
            ImGui.SameLine();
            ImGui.PushItemWidth(ImGui.GetWindowContentRegionWidth() * 0.35);
            ImGui.InputText(`Link##Link${i}NewMod`, modlinkbuf.access, 256);
        }

        ImGui.EndChild();

        ImGui.BeginChild('buttons row##NewMod', new ImGui.Vec2(0, 0), false);

        if (ImGui.Button('Cancel##NewMod')) {
            Windows['New Mod'].open.value = false;
        }
        ImGui.SameLine();
        if (ImGui.Button('Create##NewMod')) {
            if (modnamebuf.value in Mods) {
                error.value = 'Mod with the same name already exists!';
                return;
            }
            addMod({
                name: modnamebuf.value,
                description: moddescbuf.value,
                author: modauthorbuf.value,
                links: [...Array(modlinksbuf.value).keys()].map((i) => {
                    return {
                        title: STATIC(`linktitle${i}#NewMod`).value,
                        link: STATIC(`link${i}#NewMod`).value,
                    };
                }),
            });
            Windows['New Mod'].open.value = false;
            save();
        }
        if (error.value) {
            ImGui.SameLine();
            ImGui.TextColored(new ImGui.Vec4(1, 0, 0, 1), error.value);
        }

        ImGui.EndChild();

        ImGui.EndGroup();
    }

    function showNewHookWindow() {
        const error = STATIC('error#NewHook', undefined);
        const hooknamebuf = STATIC('newhookname#NewHook', 'Free rerolls');
        ImGui.InputText('Name##NewHook', hooknamebuf.access, 256);
        const hooktoggleablebuf = STATIC('newhooktoggleable#NewHook', true);
        const hooktypebuf = STATIC('newhooktype#NewHook', 0);
        const hookphasetypebuf = STATIC('newhookphasetype#NewHook', 0);
        const phasenamebuf = STATIC('phasehookname#NewHook', 'SelectStarterPhase');
        ImGui.Checkbox('Toggleable##NewHook', hooktoggleablebuf.access, 256);
        ImGui.BeginTabBar('##NewHook', ImGui.TabBarFlags.None);
        if (ImGui.BeginTabItem('Phase Hook##NewHook')) {
            hooktypebuf.value = 0;
            ImGui.InputText('Phase##NewHook', phasenamebuf.access, 256);
            ImGui.BeginChild('phasetypes##NewHook', new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), true);
            if (ImGui.Selectable('Function/Pre##NewHook', hookphasetypebuf.value === 0)) {
                hookphasetypebuf.value = 0;
            }
            if (ImGui.Selectable('Function/Post##NewHook', hookphasetypebuf.value === 1)) {
                hookphasetypebuf.value = 1;
            }
            ImGui.EndChild();
            ImGui.EndTabItem();
        }
        if (ImGui.BeginTabItem('Handler Hook##NewHook')) {
            hooktypebuf.value = 1;
            ImGui.EndTabItem();
        }
        ImGui.EndTabBar();
        ImGui.BeginChild('buttons row##NewHook', new ImGui.Vec2(0, 0), false);
        if (ImGui.Button('Cancel##NewMod')) {
            Windows['New Hook'].open.value = false;
        }
        ImGui.SameLine();
        if (ImGui.Button('Create##NewHook')) {
            const newhookmodbuf = STATIC('newhookmod#ModListNewHook', undefined);
            if (newhookmodbuf.value !== undefined) {
                let found = false;
                Mods[newhookmodbuf.value].hooks.forEach((hook) => {
                    if (hook.name === hooknamebuf.value) {
                        error.value = 'Hook with the same name already exists!';
                        found = true;
                    }
                });
                if (!found) {
                    let newhook = {};
                    if (hooktypebuf.value === 0) {
                        newhook = {
                            name: hooknamebuf.value,
                            toggleable: hooktoggleablebuf.value,
                            type: hooktypebuf.value,
                            phase: phasenamebuf.value,
                            phaseType: hookphasetypebuf.value,
                        };
                    } else {
                        newhook = {
                            name: hooknamebuf.value,
                            toggleable: hooktoggleablebuf.value,
                            type: hooktypebuf.value,
                        };
                    }

                    const hooks = Mods[newhookmodbuf.value].hooks || [];
                    hooks.push(newhook);
                    Mods[newhookmodbuf.value].hooks = hooks;
                    Windows['New Hook'].open.value = false;
                    error.value = undefined;
                }
            }
            save();
        }
        if (error.value) {
            ImGui.SameLine();
            ImGui.TextColored(new ImGui.Vec4(1, 0, 0, 1), error.value);
        }
        ImGui.EndChild();
    }

    function showPhaseSpyWindow() {
        const selected = STATIC('selected#PhaseSpy', undefined);
        const spied = STATIC('spied#PhaseSpy', []);
        ImGui.BeginGroup();
        ImGui.BeginChild('buttons row##PhaseSpy', new ImGui.Vec2(0, ImGui.GetFrameHeightWithSpacing()));
        if (ImGui.Button('Clear##PhaseSpy')) {
            spied.value = [];
        }
        ImGui.EndChild();

        ImGui.BeginChild('list##PhaseSpy', new ImGui.Vec2(0, 120), true);

        spied.value.forEach((phase) => {
            if (ImGui.Selectable(phase.constructor.name, selected.value === phase)) selected.value = phase;
        });

        ImGui.EndChild();
        if (selected.value && ImGui.TreeNode('Properties##PhaseSpy')) {
            treeObject(selected.value);
            ImGui.TreePop();
        }
        if (selected.value && ImGui.TreeNode('Prototypes')) {
            let proto = Object.getPrototypeOf(selected.value);
            while (proto) {
                treeObject(proto);
                proto = Object.getPrototypeOf(proto);
            }
            ImGui.TreePop();
        }
        ImGui.EndGroup();
    }

    function showUiHandlerSpyWindow() {
        const selected = STATIC('selected#HandlerSpy', null);
        const battleScene = STATIC('battleScene', undefined);

        ImGui.BeginChild('list##HandlerSpy', new ImGui.Vec2(0, 120), true);

        if (battleScene.value.ui !== undefined) {
            battleScene.value.ui.handlers.forEach((handler) => {
                if (battleScene.value.ui.mode === handler.mode) {
                    ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(0, 255, 0, 255));
                }
                if (ImGui.Selectable(handler.constructor.name, selected.value === handler)) selected.value = handler;
                if (battleScene.value.ui.mode === handler.mode) {
                    ImGui.PopStyleColor();
                }
            });
        }

        ImGui.EndChild();

        if (selected.value && ImGui.TreeNode('Properties##HandlerSpy')) {
            treeObject(selected.value);
            ImGui.TreePop();
        }
        if (selected.value && ImGui.TreeNode('Prototypes')) {
            let proto = Object.getPrototypeOf(selected.value);
            while (proto) {
                treeObject(proto);
                proto = Object.getPrototypeOf(proto);
            }
            ImGui.TreePop();
        }
    }

    function interceptPhase(phase) {
        const spied = STATIC('spied#PhaseSpy', []);
        spied.value.push(phase);
    }

    function treeObject(obj, path = '') {
        for (const key of Object.getOwnPropertyNames(obj)) {
            const value = obj[key];
            const fullPath = path + key;

            if (typeof value === 'object' && value !== null && key !== 'scene') {
                if (ImGui.TreeNode(`${key}##HandlerSpyPhaseSpyProperties${fullPath}`)) {
                    treeObject(value, fullPath + '.');
                    ImGui.TreePop();
                }
            } else {
                ImGui.Text(`${key}: ${value} (${typeof value})`);
            }
        }
    }

    const renderHookTree = (hookType, hooks, selected) => {
        if (hooks.length > 0) {
            if (ImGui.TreeNode(hookType)) {
                hooks.forEach((hook) => {
                    const label = `${hook.name}`;
                    const toggled = STATIC(`toggled${Mods[selected.value].name}${hook.name}#ModListHooks`, true);
                    if (hook.toggleable) {
                        ImGui.Checkbox(label, toggled.access);
                    } else {
                        ImGui.Text(label);
                    }
                    ImGui.SameLine();
                    if (ImGui.Button(`Delete##${hook.name}`)) {
                        const hookIndex = Mods[selected.value].hooks.indexOf(hook);
                        Mods[selected.value].hooks.splice(hookIndex, 1);
                        save();
                    }
                });
                ImGui.TreePop();
            }
        }
    };
}

main();
