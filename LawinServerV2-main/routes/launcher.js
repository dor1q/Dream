const express = require("express");
const https = require("https");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express.Router();
const User = require("../model/user.js");
const functions = require("../structs/functions.js");

const startedAt = new Date();
const backendPort = Number(process.env.PORT || 8080);
const xmppPort = Number(process.env.XMPP_PORT || 80);
const oauthStateTtlMs = 5 * 60 * 1000;

global.launcherOAuthStates = global.launcherOAuthStates || new Map();

app.get("/launcher/api/status", (req, res) => {
    const mongoState = getMongoState();
    const xmppStatus = global.xmppServerStatus || {
        state: Array.isArray(global.Clients) ? "online" : "starting",
        details: Array.isArray(global.Clients) ? "Listening" : "XMPP server has not finished booting",
        port: xmppPort
    };
    const xmppStarted = xmppStatus.state === "online";
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
            state: xmppStatus.state,
            details: xmppStarted ? `${connectedClients} connected client(s)` : xmppStatus.details,
            port: xmppStatus.port,
            connectedClients
        },
        {
            id: "matchmaker",
            label: "Matchmaker",
            state: xmppStatus.state,
            details: xmppStarted ? `WebSocket matchmaking shares port ${xmppStatus.port}` : xmppStatus.details,
            port: xmppStatus.port
        }
    ];

    const hasOfflineService = services.some(service => service.state === "offline");
    const hasStartingService = services.some(service => service.state === "starting");

    res.json({
        status: hasOfflineService ? "degraded" : hasStartingService ? "starting" : "online",
        checkedAtUtc: new Date().toISOString(),
        startedAtUtc: startedAt.toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        services
    });
});

app.get("/launcher/api/auth/discord/start", (req, res) => {
    const redirectUri = String(req.query.redirect_uri || "").trim();

    if (!isValidLoopbackRedirectUri(redirectUri)) {
        return res.status(400).json({
            error: "invalid_redirect_uri",
            message: "A local launcher redirect URI is required."
        });
    }

    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
        return res.status(503).json({
            error: "discord_oauth_not_configured",
            message: "Discord OAuth is not configured on the backend."
        });
    }

    cleanupOAuthStates();

    const state = functions.MakeID().replace(/-/ig, "");
    global.launcherOAuthStates.set(state, {
        redirectUri,
        expiresAt: Date.now() + oauthStateTtlMs
    });

    const query = new URLSearchParams({
        response_type: "code",
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: "identify",
        state,
        prompt: "consent"
    });

    res.json({
        authorizationUrl: `https://discord.com/oauth2/authorize?${query.toString()}`,
        state,
        redirectUri,
        expiresInSeconds: Math.floor(oauthStateTtlMs / 1000)
    });
});

app.post("/launcher/api/auth/discord/callback", async (req, res) => {
    const code = String(req.body.code || "").trim();
    const state = String(req.body.state || "").trim();
    const redirectUri = String(req.body.redirect_uri || "").trim();

    if (!code || !state || !redirectUri) {
        return res.status(400).json({
            error: "invalid_oauth_callback",
            message: "Discord code, state, and redirect URI are required."
        });
    }

    const storedState = global.launcherOAuthStates.get(state);

    if (!storedState || storedState.expiresAt < Date.now() || storedState.redirectUri !== redirectUri) {
        return res.status(400).json({
            error: "invalid_oauth_state",
            message: "Discord login state is invalid or expired."
        });
    }

    global.launcherOAuthStates.delete(state);

    let discordToken;
    let discordUser;

    try {
        discordToken = await exchangeDiscordCode(code, redirectUri);
        discordUser = await getDiscordUser(discordToken.access_token);
    } catch (err) {
        return res.status(401).json({
            error: "discord_login_failed",
            message: err.message
        });
    }

    let user;

    try {
        user = await findOrCreateDiscordUser(discordUser);
    } catch (err) {
        return res.status(500).json({
            error: "dream_account_create_failed",
            message: err.message
        });
    }

    const launcherToken = createLauncherToken(user, discordUser);

    res.json({
        accessToken: launcherToken,
        tokenType: "DreamLauncher",
        expiresInSeconds: 12 * 60 * 60,
        accountId: user.accountId,
        displayName: user.username,
        discord: normalizeDiscordUser(discordUser)
    });
});

app.post("/launcher/api/auth/discord/exchange", async (req, res) => {
    const launcherToken = req.body.launcher_token;
    let user;
    let discordUser;

    if (!launcherToken) {
        return res.status(400).json({
            error: "missing_launcher_token",
            message: "Launcher token is required."
        });
    }

    try {
        const payload = jwt.verify(launcherToken, global.JWT_SECRET);

        if (payload.type !== "dream-launcher") {
            throw new Error("Invalid launcher token type.");
        }

        user = await User.findOne({ accountId: payload.accountId }).lean();

        if (!user) {
            return res.status(404).json({
                error: "account_not_registered",
                message: "Dream account was not found."
            });
        }

        discordUser = {
            id: payload.discordId,
            username: payload.discordUsername || user.username,
            global_name: payload.discordGlobalName || user.username,
            avatar: payload.discordAvatar || null,
            discriminator: null
        };
    } catch (err) {
        return res.status(401).json({
            error: "invalid_launcher_token",
            message: err.message
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

function isValidLoopbackRedirectUri(value) {
    try {
        const uri = new URL(value);
        return (uri.protocol === "http:" || uri.protocol === "https:") &&
            (uri.hostname === "127.0.0.1" || uri.hostname === "localhost") &&
            uri.pathname === "/callback/";
    } catch {
        return false;
    }
}

function cleanupOAuthStates() {
    for (const [state, data] of global.launcherOAuthStates.entries()) {
        if (data.expiresAt < Date.now()) {
            global.launcherOAuthStates.delete(state);
        }
    }
}

function exchangeDiscordCode(code, redirectUri) {
    return new Promise((resolve, reject) => {
        const body = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri
        }).toString();

        const request = https.request({
            hostname: "discord.com",
            path: "/api/oauth2/token",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body),
                Accept: "application/json"
            },
            timeout: 10000
        }, response => {
            let raw = "";

            response.setEncoding("utf8");
            response.on("data", chunk => {
                raw += chunk;
            });
            response.on("end", () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`Discord token endpoint returned HTTP ${response.statusCode}: ${raw}`));
                }

                try {
                    resolve(JSON.parse(raw));
                } catch {
                    reject(new Error("Discord token endpoint returned invalid JSON."));
                }
            });
        });

        request.on("timeout", () => request.destroy(new Error("Discord token request timed out.")));
        request.on("error", reject);
        request.write(body);
        request.end();
    });
}

async function findOrCreateDiscordUser(discordUser) {
    const existingUser = await User.findOne({ discordId: discordUser.id }).lean();

    if (existingUser) {
        return existingUser;
    }

    const username = await createAvailableUsername(discordUser);
    const email = `discord-${discordUser.id}@dream.dev`;
    const password = `${functions.MakeID()}${functions.MakeID()}`;
    const result = await functions.registerUser(discordUser.id, username, email, password);

    if (result.status >= 400) {
        throw new Error(result.message);
    }

    const createdUser = await User.findOne({ discordId: discordUser.id }).lean();

    if (!createdUser) {
        throw new Error("Dream account was not created.");
    }

    return createdUser;
}

async function createAvailableUsername(discordUser) {
    const base = sanitizeUsername(discordUser.global_name || discordUser.username || "Player");
    const suffix = discordUser.id.slice(-5);
    const candidates = [
        `${base}${suffix}`,
        `Player${suffix}`,
        `Dream${suffix}`
    ];

    for (const candidate of candidates) {
        const cropped = candidate.slice(0, 24);
        if (!await User.findOne({ username_lower: cropped.toLowerCase() }).lean()) {
            return cropped;
        }
    }

    return `Dream${functions.MakeID().replace(/-/ig, "").slice(0, 10)}`;
}

function sanitizeUsername(value) {
    const cleaned = String(value)
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 16);

    return cleaned.length >= 3 ? cleaned : "Player";
}

function createLauncherToken(user, discordUser) {
    return jwt.sign({
        type: "dream-launcher",
        accountId: user.accountId,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordGlobalName: discordUser.global_name || null,
        discordAvatar: discordUser.avatar || null
    }, global.JWT_SECRET, {
        expiresIn: "12h"
    });
}

function normalizeDiscordUser(discordUser) {
    return {
        id: discordUser.id,
        username: discordUser.username,
        global_name: discordUser.global_name || null,
        avatar: discordUser.avatar || null,
        discriminator: discordUser.discriminator || null
    };
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
