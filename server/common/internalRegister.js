import client from "prom-client";
const collectDefaultMetrics = client.collectDefaultMetrics;
const register = new client.Registry();
collectDefaultMetrics({ register });

export default register;
