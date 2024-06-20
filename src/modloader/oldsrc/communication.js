const currentVersion = '1.0.2';

const ServerIP = '004206900.xyz';

const inQueue = new Set();

const requestInformation = async (endpoint, data, datapoint, json = false) => {
    if (inQueue.has(datapoint)) {
        return;
    }

    inQueue.add(datapoint);
    const address = endpoint.startsWith('/') ? `https://${ServerIP}${endpoint}` : endpoint;

    let responseData = await fetch(address);
    if (json) {
        responseData = await responseData.json();
    } else {
        responseData = await responseData.text();
    }

    if (data && datapoint && responseData) {
        data.setData(datapoint, responseData, false);
    }

    inQueue.delete(datapoint);
};
