function showModList(env) {
    const { data, mods } = env;

    const selectedModId = data.getData('selectedModId', undefined, false);

    {
        // Left pane, mod selector
        ImGui.BeginGroup();

        ImGui.BeginChild('ModSelectorPane##ModList', new ImGui.Vec2(140, -ImGui.GetFrameHeightWithSpacing()), true);

        mods.mods.forEach((mod, modorder) => {
            if (ImGui.Selectable(`${mod.name}##ModIdSelectable${mod.id}`, selectedModId === mod.id)) {
                data.setData(`selectedModId`, mod.id, false);
            }
            if (ImGui.IsItemActive() && !ImGui.IsItemHovered()) {
                let n_next = modorder + (ImGui.GetMouseDragDelta(0).y < 0 ? -1 : 1);
                if (n_next >= 0 && n_next < ImGui.ARRAYSIZE(mods.mods)) {
                    mods.mods[modorder] = mods.mods[n_next];
                    mods.mods[n_next] = mod;
                    ImGui.ResetMouseDragDelta();
                    mods.save();
                }
            }
        });

        ImGui.EndChild();
        //ImGui.Button('Load##ModListMod');
        if (ImGui.Button('New##ModListMod')) {
            mods.newMod();
            mods.save();
        }
        ImGui.EndGroup();
    }

    ImGui.SameLine();

    {
        // Right pane, mod info
        ImGui.BeginGroup();
        ImGui.BeginChild('ModView##ModList', new ImGui.Vec2(0, 0));
        const mod = mods.getMod(selectedModId);
        if (mod !== undefined) {
            const mod = mods.getMod(selectedModId);
            ImGui.Text(mod.name);

            ImGui.BeginTabBar('##ModListModOptionsTabBar');

            if (ImGui.BeginTabItem('Details##ModListModOptions')) {
                if (mod.description) {
                    ImGui.TextWrapped(`Description: ${mod.description}`);
                }
                ImGui.Text(`Author: ${mod.author}`);
                ImGui.Text(`Version: ${mod.version}`);
                ImGui.EndTabItem();
            }

            if (ImGui.BeginTabItem('Scripts##ModListModOptions')) {
                ImGui.BeginGroup();

                if (!mod.external && !mod.github && ImGui.SmallButton('New##ModListModOptionsScripts')) {
                    mod.scripts.push(new Script({}, mod));
                    mods.save();
                }

                ImGui.BeginChild('Script list##ModListModOptionsScripts', new ImGui.Vec2(0, 0));
                mod.scripts.forEach((script) => {
                    if (script.toggleable) {
                        ImGui.Checkbox(`${script.name}##script checkbox with the id ${script.id}`, data.getAccess('ModListModOptions ' + selectedModId + ' ScriptsToggle ' + script.id, true, true));
                    } else {
                        ImGui.Checkbox(`${script.name}##script checkbox with the id ${script.id}`, () => {
                            return true;
                        });
                    }
                    if (!mod.external && !mod.github) {
                        ImGui.SameLine();
                        if (ImGui.Button(`Edit##ModListModOptionsScripts${script.id}`)) {
                            data.setData('Edit script Window', true, false);
                            data.setData('Currently editing the script', script.id, false);
                            data.setData('Currently editing the script of mod', selectedModId, false);
                        }
                    }
                });

                ImGui.EndChild();

                ImGui.EndGroup();
                ImGui.EndTabItem();
            }

            if (ImGui.BeginTabItem('Logs##ModListModOptions')) {
                ImGui.BeginGroup();
                ImGui.BeginChild('Mod logs##ModListModOptions', new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()));
                const logs = data.getData(`LogsForMod${mod.id}`, [], false);
                logs.forEach((log, logindex) => {
                    if (log[0] == 'log' && typeof log[1] === 'object') {
                        if (ImGui.TreeNode(`${log[1].constructor.name}##Logs${logindex}`)) {
                            treeObject(log[1], logindex);

                            if (ImGui.TreeNode(`Prototypes##${log[1].constructor.name}${logindex}`)) {
                                let proto = Object.getPrototypeOf(log[1]);
                                while (proto) {
                                    treeObject(proto, logindex);
                                    proto = Object.getPrototypeOf(proto);
                                }
                                ImGui.TreePop();
                            }

                            ImGui.TreePop();
                        }
                    } else {
                        if (log[0] == 'error') {
                            ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(255, 150, 150, 255));
                        }
                        ImGui.Text(String(log[1]));
                        if (log[0] == 'error') {
                            ImGui.PopStyleColor();
                        }
                    }
                });
                ImGui.EndChild();
                if (ImGui.Button('Clear')) {
                    data.setData(`LogsForMod${mod.id}`, [], false);
                }
                ImGui.EndGroup();
                ImGui.EndTabItem();
            }

            ImGui.EndTabBar();
            if (!mod.external && !mod.github) {
                ImGui.SameLine(ImGui.GetWindowContentRegionMax().x - 35);
                if (ImGui.Button('Edit##ModList')) {
                    data.setData('Edit mod Window', true, false);
                    data.setData('Currently editing the mod', selectedModId);
                }
            } else {
                ImGui.SameLine(ImGui.GetWindowContentRegionMax().x - 50);
                ImGui.PushStyleColor(ImGui.ImGuiCol.Button, ImGui.IM_COL32(255, 0, 0, 255));
                ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, ImGui.IM_COL32(220, 20, 20, 255));
                if (ImGui.Button('Remove##ModList')) {
                    mods.deleteMod(mod.id);
                    mods.save();
                }
                ImGui.PopStyleColor();
                ImGui.PopStyleColor();
            }
        }

        ImGui.EndChild();
        ImGui.EndGroup();
    }
}

function showEditMod(env) {
    const { data, mods } = env;

    const modId = data.getData('Currently editing the mod');
    const mod = mods.getMod(modId);
    if (mod !== undefined) {
        ImGui.InputText('Name##EditMod', (value = mod.name) => {
            mod.name = value;
            mods.save();
            return mod.name;
        });

        ImGui.InputText('Author##EditMod', (value = mod.author) => {
            mod.author = value;
            mods.save();
            return mod.author;
        });

        ImGui.InputTextMultiline('Description##EditMod', (value = mod.description) => {
            mod.description = value;
            mods.save();
            return mod.description;
        });

        ImGui.InputText('Version##EditMod', (value = mod.version) => {
            mod.version = value;
            mods.save();
            return mod.version;
        });

        if (ImGui.Button('Make external')) {
            ImGui.OpenPopup('Make mod externally edited?');
        }

        const scriptNames = mod.scripts.map((script) => script.name);
        const uniqueNames = new Set(scriptNames);

        if (mods.mods.filter((m) => m.name === mod.name && m.external).length >= 1) {
            if (ImGui.BeginPopupModal('Make mod externally edited?', null, ImGui.WindowFlags.AlwaysAutoResize)) {
                ImGui.Text('There is already an external mod with this name, rename please!');
                if (ImGui.Button('Close')) {
                    ImGui.CloseCurrentPopup();
                }
                ImGui.EndPopup();
            }
        } else if (scriptNames.length !== uniqueNames.size) {
            if (ImGui.BeginPopupModal('Make mod externally edited?', null, ImGui.WindowFlags.AlwaysAutoResize)) {
                ImGui.Text('There are scripts in your mod that have the same name, rename them before making the mod external!');
                if (ImGui.Button('Close')) {
                    ImGui.CloseCurrentPopup();
                }
                ImGui.EndPopup();
            }
        } else {
            if (ImGui.BeginPopupModal('Make mod externally edited?', null, ImGui.WindowFlags.AlwaysAutoResize)) {
                ImGui.Text('Are you sure you want to make this mod external?');
                ImGui.Text('You will not be able to edit this mod or its scripts in any way from the UI anymore');
                ImGui.Text('Before doing this, make sure you have checked the documentation or looked at a tutorial');
                if (ImGui.Button('Yes')) {
                    mod.external = true;
                    mods.save();
                    data.setData('Edit mod Window', false, false);
                    data.setData('Edit script Window', false, false);
                    newModWS(mods);
                    ImGui.CloseCurrentPopup();
                }
                ImGui.SameLine();
                if (ImGui.Button('No')) {
                    ImGui.CloseCurrentPopup();
                }
                ImGui.EndPopup();
            }
        }

        ImGui.PushStyleColor(ImGui.ImGuiCol.Button, ImGui.IM_COL32(255, 0, 0, 255));
        ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, ImGui.IM_COL32(220, 20, 20, 255));
        if (ImGui.Button('Delete mod')) {
            ImGui.OpenPopup('Delete mod?');
        }
        ImGui.PopStyleColor();
        ImGui.PopStyleColor();

        if (ImGui.BeginPopupModal('Delete mod?', null, ImGui.WindowFlags.AlwaysAutoResize)) {
            ImGui.Text('Are you sure you want to delete this mod?');
            if (ImGui.Button('Yes')) {
                mods.deleteMod(modId);
                mods.save();
                data.setData('Edit mod Window', false, false);
                ImGui.CloseCurrentPopup();
            }
            ImGui.SameLine();
            if (ImGui.Button('No')) {
                ImGui.CloseCurrentPopup();
            }
            ImGui.EndPopup();
        }
    } else {
        ImGui.Text(`not editing any mod\nhow tf did u even get here`);
    }
}

function showEditScript(env) {
    const { data, mods } = env;

    const modId = data.getData('Currently editing the script of mod', undefined);
    const mod = mods.getMod(modId);
    const scriptId = data.getData('Currently editing the script', undefined);
    if (mod === undefined) {
        return;
    }
    const script = mod.scripts.find((scriptData) => scriptData.id === scriptId);
    if (script === undefined) {
        return;
    }

    ImGui.InputText('Name', (value = script.name) => {
        script.name = value;
        mods.save();
        return script.name;
    });

    ImGui.PushStyleColor(ImGui.ImGuiCol.Button, ImGui.IM_COL32(255, 0, 0, 255));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, ImGui.IM_COL32(220, 20, 20, 255));

    ImGui.SameLine(ImGui.GetWindowContentRegionMax().x - 45);
    if (ImGui.Button('Delete')) {
        ImGui.OpenPopup('Delete Script?');
    }

    ImGui.PopStyleColor();
    ImGui.PopStyleColor();

    if (ImGui.BeginPopupModal('Delete Script?', null, ImGui.WindowFlags.AlwaysAutoResize)) {
        ImGui.Text('Are you sure you want to delete this script?');
        if (ImGui.Button('Yes')) {
            script.delete();
            mods.save();
            data.setData('Edit script Window', false, false);
            ImGui.CloseCurrentPopup();
        }
        ImGui.SameLine();
        if (ImGui.Button('No')) {
            ImGui.CloseCurrentPopup();
        }
        ImGui.EndPopup();
    }

    ImGui.Checkbox('Toggleable', (value = script.toggleable) => {
        script.toggleable = value;
        mods.save();
        return script.toggleable;
    });

    ImGui.SameLine();
    if (ImGui.Button('Reload')) {
        data.setData(`LogsForMod${mod.id}`, [], false);
        script.reload();
    }

    const windowSize = ImGui.GetWindowSize();
    const windowPadding = ImGui.GetStyle().WindowPadding;
    const frameHeightWithSpacing = ImGui.GetFrameHeightWithSpacing();

    const newX = Math.max(windowSize.x, ImGui.CalcTextSize(script.code + '').x + windowPadding.x * 4);
    if (newX > windowSize.x) {
        ImGui.SetWindowSize(new ImGui.Vec2(newX, windowSize.y));
    }
    ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(255, 255, 255, 128));
    ImGui.InputTextMultiline(
        '##CodeEditorScriptEditor',
        (value = script.code) => {
            script.code = value;
            mods.save();
            return value;
        },
        65536,
        new ImGui.Vec2(windowSize.x - windowPadding.x * 2, Math.max(windowSize.y - windowPadding.y * 2 - frameHeightWithSpacing * 3, ImGui.CalcTextSize(script.code + '\n\n').y)),
        ImGui.InputTextFlags.AllowTabInput
    );
    ImGui.PopStyleColor();
    ImGui.SameLine();
    codeHighlighting(script.code, 12, 76);
}

const codeEditorTheme = {
    plain: [255, 255, 255, 255],
    cdata: [112, 128, 144, 255],
    comment: [112, 128, 144, 255],
    doctype: [112, 128, 144, 255],
    prolog: [112, 128, 144, 255],
    punctuation: [153, 153, 153, 255],
    boolean: [153, 0, 85, 255],
    constant: [153, 0, 85, 255],
    deleted: [153, 0, 85, 255],
    number: [153, 0, 85, 255],
    property: [153, 0, 85, 255],
    symbol: [153, 0, 85, 255],
    tag: [153, 0, 85, 255],
    attr_name: [102, 153, 0, 255],
    builtin: [102, 153, 0, 255],
    char: [102, 153, 0, 255],
    inserted: [102, 153, 0, 255],
    selector: [102, 153, 0, 255],
    string: [154, 110, 58, 255],
    entity: [154, 110, 58, 255],
    operator: [154, 110, 58, 255],
    url: [154, 110, 58, 255],
    atrule: [0, 119, 170, 255],
    attr_value: [0, 119, 170, 255],
    keyword: [0, 119, 170, 255],
    class_name: [221, 74, 104, 255],
    function: [221, 74, 104, 255],
    important: [238, 153, 0, 255],
    regex: [238, 153, 0, 255],
    variable: [238, 153, 0, 255],
};

function codeHighlighting(code, x, y) {
    const highlightedHTML = Prism.highlight(code, Prism.languages.javascript, 'javascript');
    const lineHeight = ImGui.GetTextLineHeight();

    highlightedHTML.split('\n').forEach((line, index) => {
        const leadingWhitespace = line.match(/^\s*/)[0];

        let tabCount = 0;
        let spaceCount = 0;
        for (let i = 0; i < leadingWhitespace.length; i++) {
            if (leadingWhitespace[i] === '\t') {
                tabCount++;
            } else if (leadingWhitespace[i] === ' ') {
                spaceCount++;
            } else {
                break;
            }
        }
        ImGui.SetCursorPos(new ImGui.Vec2(x + ImGui.CalcTextSize('    '.repeat(tabCount)).x + ImGui.CalcTextSize(' '.repeat(spaceCount)).x, y + index * lineHeight));

        const parser = new DOMParser();
        const doc = parser.parseFromString(line, 'text/html');

        let currentX = x;

        doc.body.childNodes.forEach((node) => {
            const text = node.textContent || '';
            const className = node.className;

            let color = codeEditorTheme['plain'];
            if (className && codeEditorTheme[className.split(' ')[1]]) {
                color = codeEditorTheme[className.split(' ')[1]];
            }

            ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(...color));
            ImGui.SetCursorPos(new ImGui.Vec2(currentX + ImGui.CalcTextSize('    '.repeat(tabCount)).x + ImGui.CalcTextSize(' '.repeat(spaceCount)).x, y + index * lineHeight));
            ImGui.Text(text);
            currentX += ImGui.CalcTextSize(text).x;
            ImGui.PopStyleColor();
        });
    });
}

function treeObject(obj, index, path = '') {
    for (const key of Object.getOwnPropertyNames(obj)) {
        const value = obj[key];
        const fullPath = path + key;
        if (typeof value === 'object' && value !== null) {
            if (ImGui.TreeNode(`${key}##TreeObject${fullPath}${index}`)) {
                treeObject(value, index, fullPath + '.');
                ImGui.TreePop();
            }
        } else {
            ImGui.Text(`${key}: ${value} (${typeof value})`);
        }
    }
}
