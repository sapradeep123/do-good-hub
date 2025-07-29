require('dotenv').config();

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'undefined'); 