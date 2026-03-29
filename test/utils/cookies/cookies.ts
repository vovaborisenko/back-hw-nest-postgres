import { Response } from 'supertest';

export function extractCookies(response: Response): Record<string, string> {
  return (response.get('Set-Cookie') || []).reduce<Record<string, string>>(
    (result, cookie) => {
      const [key, value] = cookie.split(';')[0].split('=');
      result[key] = value;

      return result;
    },
    {},
  );
}
