import { createApp } from "./app";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function main() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API: http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
