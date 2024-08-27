import { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";
import { XataRecord, SchemaInference, Repository, SelectedPick, lte } from "@xata.io/client";

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
] as const;

type SchemaTables = typeof tables;
type InferredTypes = SchemaInference<SchemaTables>;

type AuthSessions = InferredTypes["auth_sessions"];
type AuthSessionsRecord = AuthSessions & XataRecord;

interface DatabaseSchema extends Record<string, XataRecord> {
  auth_sessions: AuthSessionsRecord;
}

interface XataClient {
  db: {
    auth_sessions: Repository<DatabaseSchema["auth_sessions"]>;
  };
}

export class XataAdapter implements Adapter {
  private client: XataClient;

  constructor(client: XataClient) {
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

  async deleteSession(sessionId: string) {
    await this.client.db.auth_sessions.delete(sessionId);
  }

  async deleteUserSessions(userId: UserId) {
    const sessions = await this.client.db.auth_sessions
      .select(["id"])
      .filter({
        user: userId,
      })
      .getAll();

    await this.client.db.auth_sessions.delete(sessions.map((s) => s.id));
  }

  async getSessionAndUser(
    sessionId: string
  ): Promise<[DatabaseSession | null, DatabaseUser | null]> {
    const session = await this.client.db.auth_sessions.read(sessionId, ["*", "user.*"]);

    const sessionData = transformIntoDatabaseSession(session);
    const userData = transformIntoDatabaseUser(session?.user);

    return [sessionData, userData];
  }

  async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
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

  async setSession(session: DatabaseSession) {
    await this.client.db.auth_sessions.create({
      id: session.id,
      user: session.userId,
      expiresAt: session.expiresAt,
      ...session.attributes,
    });
  }

  async updateSessionExpiration(sessionId: string, expiresAt: Date) {
    await this.client.db.auth_sessions.update(sessionId, {
      expiresAt,
    });
  }
}

function transformIntoDatabaseSession(
  raw: Readonly<SelectedPick<AuthSessionsRecord, ["*"]>> | null
): DatabaseSession | null {
  if (!raw?.user || !raw.expiresAt) return null;
  const { id, user, expiresAt, xata, ...attributes } = raw;
  return {
    userId: user?.id,
    id,
    expiresAt,
    attributes,
  };
}

function transformIntoDatabaseUser(raw: any): DatabaseUser | null {
  if (!raw) return null;
  const { id, xata, ...attributes } = raw;
  return {
    id,
    attributes,
  };
}
