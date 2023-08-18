//import redis from "redis";

// Configurações do Redis
const redisConfig = {
  host: "127.0.0.1", // Endereço IP ou nome do host onde o Redis está rodando
  port: 6379,       // Porta padrão do Redis
  // password: "sua_senha", // Se você configurou uma senha para o Redis, descomente esta linha e adicione a senha
};

// Criação do cliente Redis
const redisClient = redis.createClient(redisConfig);

redisClient.on("connect", () => {
  console.log("Conectado ao Redis");
});

redisClient.on("error", (err) => {
  console.error("Erro na conexão com o Redis:", err);
});

export default redisClient;
