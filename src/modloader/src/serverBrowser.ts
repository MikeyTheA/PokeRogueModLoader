import { setApi } from "#app/utils.js";
import { LoaderData } from "./main";

export const initServer = () => {
  const currentServer = LoaderData.getData("Api", "https://api.mokerogue.net", true);
  setApi(currentServer);
};

export const showServerBrowser = () => {
  const selectedServer = LoaderData.getData("SelectedServer", "https://api.mokerogue.net");
  const currentServer = LoaderData.getData("Api", "https://api.mokerogue.net", true);
  let serverList = LoaderData.getData("Servers", ["https://api.mokerogue.net"], true) as Array<string>;

  ImGui.Text(`connected: ${currentServer}`);

  ImGui.BeginChild("ServerList", new ImGui.Vec2(0, -ImGui.GetFrameHeightWithSpacing()), true);
  serverList.forEach((server: string, serverorder: number) => {
    if (ImGui.Selectable(`${server}##ServerListSelectables`, selectedServer === server)) {
      LoaderData.setData("SelectedServer", server, false);
    }
    if (ImGui.IsItemActive() && !ImGui.IsItemHovered()) {
      const n_next = serverorder + (ImGui.GetMouseDragDelta(0).y < 0 ? -1 : 1);
      if (n_next >= 0 && n_next < ImGui.ARRAYSIZE(serverList)) {
        serverList[serverorder] = serverList[n_next];
        serverList[n_next] = server;
        ImGui.ResetMouseDragDelta();
        LoaderData.setData("Servers", serverList, true);
      }
    }
  });

  ImGui.EndChild();

  if (ImGui.Button("Connect")) {
    LoaderData.setData("Api", selectedServer, true);
    location.reload();
  }

  ImGui.SameLine();

  if (ImGui.Button("Add")) {
    ImGui.OpenPopup("Add server");
  }

  if (ImGui.BeginPopupModal("Add server", null, ImGui.WindowFlags.AlwaysAutoResize)) {
    ImGui.InputText("Address##ServerAdder", LoaderData.getAccess("AddServer", "https://api.mokerogue.net", false));
    if (ImGui.Button("Add")) {
      const address = LoaderData.getData("AddServer", "https://api.mokerogue.net", false);
      if (address.length > 0 && !serverList.includes(address)) {
        serverList.push(address);
        LoaderData.setData("Servers", serverList, true);
      }
      ImGui.CloseCurrentPopup();
    }
    ImGui.SameLine();
    if (ImGui.Button("Cancel")) {
      ImGui.CloseCurrentPopup();
    }
    ImGui.EndPopup();
  }

  ImGui.SameLine();

  if (ImGui.Button("Delete")) {
    if (selectedServer !== "https://api.mokerogue.net" && serverList.includes(selectedServer)) {
      serverList = serverList.filter(pred => pred !== selectedServer);
      LoaderData.setData("Servers", serverList, true);
    }
  }
};
