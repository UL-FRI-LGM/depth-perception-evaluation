const fs = require('fs');
const path = require('path');
const http = require('http');

process.on('uncaughtException', e => {
    console.error('uncaughtException', e);
});

const databaseRoot = `${__dirname}/database`;

function isUID(string) {
    return /^[0-9A-Fa-f]{32}$/.test(string);
}

function handleVideo(json, request, response) {
    const { sessionID, videoID } = json;
    if (!isUID(sessionID) || !isUID(videoID)) {
        response.end('uid fail');
        console.log('uid fail:' + sessionID + ' ' + videoID);
        return response.end();
    }

    const directoryPath = `${databaseRoot}/${sessionID}/${videoID}`;
    if (fs.existsSync(directoryPath)) {
        console.log(`${directoryPath} already exists`);
        return response.end();
    }
    fs.mkdirSync(directoryPath, { recursive: true });

    const keys = [
        'distance',
    ];

    for (const key of keys) {
        fs.writeFileSync(`${directoryPath}/${key}`, JSON.stringify(json[key]));
    }

    return response.end();
}

function handleDemographic(json, request, response) {
    const { sessionID, age, gender } = json;
    if (!isUID(sessionID)) {
        response.end('uid fail');
        console.log('uid fail:' + sessionID);
        return response.end();
    }

    const directoryPath = `${databaseRoot}/${sessionID}`;
    fs.mkdirSync(directoryPath, { recursive: true });

    const keys = [
        'age',
        'gender',
        'occupation',
        'email',
        'modeling',
        'gaming',
        'vr',
    ];

    for (const key of keys) {
        fs.writeFileSync(`${directoryPath}/${key}`, JSON.stringify(json[key]));
    }

    return response.end();
}

const server = http.createServer((request, response) => {
    if (request.method !== 'POST') {
        response.end();
        return;
    }

    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
        body += chunk;
    });
    request.on('end', e => {
        const json = JSON.parse(body);
        console.log(json);

        switch (json.type) {
            case 'video':
                return handleVideo(json, request, response);
            case 'demographic':
                return handleDemographic(json, request, response);
            default:
                console.log(`unknown message type: ${json.type}`);
                return response.end();
        }
    });
});

const port = process.env.PORT ?? 3001;
server.listen(port);
console.log(`Port: ${port}`);
