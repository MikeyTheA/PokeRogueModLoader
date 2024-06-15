function showMainMenu(env) {
    const { Windows, data, mods } = env;

    ImGui.Text('Originally made by MikeyTheA\nThe project is open source on github\nhttps://github.com/MikeyTheA/PokeRogueModLoader');
    if (ImGui.Button('Join discord')) {
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
