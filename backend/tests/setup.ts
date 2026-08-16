import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
import { ensureIndexes } from "../src/config/indexes";

let replSet: MongoMemoryReplSet;

/**
 * A single-node in-memory replica set — not a standalone server.
 *
 * Transactions require a replica set, so this makes the tests exercise the
 * transactional checkout path that production uses, rather than the
 * compensating-write fallback. It also means CI needs no MongoDB service.
 */
beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });

  await mongoose.connect(replSet.getUri());

  // Same call the server makes at startup. Without it, a `$text` search runs
  // before the index exists and fails outright — which is exactly the
  // production bug this mirrors.
  await ensureIndexes();
});

/**
 * Each test starts from an empty database, so order never matters.
 * Documents only — dropping collections would take the indexes with them.
 */
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});
