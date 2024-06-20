const showModBrowser = (env) => {
    const { data, mods } = env;

    const modsOnGithub = data.getData('modbrowser|modlist', false, false);

    if (modsOnGithub) {
        const selectedMod = data.getData('selectedModInBrowser', undefined, false);

        {
            ImGui.BeginGroup();

            ImGui.PushItemWidth(200);
            ImGui.InputText('##ModBrowserSearchBar', data.getAccess('ModBrowserSearched', '', false));
            ImGui.PopItemWidth();

            ImGui.BeginChild('ModSelectorPane##ModList', new ImGui.Vec2(200, 0), true);

            modsOnGithub.forEach((mod) => {
                if ((mod.name.toLowerCase().includes(data.getData('ModBrowserSearched', '', false).toLowerCase()) || mod.author.toLowerCase().includes(data.getData('ModBrowserSearched', '', false).toLowerCase())) && ImGui.Selectable(`${mod.name} | ${mod.author}##ModUrlSelectable${mod.author}`, selectedMod === mod)) {
                    data.setData(`selectedModInBrowser`, mod, false);
                }
            });

            ImGui.EndChild();
            ImGui.EndGroup();
        }

        ImGui.SameLine();

        if (selectedMod) {
            ImGui.BeginGroup();
            ImGui.BeginChild('ModView##ModList', new ImGui.Vec2(0, 0));

            ImGui.Text(`Name: ${selectedMod.name}`);
            ImGui.Text(`Author: ${selectedMod.author}`);

            const modData = data.getData(`modbrowser|moddata${selectedMod.name}${selectedMod.author}`, undefined, false);

            if (modData) {
                ImGui.Text('URL: ');
                ImGui.SameLine();
                if (ImGui.SmallButton(modData.url)) {
                    window.open(modData.url);
                }
                ImGui.Text(`Version: ${modData.version}`);
                ImGui.Text(`Description: ${modData.description}`);

                if (!data.getData(`modbrowser|${modData.url}|downloading`, false, false) && mods.mods.filter((mod) => mod.id === modData.url).length === 0 && ImGui.Button('Install')) {
                    data.setData(`modbrowser|${modData.url}|downloading`, true, false);
                    modData.scripts.forEach((script) => {
                        requestInformation(script.download_url, data, `scriptdownloads|${modData.url}|${script.name}`);
                    });
                }

                if (data.getData(`modbrowser|${modData.url}|downloading`, false, false)) {
                    const scripts = [];
                    modData.scripts.forEach((script) => {
                        const name = script.name.slice(0, -3);
                        let toggleable = false;

                        if (name.endsWith('.toggle')) {
                            name = name.slice(0, -7);
                            toggleable = true;
                        }
                        const code = data.getData(`scriptdownloads|${modData.url}|${script.name}`, undefined, false);
                        if (!code) {
                            ImGui.Text(`Downloading ${name}`);
                            return;
                        }
                        scripts.push({
                            name: name,
                            toggleable: toggleable,
                            code: code,
                        });
                    });
                    if (scripts.length === modData.scripts.length) {
                        data.setData(`modbrowser|${modData.url}|downloading`, false, false);

                        mods.newMod({
                            name: selectedMod.name,
                            author: selectedMod.author,
                            version: modData.version || '1.0',
                            description: modData.description || '',
                            id: modData.url,
                            scripts: scripts,
                        });
                        mods.save();
                    }
                }
            } else {
                ImGui.Text('Downloading mod information');
                requestInformation(`/mod?name=${selectedMod.name}&author=${selectedMod.author}`, data, `modbrowser|moddata${selectedMod.name}${selectedMod.author}`, true);
            }

            ImGui.EndChild();
            ImGui.EndGroup();
        }
    } else {
        ImGui.Text('Downloading mod list...');
        requestInformation('/mods', data, 'modbrowser|modlist', true);
    }
};
