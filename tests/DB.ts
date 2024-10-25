import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

/**
 * Helper class for connecting to in-memory mongo server for tests.
 * 
 * Idea:  
 * - https://javascript.plainenglish.io/unit-testing-node-js-mongoose-using-jest-106a39b8393d
 * - https://dev.to/paulasantamaria/testing-node-js-mongoose-with-an-in-memory-database-32np 
 * 
 * Fixes:
 * - https://nodkz.github.io/mongodb-memory-server/docs/guides/migration/migrate7/#no-function-other-than-start-create-ensureinstance-will-be-starting-anything
 * - https://nodkz.github.io/mongodb-memory-server/ 
 */
export default class DB {
    private static mongo: MongoMemoryServer | undefined
    private static connected = false;

    static async connect() {
        if (DB.connected) {
            throw new Error("MongoSB already connected.")
        }

        // External Server: (Anleitung siehe Blatt 01, Zusatzaufgabe)
        // await mongoose.connect("mongodb://localhost:27017/test");

        // MongoDB-Memory-Server:
        DB.mongo = await MongoMemoryServer.create();
        const uri = DB.mongo.getUri();
        await mongoose.connect(uri);

        DB.connected = true;
    }

    static async close() {
        if (DB.connected) {

            await mongoose.connection.close();

            // MongoDB-Memory-Server:
            if (DB.mongo) {
                DB.mongo.stop();
                DB.mongo = undefined;
            }

            DB.connected = false;
        }

    }

    static async clear() {
        if (!DB.connected) {
            throw new Error("MongoSB not connected.")
        }
        // await mongoose.connection.dropDatabase();
        // no drop in order to not delete indexes:
        const collections = Object.values(mongoose.connection.collections);
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    }
}


