import { setApi } from "#app/utils.js";
import { LoaderData } from "./main";

export const initServer = () => {
  const currentServer = LoaderData.getData("Api", "https://api.mokerogue.net/", true);
  setApi(currentServer);
};

export const showServerBrowser = () => {
  //const currentServer = LoaderData.getData("Api", "https://api.mokerogue.net/", true);
};
