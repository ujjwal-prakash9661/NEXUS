const redis = require('./src/services/redis.service')

async function test() {
  await redis.set('nexus', 'online')
  const val = await redis.get('nexus')
  console.log(val)
}

test()