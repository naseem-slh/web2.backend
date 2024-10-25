import { readFile } from "fs/promises";
import https from "https";
import supertest from "supertest";
import app from "../../src/app";
import DB from "../DB";

import { ShopperResource } from "../../src/Resources";
import { createShopList } from "../../src/services/ShopListService";
import { createUser } from "../../src/services/UsersService";


beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {

    const john = await createUser({ name: "John", email: "john@doe.de", password: "123", admin: false })
    const shopper: ShopperResource = { shopLists: [] }
    for (let i = 0; i < 4; i++) {
        const shopList = await createShopList({ store: "John's shop #" + i, public: true, creator: john.id!, done: false })
        shopper.shopLists.push({ ...shopList });
    }
})
afterEach(async () => {
    await DB.clear();
});
afterAll(async () => {
    await DB.close()
})

const TEST_HTTPS_PORT = process.env.TEST_HTTPS_PORT ?? "3002";
const TEST_SSL_KEY_FILE = process.env.TEST_SSL_KEY_FILE ?? "cert/private.key"
const TEST_SSL_CERT_FILE = process.env.TsEST_SSL_CERT_FILE ?? "cert/public.crt"

test("https test", async () => {
    
    // https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // set up server:
    const httpsPort = parseInt(TEST_HTTPS_PORT);
    const [privateSSLKey, publicSSLCert] = await Promise.all([
        readFile(TEST_SSL_KEY_FILE),
        readFile(TEST_SSL_CERT_FILE)]);

    const httpsServer = https.createServer(
        { key: privateSSLKey, cert: publicSSLCert },
        app);
    try {
        await new Promise<void>((resolve, reject) => {
            try {
                /*
                 * Bei einem Fehler "listen EADDRINUSE: address already in use :::3002", 
                 * meist verursacht durch fehlgeschlagene Tests,
                 * kann man (unter Linux und macos) den zugehörigen Prozess, sprich, die noch im Hintergrund
                 * laufende Node-Instanz mit
                 * > lsof -ti :3002
                 * identifizieren. Ausgegeben wird die Nummer des Prozesses, diesen kann man dann mit
                 * > kill «Prozessnummer»
                 * beenden.
                 * Oder als Einzeiler:
                 * > kill $(lsof -ti :3002)
                 * Achtung, es kann sein, dass die Jest-Extension immer wieder neue Tests
                 * 'scheduled' hat. Dann wird der Port immer wieder neu belegt.
                 */
                httpsServer.listen(httpsPort, () => {
                    // console.log(`Listening for HTTPS at https://localhost:${httpsPort}`);
                    resolve(/* void */);
                });
            } catch (err) {
                reject(err);
            }
        });
        // get that nice board
        const request = supertest(httpsServer);
        const response = await request.get(`/api/shopper`);
        expect(response.statusCode).toBe(200);
        const shopperRes: ShopperResource = response.body;
        expect(shopperRes.shopLists.length).toBe(4)
    } finally {
        httpsServer.close();
    }
});