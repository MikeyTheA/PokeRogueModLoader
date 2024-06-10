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

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const defaultScriptCode = `
_loop = () => {
    console.log("Hello World!")
}
`

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
        modData = LZString.compressToUTF16(modData); // compress incase of big functions
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
                    if (ImGui.BeginTabItem('Functions##ModList')) {
                        ImGui.BeginGroup()
                        ImGui.BeginChild('functionslist##ModsList', new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), true)
                        if (Mods[selected.value].functions) {
                            for (const [key, value] of Object.entries(Mods[selected.value].functions)) {
                                if(value.toggleable){
                                    const checkboxbuf = STATIC(`ModCheckboxMod${selected.value}Script${key}#Mod`, true)
                                    ImGui.Checkbox(key, checkboxbuf.access)
                                }else{
                                    ImGui.Text(key)
                                }
                                ImGui.SameLine()
                                if(ImGui.Button("Edit")){

                                }
                            }
                        }
                        ImGui.EndChild()
                        ImGui.BeginChild('buttons row functions##ModsList', new ImGui.Vec2(0, 0), false);

                        if (ImGui.Button('New##ModsListfunctions')) {
                            let name = ''
                            while(true){
                                name = ''
                                for (let i = 0; i < 10; i++) {
                                    name += characters.charAt(Math.floor(Math.random() * characters.length));
                                }
                                if (Mods[selected.value].functions === undefined || !(name in Mods[selected.value].functions)) {
                                    break
                                }
                            }

                            if (Mods[selected.value].functions === undefined) {
                                Mods[selected.value].functions = {}
                            }

                            Mods[selected.value].functions[name] = {
                                code: defaultScriptCode,
                                toggleable: true
                            }
                            save()
                        }

                        ImGui.EndChild();
                        ImGui.EndGroup()
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

    function showFunctionEditWindow(){
        const selectedFunction = STATIC('selectedFunction', undefined)
        if(selectedFunction.value !== undefined){

        }
        ImGui.InputTextMultiline('##FunctionEdit')
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
}

main();
