import { createClient } from 'redis';

const redisClient = createClient({
    password: 'EiqkmK02GadtzHNZSE3KZo6iqCDx6e2x',
    socket: {
        host: 'redis-19692.c276.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 19692
    }
});

redisClient.on('error', err => console.log(err))

if (!redisClient.isOpen) {
  redisClient.connect()
}

export { redisClient }