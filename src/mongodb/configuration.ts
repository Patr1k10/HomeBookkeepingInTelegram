import * as dotenv from 'dotenv';

dotenv.config();

export default () => ({
  database: {
    url: process.env.MONGODB_URL,
    name: process.env.MONGODB_NAME,
  },
});
