const express = require("express");
const https = require("https");
const mongoose = require("mongoose");

const app = express.Router();
const User = require("../model/user.js");
const functions = require("../structs/functions.js");

const startedAt = new Date();
const backendPort = Number(process.env.PORT || 8080);
const xmppPort = 80;

app.get("/launcher/api/status", (req, res) => {
    const mongoState = getMongoState();
    const xmppStarted = Array.isArray(global.Clients);
    const connectedClients = xmppStarted ? global.Clients.length : 0;

    const services = [
        {
            id: "backend",
            label: "Backend API",
            state: "online",
            details: `Listening on port ${backendPort}`,
            port: backendPort
        },
        {
            id: "mongodb",
            label: "MongoDB",
            state: mongoState.state,
            details: mongoState.details
        },
        {
            id: "xmpp",
            label: "XMPP",
            state: xmppStarted ? "online" : "starting",
            details: xmppStarted ? `${connectedClients} connected client(s)` : "XMPP server has not finished booting",
            port: xmppPort,
            connectedClients
        },
        {
            id: "matchmaker",
            label: "Matchmaker",
            state: xmppStarted ? "online" : "starting",
            details: `WebSocket matchmaking shares port ${xmppPort}`,
            port: xmppPort
        }
    ];

    const hasOfflineService = services.some(service => service.state === "offline");

    res.json({
        status: hasOfflineService ? "degraded" : "online",
        checkedAtUtc: new Date().toISOString(),
        startedAtUtc: startedAt.toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        services
    });
});

app.post("/launcher/api/auth/discord/exchange", async (req, res) => {
    const accessToken = req.body.access_token;

    if (!accessToken) {
        return res.status(400).json({
            error: "missing_access_token",
            message: "Discord access token is required."
        });
    }

    let discordUser;

    try {
        discordUser = await getDiscordUser(accessToken);
    } catch (err) {
        return res.status(401).json({
            error: "invalid_discord_token",
            message: err.message
        });
    }

    const user = await User.findOne({ discordId: discordUser.id }).lean();

    if (!user) {
        return res.status(404).json({
            error: "account_not_registered",
            message: "Discord account is not registered in Dream."
        });
    }

    const exchangeCode = functions.MakeID().replace(/-/ig, "");

    global.exchangeCodes.push({
        accountId: user.accountId,
        exchange_code: exchangeCode,
        creatingClientId: "dream-launcher"
    });

    setTimeout(() => {
        const index = global.exchangeCodes.findIndex(i => i.exchange_code === exchangeCode);

        if (index !== -1) {
            global.exchangeCodes.splice(index, 1);
        }
    }, 300000);

    res.json({
        code: exchangeCode,
        expiresInSeconds: 300,
        accountId: user.accountId,
        displayName: user.username,
        discord: {
            id: discordUser.id,
            username: discordUser.username,
            globalName: discordUser.global_name || null
        }
    });
});

function getMongoState() {
    switch (mongoose.connection.readyState) {
        case 1:
            return {
                state: "online",
                details: "Connected"
            };
        case 2:
            return {
                state: "starting",
                details: "Connecting"
            };
        case 3:
            return {
                state: "offline",
                details: "Disconnecting"
            };
        default:
            return {
                state: "offline",
                details: "Disconnected"
            };
    }
}

function getDiscordUser(accessToken) {
    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "discord.com",
            path: "/api/users/@me",
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json"
            },
            timeout: 10000
        }, response => {
            let body = "";

            response.setEncoding("utf8");
            response.on("data", chunk => {
                body += chunk;
            });
            response.on("end", () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`Discord returned HTTP ${response.statusCode}: ${body}`));
                }

                try {
                    resolve(JSON.parse(body));
                } catch {
                    reject(new Error("Discord returned invalid JSON."));
                }
            });
        });

        request.on("timeout", () => request.destroy(new Error("Discord request timed out.")));
        request.on("error", reject);
        request.end();
    });
}

module.exports = app;
