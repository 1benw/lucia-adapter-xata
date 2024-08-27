import { lte } from "@xata.io/client";
const tables = [
    {
        name: "auth_users",
        columns: [{ name: "name", type: "string", notNull: true, defaultValue: "" }],
        revLinks: [{ column: "user", table: "auth_sessions" }],
    },
    {
        name: "auth_sessions",
        columns: [
            { name: "user", type: "link", link: { table: "auth_users" } },
            { name: "expiresAt", type: "datetime" },
        ],
    },
];
export class XataAdapter {
    constructor(client) {
        this.client = client;
    }
    async deleteExpiredSessions() {
        const expiredSessions = await this.client.db.auth_sessions
            .select(["id"])
            .filter({
            expiresAt: lte(new Date()),
        })
            .getAll();
        await this.client.db.auth_sessions.delete(expiredSessions.map((s) => s.id));
    }
    async deleteSession(sessionId) {
        await this.client.db.auth_sessions.delete(sessionId);
    }
    async deleteUserSessions(userId) {
        const sessions = await this.client.db.auth_sessions
            .select(["id"])
            .filter({
            user: userId,
        })
            .getAll();
        await this.client.db.auth_sessions.delete(sessions.map((s) => s.id));
    }
    async getSessionAndUser(sessionId) {
        const session = await this.client.db.auth_sessions.read(sessionId, ["*", "user.*"]);
        const sessionData = transformIntoDatabaseSession(session);
        const userData = transformIntoDatabaseUser(session?.user);
        return [sessionData, userData];
    }
    async getUserSessions(userId) {
        const sessions = await this.client.db.auth_sessions
            .filter({
            user: userId,
        })
            .getAll();
        return sessions
            .map((val) => {
            return transformIntoDatabaseSession(val);
        })
            .filter((val) => val !== null);
    }
    async setSession(session) {
        await this.client.db.auth_sessions.create({
            id: session.id,
            user: session.userId,
            expiresAt: session.expiresAt,
            ...session.attributes,
        });
    }
    async updateSessionExpiration(sessionId, expiresAt) {
        await this.client.db.auth_sessions.update(sessionId, {
            expiresAt,
        });
    }
}
function transformIntoDatabaseSession(raw) {
    if (!raw?.user || !raw.expiresAt)
        return null;
    const { id, user, expiresAt, xata, ...attributes } = raw;
    return {
        userId: user?.id,
        id,
        expiresAt,
        attributes,
    };
}
function transformIntoDatabaseUser(raw) {
    if (!raw)
        return null;
    const { id, xata, ...attributes } = raw;
    return {
        id,
        attributes,
    };
}
