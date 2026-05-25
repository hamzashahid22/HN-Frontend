import * as SQLite from "expo-sqlite";
import { ConversationKeyBundles, Message } from "../types";

let db: SQLite.SQLiteDatabase | null = null;

export async function openLocalDb() {
  db ??= await SQLite.openDatabaseAsync("homenet.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS outbound_queue (
      clientMessageId TEXT PRIMARY KEY NOT NULL,
      conversationId TEXT NOT NULL,
      plaintext TEXT NOT NULL,
      encryptedPayload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      lastError TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS message_cache (
      id TEXT PRIMARY KEY NOT NULL,
      conversationId TEXT NOT NULL,
      senderUserId TEXT NOT NULL,
      senderDeviceId TEXT NOT NULL,
      clientMessageId TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      encryptionHeader TEXT NOT NULL,
      plaintext TEXT,
      localStatus TEXT,
      serverCreatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_message_cache_conversation_time ON message_cache(conversationId, serverCreatedAt DESC);
    CREATE TABLE IF NOT EXISTS conversation_sync_state (
      conversationId TEXT PRIMARY KEY NOT NULL,
      latestCursor TEXT
    );
    CREATE TABLE IF NOT EXISTS conversation_key_context (
      conversationId TEXT PRIMARY KEY NOT NULL,
      keyContext TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  return db;
}

export async function cacheMessages(messages: Message[]) {
  if (!messages.length) return;
  const database = await openLocalDb();
  await database.withTransactionAsync(async () => {
    for (const message of messages) {
      await database.runAsync(
        `INSERT OR REPLACE INTO message_cache
          (id, conversationId, senderUserId, senderDeviceId, clientMessageId, ciphertext, encryptionHeader, plaintext, localStatus, serverCreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          message.conversationId,
          message.senderUserId,
          message.senderDeviceId,
          message.clientMessageId,
          message.ciphertext,
          JSON.stringify(message.encryptionHeader),
          message.plaintext ?? null,
          message.localStatus ?? null,
          message.serverCreatedAt
        ]
      );
    }
  });
}

export async function getCachedMessages(conversationId: string, limit = 100): Promise<Message[]> {
  const database = await openLocalDb();
  const rows = await database.getAllAsync<{
    id: string;
    conversationId: string;
    senderUserId: string;
    senderDeviceId: string;
    clientMessageId: string;
    ciphertext: string;
    encryptionHeader: string;
    plaintext: string | null;
    localStatus: Message["localStatus"] | null;
    serverCreatedAt: string;
  }>(
    `SELECT * FROM message_cache WHERE conversationId = ? ORDER BY serverCreatedAt DESC LIMIT ?`,
    [conversationId, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    senderUserId: row.senderUserId,
    senderDeviceId: row.senderDeviceId,
    clientMessageId: row.clientMessageId,
    ciphertext: row.ciphertext,
    encryptionHeader: JSON.parse(row.encryptionHeader) as Record<string, unknown>,
    plaintext: row.plaintext ?? undefined,
    localStatus: row.localStatus ?? undefined,
    serverCreatedAt: row.serverCreatedAt
  }));
}

export async function enqueueOutboundMessage(input: {
  clientMessageId: string;
  conversationId: string;
  plaintext: string;
  encryptedPayload: Record<string, unknown>;
  lastError?: string;
}) {
  const database = await openLocalDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO outbound_queue
      (clientMessageId, conversationId, plaintext, encryptedPayload, status, lastError, createdAt)
     VALUES (?, ?, ?, ?, 'queued', ?, COALESCE((SELECT createdAt FROM outbound_queue WHERE clientMessageId = ?), ?))`,
    [
      input.clientMessageId,
      input.conversationId,
      input.plaintext,
      JSON.stringify(input.encryptedPayload),
      input.lastError ?? null,
      input.clientMessageId,
      new Date().toISOString()
    ]
  );
}

export async function getOutboundMessages(conversationId?: string) {
  const database = await openLocalDb();
  const rows = conversationId
    ? await database.getAllAsync<{ clientMessageId: string; conversationId: string; plaintext: string; encryptedPayload: string; createdAt: string }>(
        `SELECT clientMessageId, conversationId, plaintext, encryptedPayload, createdAt FROM outbound_queue WHERE conversationId = ? ORDER BY createdAt ASC`,
        [conversationId]
      )
    : await database.getAllAsync<{ clientMessageId: string; conversationId: string; plaintext: string; encryptedPayload: string; createdAt: string }>(
        `SELECT clientMessageId, conversationId, plaintext, encryptedPayload, createdAt FROM outbound_queue ORDER BY createdAt ASC`
      );

  return rows.map((row) => ({
    ...row,
    encryptedPayload: JSON.parse(row.encryptedPayload) as {
      conversationId: string;
      clientMessageId: string;
      ciphertext: string;
      encryptionHeader: Record<string, unknown>;
      mediaFileId?: string;
    }
  }));
}

export async function removeOutboundMessage(clientMessageId: string) {
  const database = await openLocalDb();
  await database.runAsync(`DELETE FROM outbound_queue WHERE clientMessageId = ?`, [clientMessageId]);
}

export async function setSyncCursor(conversationId: string, latestCursor: string | null) {
  const database = await openLocalDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO conversation_sync_state (conversationId, latestCursor) VALUES (?, ?)`,
    [conversationId, latestCursor]
  );
}

export async function getSyncCursor(conversationId: string) {
  const database = await openLocalDb();
  const row = await database.getFirstAsync<{ latestCursor: string | null }>(
    `SELECT latestCursor FROM conversation_sync_state WHERE conversationId = ?`,
    [conversationId]
  );
  return row?.latestCursor ?? null;
}

export async function cacheConversationKeyContext(keyContext: ConversationKeyBundles) {
  const database = await openLocalDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO conversation_key_context (conversationId, keyContext, updatedAt) VALUES (?, ?, ?)`,
    [keyContext.conversationId, JSON.stringify(keyContext), new Date().toISOString()]
  );
}

export async function getCachedConversationKeyContext(conversationId: string) {
  const database = await openLocalDb();
  const row = await database.getFirstAsync<{ keyContext: string }>(
    `SELECT keyContext FROM conversation_key_context WHERE conversationId = ?`,
    [conversationId]
  );
  return row ? JSON.parse(row.keyContext) as ConversationKeyBundles : null;
}
