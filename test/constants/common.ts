export const validParamId = 1212435;
export const validAuth = `Basic ${Buffer.from('name:password').toString('base64')}`;
export const invalidAuth = `Basic ${Buffer.from('wrong:wrong').toString('base64')}`;
