import { LoaderData, modsHandler } from './main';

export const showModList = () => {
    const selectedModId = LoaderData.getData('selectedModId', undefined, false);

    {
        // Left pane, mod selector
        ImGui.BeginGroup();

        ImGui.BeginChild('ModSelectorPane##ModList', new ImGui.Vec2(140, -ImGui.GetFrameHeightWithSpacing()), true);

        modsHandler.mods.forEach((mod, modorder) => {
            if (ImGui.Selectable(`${mod.name}##ModIdSelectable${mod.id}`, selectedModId === mod.id)) {
                LoaderData.setData(`selectedModId`, mod.id, false);
            }
            if (ImGui.IsItemActive() && !ImGui.IsItemHovered()) {
                let n_next = modorder + (ImGui.GetMouseDragDelta(0).y < 0 ? -1 : 1);
                if (n_next >= 0 && n_next < ImGui.ARRAYSIZE(modsHandler.mods)) {
                    modsHandler.mods[modorder] = modsHandler.mods[n_next];
                    modsHandler.mods[n_next] = mod;
                    ImGui.ResetMouseDragDelta();
                    modsHandler.save();
                }
            }
        });

        ImGui.EndChild();
        if (ImGui.Button('Import##ModListMod')) {
            modsHandler.addMod();
        }
        ImGui.SameLine();
        if (ImGui.Button('Export##ModListMod')) {
        }
        ImGui.EndGroup();
    }

    ImGui.SameLine();

    {
        // Right pane, mod info
        ImGui.BeginGroup();
        ImGui.BeginChild('ModView##ModList', new ImGui.Vec2(0, 0));
        const mod = modsHandler.getMod(selectedModId);
        if (mod !== undefined) {
            ImGui.Text(mod.name);

            ImGui.BeginTabBar('##ModListModOptionsTabBar');

            if (ImGui.BeginTabItem('Details##ModListModOptions')) {
                if (mod.description) {
                    ImGui.TextWrapped(`Description: ${mod.description}`);
                }
                ImGui.Text(`Author: ${mod.author}`);
                ImGui.Text(`Version: ${mod.version}`);

                if (mod.github) {
                    ImGui.Text('URL: ');
                    ImGui.SameLine();
                    if (ImGui.SmallButton(mod.id)) {
                        window.open(mod.id as string);
                    }

                    const fullname = mod.id.replace('https://github.com/', '').split('/');
                    const author = fullname[0];
                    const name = fullname[1];

                    const modData = LoaderData.getData(`modbrowser|moddata${name}${author}`, undefined, false);

                    if (modData) {
                        ImGui.Text(`Newest version: ${modData.version}`);

                        if (modData.version !== mod.version && !LoaderData.getData(`modbrowser|${modData.url}|downloading`, false, false) && ImGui.Button('Update')) {
                            LoaderData.setData(`modbrowser|${modData.url}|downloading`, true, false);
                            modData.scripts.forEach((script) => {
                                //requestInformation(script.download_url, LoaderData, `scriptdownloads2|${modData.url}|${script.name}`);
                            });
                        }

                        if (LoaderData.getData(`modbrowser|${modData.url}|downloading`, false, false)) {
                            const scripts = [];
                            modData.scripts.forEach((script) => {
                                let name = script.name.slice(0, -3);

                                if (name.endsWith('.toggle')) {
                                    name = name.slice(0, -7);
                                }
                                const code = LoaderData.getData(`scriptdownloads2|${modData.url}|${script.name}`, undefined, false);
                                if (!code) {
                                    ImGui.Text(`Downloading ${name}`);
                                    return;
                                }
                                scripts.push({
                                    name: name,
                                    code: code,
                                });
                            });
                            if (scripts.length === modData.scripts.length) {
                                LoaderData.setData(`modbrowser|${modData.url}|downloading`, false, false);

                                mod.description = modData.description || '';
                                mod.version = modData.version || '1.0';

                                scripts.forEach((script) => {
                                    const changescript = mod.scripts.find((scriptcheck) => scriptcheck.name === script.name);
                                    if (changescript) {
                                        changescript.code = script.code;
                                        changescript.reload();
                                    } else {
                                        mod.addScript(script);
                                    }
                                });

                                mod.scripts.forEach((script) => {
                                    if (!scripts.find((scriptcheck) => scriptcheck.name === script.name)) {
                                        script.delete();
                                    }
                                });
                                modsHandler.save();
                            }
                        }
                    } else {
                        ImGui.Text('Downloading mod information');
                        //requestInformation(`/mod?name=${name}&author=${author}`, data, `modbrowser|moddata${name}${author}`, true);
                    }
                }
                ImGui.EndTabItem();
            }

            if (ImGui.BeginTabItem('Scripts##ModListModOptions')) {
                ImGui.BeginGroup();

                ImGui.BeginChild('Script list##ModListModOptionsScripts', new ImGui.Vec2(0, 0));
                mod.scripts.forEach((script) => {
                    ImGui.Text(`${script.name}`);
                    ImGui.SameLine();
                    if (ImGui.SmallButton('Peek')) {
                        LoaderData.setData('selectedModIdShowScript', mod.id);
                        LoaderData.setData('selectedScriptIdShowScript', script.id);
                        LoaderData.setData(`WindowOpenStatescriptpeeker`, true);
                    }
                });

                ImGui.EndChild();

                ImGui.EndGroup();
                ImGui.EndTabItem();
            }

            if (ImGui.BeginTabItem('Logs##ModListModOptions')) {
                ImGui.BeginGroup();
                ImGui.BeginChild('Mod logs##ModListModOptions', new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), true);
                const logs = LoaderData.getData(`LogsForMod${mod.id}`, [], false);
                logs.forEach((log, logindex) => {
                    if (log[0] == 'log' && typeof log[1] === 'object') {
                        if (ImGui.TreeNode(`${log[1].constructor.name}##Logs${logindex}`)) {
                            /*treeObject(log[1], logindex);

                            if (ImGui.TreeNode(`Prototypes##${log[1].constructor.name}${logindex}`)) {
                                let proto = Object.getPrototypeOf(log[1]);
                                while (proto) {
                                    treeObject(proto, logindex);
                                    proto = Object.getPrototypeOf(proto);
                                }
                                ImGui.TreePop();
                            }*/

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
                    LoaderData.setData(`LogsForMod${mod.id}`, [], false);
                }
                ImGui.EndGroup();
                ImGui.EndTabItem();
            }

            ImGui.EndTabBar();
        }

        ImGui.EndChild();
        ImGui.EndGroup();
    }
};

export const showScript = () => {
    const selectedModId = LoaderData.getData('selectedModIdShowScript', undefined, false);
    const selectedScriptId = LoaderData.getData('selectedScriptIdShowScript', undefined, false);

    if (selectedModId && selectedScriptId) {
        const mod = modsHandler.getMod(selectedModId);
        if (mod) {
            const script = mod.scripts.find((scriptsearch) => scriptsearch.id === selectedScriptId);
            if (script) {
                const formatted = js_beautify(script.code, { indent_size: 2, space_in_empty_paren: true });
                ImGui.Text(formatted);
            }
        }
    }
};
