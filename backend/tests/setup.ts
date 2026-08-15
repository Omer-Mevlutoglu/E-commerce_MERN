import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

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
});

/** Each test starts from an empty database, so order never matters. */
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
