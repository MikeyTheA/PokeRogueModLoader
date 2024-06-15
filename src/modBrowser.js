let modsOnGithub = [];
let fetchingModJson = false;

const showModBrowser = (env) => {
    if (modsOnGithub.length > 0) {
        const { data, mods } = env;

        const selectedMod = data.getData('selectedModInBrowser', undefined, false);
        {
            ImGui.BeginGroup();

            ImGui.BeginChild('ModSelectorPane##ModList', new ImGui.Vec2(140, 0), true);

            modsOnGithub.forEach((mod) => {
                if (ImGui.Selectable(`${mod.name}##ModUrlSelectable${mod.full_name}`, selectedMod === mod)) {
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

            const modjson = data.getData(`modbrowser${selectedMod.full_name}modjson`, undefined, false);
            if (modjson) {
                if (modjson === 404) {
                    ImGui.Text(`mod.json not found in the mod`);
                } else {
                    ImGui.Text(`Name: ${selectedMod.name}`);
                    ImGui.Text(`Author: ${selectedMod.owner.login}`);
                    ImGui.Text(`Version: ${modjson.version || '1.0'}`);
                    ImGui.Text(`Description: ${modjson.description || 'No description provided'}`);
                    ImGui.Text(`URL: ${selectedMod.html_url}`);
                    if (!data.getData(`modbrowser${selectedMod.full_name}downloading`, false, false) && mods.mods.filter((mod) => mod.id === selectedMod.html_url).length === 0 && ImGui.Button('Download')) {
                        data.setData(`modbrowser${selectedMod.full_name}downloading`, true, false);
                        const files = data.getData(`modbrowser${selectedMod.full_name}files`, undefined, false);
                        files.forEach((file) => {
                            if (file.name.endsWith('.js')) {
                                downloadScripts(file.download_url, data);
                            }
                        });
                    }
                    if (data.getData(`modbrowser${selectedMod.full_name}downloading`, false, false)) {
                        const scripts = [];
                        const files = data.getData(`modbrowser${selectedMod.full_name}files`, undefined, false);
                        files.forEach((file) => {
                            if (file.name.endsWith('.js')) {
                                const name = file.name.slice(0, -3);
                                let toggleable = false;

                                if (name.endsWith('.toggle')) {
                                    name = name.slice(0, -7);
                                    toggleable = true;
                                }
                                const code = data.getData(`modbrowser${file.download_url}script`, 0, false);
                                if (code === 0) {
                                    ImGui.Text(`Downloading ${name}`);
                                    return;
                                } else if (code === 404) {
                                    ImGui.Text(`Error downloading the script ${name}! Refresh and try again`);
                                    return;
                                }
                                scripts.push({
                                    name: name,
                                    toggleable: toggleable,
                                    code: code,
                                });
                            }
                        });
                        if (scripts.length === files.filter((file) => file.name.endsWith('.js')).length) {
                            data.setData(`modbrowser${selectedMod.full_name}downloading`, false, false);

                            mods.newMod({
                                name: selectedMod.name,
                                author: selectedMod.owner.login,
                                version: modjson.version || '1.0',
                                description: modjson.description || '',
                                id: selectedMod.html_url,
                                scripts: scripts,
                            });
                        }
                    }
                }
            } else {
                ImGui.Text('Downloading mod information');
                getModJson(selectedMod.full_name, data);
            }

            ImGui.EndChild();
            ImGui.EndGroup();
        }
    } else {
        ImGui.Text('Downloading mod list');
    }
};

const getAllModsOnGithub = async () => {
    const url = `https://api.github.com/search/repositories?q=topic:pokeroguemod&per_page=20&page=`;
    const headers = {
        Accept: 'application/vnd.github.v3+json',
    };
    let page = 1;
    let run = true;

    while (run) {
        try {
            const response = await fetch(url + page, { headers });
            if (!response.ok) {
                run = false;
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            modsOnGithub = modsOnGithub.concat(data.items);
            if (data.items.length < 20) {
                run = false;
                break;
            }

            page++;
        } catch (error) {
            run = false;
            console.error(error);
            break;
        }
    }
};
getAllModsOnGithub();

const getModJson = async (fullname, data) => {
    if (fetchingModJson) {
        return;
    }
    try {
        fetchingModJson = true;
        const urlParts = fullname.split('/');
        const owner = urlParts[0];
        const repo = urlParts[1];

        const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/`;
        const response = await fetch(contentsUrl);
        if (!response.ok) {
            fetchingModJson = false;
            throw new Error(`Error fetching repository contents: ${response.status} ${response.statusText}`);
        }
        const contents = await response.json();
        data.setData(`modbrowser${fullname}files`, contents);
        const modJsonFile = contents.find((file) => file.name === 'mod.json');
        if (!modJsonFile) {
            fetchingModJson = false;
            data.setData(`modbrowser${fullname}modjson`, 404);
            return;
        }

        const modJsonUrl = modJsonFile.download_url;
        const modJsonResponse = await fetch(modJsonUrl);
        if (!modJsonResponse.ok) {
            throw new Error(`Error fetching mod.json: ${modJsonResponse.status} ${modJsonResponse.statusText}`);
        }
        const modJsonData = await modJsonResponse.json();

        data.setData(`modbrowser${fullname}modjson`, modJsonData);
        fetchingModJson = false;
    } catch (error) {
        fetchingModJson = false;
        console.error('Error in getModJson:', error);
        return;
    }
};

const downloadScripts = async (script_download_url, data) => {
    if (data.getData(`fetchingScript${script_download_url}`, false, false)) {
        return;
    }
    try {
        data.setData(`fetchingScript${script_download_url}`, true, false);

        const scriptResponse = await fetch(script_download_url);
        if (!scriptResponse.ok) {
            data.setData(`fetchingScript${script_download_url}`, false, false);
            data.setData(`modbrowser${script_download_url}script`, 404);
            throw new Error(`Error fetching mod.json: ${scriptResponse.status} ${scriptResponse.statusText}`);
        }
        const scriptData = await scriptResponse.text();

        data.setData(`modbrowser${script_download_url}script`, scriptData);
        data.setData(`fetchingScript${script_download_url}`, false, false);
    } catch (error) {
        data.setData(`fetchingScript${script_download_url}`, false, false);
        console.error('Error in downloading scripts:', error);
        return;
    }
};
