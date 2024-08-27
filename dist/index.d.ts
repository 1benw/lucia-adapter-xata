import { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";
import { XataRecord, SchemaInference, Repository } from "@xata.io/client";
declare const tables: readonly [{
    readonly name: "auth_users";
    readonly columns: readonly [{
        readonly name: "name";
        readonly type: "string";
        readonly notNull: true;
        readonly defaultValue: "";
    }];
    readonly revLinks: readonly [{
        readonly column: "user";
        readonly table: "auth_sessions";
    }];
}, {
    readonly name: "auth_sessions";
    readonly columns: readonly [{
        readonly name: "user";
        readonly type: "link";
        readonly link: {
            readonly table: "auth_users";
        };
    }, {
        readonly name: "expiresAt";
        readonly type: "datetime";
    }];
}];
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
export declare class XataAdapter implements Adapter {
    private client;
    constructor(client: XataClient);
    deleteExpiredSessions(): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    deleteUserSessions(userId: UserId): Promise<void>;
    getSessionAndUser(sessionId: string): Promise<[DatabaseSession | null, DatabaseUser | null]>;
    getUserSessions(userId: UserId): Promise<DatabaseSession[]>;
    setSession(session: DatabaseSession): Promise<void>;
    updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void>;
}
export {};
