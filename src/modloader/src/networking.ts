import { LoaderData } from './main';

const ServerIP = 'modapi.mokerogue.net';
const inQueue = new Set();

export const requestInformation = async (url: string, datapoint: string, json: boolean = true, status: boolean = false) => {
    if (inQueue.has(datapoint)) {
        return;
    }

    inQueue.add(datapoint);
    const address = url.startsWith('/') ? `https://${ServerIP}${url}` : url;

    const responseData = await fetch(address);

    if (json) {
        const data = await responseData.json();
        if (data && datapoint && responseData) {
            if (status) {
                LoaderData.setData(datapoint, { ...data, status: responseData.status }, false);
            } else {
                LoaderData.setData(datapoint, data, false);
            }

        }
    } else {
        const data = await responseData.text();
        if (data && datapoint && responseData) {
            LoaderData.setData(datapoint, data, false);
        }
    }

    inQueue.delete(datapoint);
};
