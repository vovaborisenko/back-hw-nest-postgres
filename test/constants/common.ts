export const validMongoId = '507f1f77bcf86cd799439011';
export const validAuth = `Basic ${Buffer.from('name:password').toString('base64')}`;
export const invalidAuth = `Basic ${Buffer.from('wrong:wrong').toString('base64')}`;
