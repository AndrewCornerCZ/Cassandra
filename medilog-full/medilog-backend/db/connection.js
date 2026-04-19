const cassandra = require('cassandra-driver');

let client = null;

const getClient = async () => {
  if (!client) {
    const hosts = (process.env.CASSANDRA_HOSTS || '127.0.0.1').split(',');
    const port = parseInt(process.env.CASSANDRA_PORT || '9042', 10);
    
    client = new cassandra.Client({
      contactPoints: hosts,
      port: port,
      keyspace: process.env.CASSANDRA_KEYSPACE || 'medilog',
      localDataCenter: 'datacenter1',
      protocolVersion: 4,
      queryOptions: { consistency: cassandra.types.consistencies.localOne },
      socketOptions: { 
        connectTimeout: 10000,
        readTimeout: 30000 
      }
    });

    let retries = 0;
    const maxRetries = 12; // 2 minuty (12 x 10 sekund)
    
    while (retries < maxRetries) {
      try {
        await client.connect();
        console.log(`✅ Připojeno k Cassandře: ${hosts.join(', ')}:${port}`);
        break;
      } catch (err) {
        retries++;
        console.log(`⏳ Čekání na Cassandru... (${retries}/${maxRetries})`);
        if (retries >= maxRetries) {
          throw new Error(`Nemohu se připojit k Cassandře po ${maxRetries} pokusech: ${err.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 10000)); // čekej 10 sekund
      }
    }
  }
  return client;
};

const closeClient = async () => {
  if (client) {
    await client.shutdown();
    client = null;
    console.log('❌ Odpojen od Cassandry');
  }
};

module.exports = { getClient, closeClient };
