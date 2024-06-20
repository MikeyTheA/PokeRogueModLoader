function showMainMenu(env) {
    const { Windows, data, mods } = env;

    ImGui.Text('Originally made by MikeyTheA');

    if (data.getData('latestversionofmodloader', undefined, false) !== undefined && data.getData('latestversionofmodloader', undefined, false) !== currentVersion) {
        ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(255, 0, 0, 255));
        ImGui.Text('OUT OF DATE!!!!');
        ImGui.Text(`Current version: ${currentVersion}\nLatest version: ${data.getData('latestversionofmodloader', undefined, false)}\nUPDATE FROM THE GITHUB REPOSITORY!!`);
        ImGui.PopStyleColor();
    } else if (data.getData('latestversionofmodloader', undefined, false) === undefined) {
        requestInformation('https://raw.githubusercontent.com/MikeyTheA/PokeRogueModLoader/main/version', data, 'latestversionofmodloader', false);
    }

    ImGui.Text('The project is open source on github');
    if (ImGui.SmallButton('https://github.com/MikeyTheA/PokeRogueModLoader')) {
        window.open('https://github.com/MikeyTheA/PokeRogueModLoader');
    }
    ImGui.Text('Join our discord: ');
    ImGui.SameLine();
    if (ImGui.SmallButton('https://discord.gg/JCE5fwfsca')) {
        window.open('https://discord.gg/JCE5fwfsca');
    }

    if (ImGui.CollapsingHeader('Settings')) {
        if (data.getData('WebSocketSuccess', false, false)) {
            ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(0, 255, 0, 255));
        } else {
            ImGui.PushStyleColor(ImGui.ImGuiCol.Text, ImGui.IM_COL32(255, 0, 0, 255));
        }
        ImGui.Checkbox(`External editing`, (value = data.getData('ExternalEditing', false, true)) => {
            const changed = value !== data.getData('ExternalEditing', false, true);
            data.setData('ExternalEditing', value, true);

            if (value && changed) {
                startWS(data, mods);
            } else if (!value && changed) {
                stopWS();
            }

            return value;
        });
        ImGui.PopStyleColor();
    }

    if (ImGui.CollapsingHeader('Windows')) {
        for (const [name, window] of Object.entries(Windows)) {
            if (window.flags.hidden) continue;
            ImGui.Checkbox(`${name}`, window.open);
        }
    }
}
