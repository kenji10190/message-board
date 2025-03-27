import http from "http";
import fs from "fs";
import ejs from "ejs";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const partialFile = path.join(__dirname, "data-item.ejs");

const indexPage = fs.readFileSync("./index.ejs", "utf-8");
const loginPage = fs.readFileSync("./login.ejs", "utf-8");

const maxMessages = 10;
const messageFile = "myData.txt";
let messageData;

async function readMessages(fName){
    try{
        const data = await readFile(fName, "utf-8");
        return data.split("\n");
    } catch (err) {
        console.log("error: " + err);
    }
};

async function init(){
    messageData = await readMessages(messageFile);
}

init();

const server = http.createServer(handleRequest);
server.listen(3000);
console.log("Start server...");

function handleRequest(req, res){
    const url = new URL(req.url, `http://${req.headers.host}`);
    switch (url.pathname) {
        case "/":
            handleIndex(req, res);
            break;
    
        case "/login":
            handleLogin(req, res);
            break;

        default:
            res.writeHead(404, {"Content-Type" : "text/plain"});
            res.end("404 Not found");
            break;
    }
}

function handleLogin(req, res){
    const content = ejs.render(loginPage, {});
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.write(content);
    res.end();
}

function handleIndex(req, res){
    if (req.method === "POST"){
        let body = "";
        req.on("data", (chunk) => body += chunk);
        req.on("end", () => {
            const parsed = new URLSearchParams(body);
            addToData(parsed.get("id"), parsed.get("msg"), messageFile, req);
            writeIndex(req, res);
        })
    } else {
        writeIndex(req, res);
    }
}

function writeIndex(req, res){
    let message = "Please write a message."
    const content = ejs.render(indexPage, {
        title : "Index",
        content : message,
        data : messageData,
        file : partialFile
    })
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.write(content);
    res.end();
}

function addToData(id, msg, fName, req){
    const dataObj = JSON.stringify({"id" : id, "msg" : msg});
    messageData.unshift(dataObj);
    if (messageData.length > maxMessages) messageData.pop();
    saveData(fName);
}

async function saveData(fName){
    try {
        const dataStr = messageData.join("\n");
        await writeFile(fName, dataStr);
        console.log(`File saved as ${fName}`);
    } catch (error) {
        console.log(`Error writing file: ${error}`);
        throw error;
    }
}