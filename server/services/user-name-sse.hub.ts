import type { Response } from 'express';
import { buildSuccess, writeSse } from '../utils/response.js';

type Client = {
  res: Response;
  lastSent: string | null;
};

const clients = new Set<Client>();

export function addUserNameSseClient(res: Response): Client {
  const client: Client = { res, lastSent: null };
  clients.add(client);
  return client;
}

export function removeUserNameSseClient(client: Client): void {
  clients.delete(client);
}

/** Push to one client only if the value changed for that connection. */
export function sendUserNameToClient(client: Client, userName: string): void {
  if (client.lastSent === userName) return;
  client.lastSent = userName;
  writeSse(client.res, buildSuccess({ userName }, 200));
}

/** Immediately notify every open Dashboard SSE connection. */
export function broadcastUserName(userName: string): void {
  for (const client of clients) {
    try {
      sendUserNameToClient(client, userName);
    } catch {
      clients.delete(client);
    }
  }
}
