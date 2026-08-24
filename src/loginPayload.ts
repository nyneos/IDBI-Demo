export interface LoginPayload {
  userName: string;
  message: string;
  sentAt: string;
}

/** Change this object in code to update what Continue sends to the server. */
export const LOGIN_PAYLOAD = {
  userName: 'Kanav Arora',
  message: 'Hello from Login-Page',
} as const;

export function buildLoginPayload(): LoginPayload {
  return {
    userName: LOGIN_PAYLOAD.userName,
    message: LOGIN_PAYLOAD.message,
    sentAt: new Date().toISOString(),
  };
}
