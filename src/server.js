import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import { promisify } from 'util';
import childProc from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const exec = promisify(childProc.exec);
const converter = path.resolve('src/converter/webp2gif.py');

const app = express();
const port = process.env.PORT;

app.get('/webp2gif', async (req, res) => {
    const originalUrl = req.query.url;
    console.log(`Converting - ${originalUrl}`);
    try {
        let outPath = await getGifPath(originalUrl);
        res.sendFile(outPath);
    } catch (e) {
        console.error(e);
        res.send(e.name + ': ' + e.message);
    }
    return;
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


async function getGifPath(url) {
    let safeName = getImageName(url);
    let outPath = path.resolve('images/out/' + safeName + '.gif');
    if (fs.existsSync(outPath)) {
        console.log('Returning existing gif');
        return outPath;
    }

    console.log(`File ${outPath} not found...`)
    console.log('Trying to download new file');

    const res = await fetch(url);
    const contentType = res.headers.get('Content-Type');
    if (contentType != 'image/webp') {
        throw new Error(`Unsupported Content-Type: '${contentType}'`);
    }
    let inPath = path.resolve('images/in/' + safeName + '.webp');
    await downloadFile(res, inPath);

    console.log('File downloaded to ' + inPath);

    const conversionCommand = `python3 ${converter} ${inPath} ${outPath}`;
    const { stderr } = await exec(conversionCommand);
    if (stderr) {
        throw new Error(`Conversion error: '${stderr}'`);
    }
    fs.unlink(inPath);

    return path.resolve(outPath);

}


function getImageName(url) {
    return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function downloadFile(res, path) {
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
};