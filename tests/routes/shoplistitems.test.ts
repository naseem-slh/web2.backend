// Vorlage für den Einstieg, vgl. Folie 133

import supertest from "supertest";
import DB from "../DB";
import { LoginResource, ShopListItemsResource, ShopListResource, UserResource } from "../../src/Resources";
import app from "../../src/app";
import { createShopItem } from "../../src/services/ShopItemService";
import { createShopList } from "../../src/services/ShopListService";
import { createUser } from "../../src/services/UsersService";
import "restmatcher";
import { User } from "../../src/model/UserModel";


let token: string
let shopListId: string
let maxpubid: string
let maxprvtid: string // set in beforeEach
const shopItems: ShopListItemsResource = { shopItems: [] }; // content set in beforeEach
const shopItemsMaxPub: ShopListItemsResource = { shopItems: [] }; // content set in beforeEach
const shopItemsMaxPrvt: ShopListItemsResource = { shopItems: [] }; // content set in beforeEach

const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";


beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    User.syncIndexes();

    // create a user which we use later on in all tests
    const john = await createUser({ name: "John", email: "john@doe.de", password: "123asdf!ABCD", admin: false })
    const max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })

    // setup a shopList
    const shopList = await createShopList({ store: "John's shop", public: false, creator: john.id!, done: false })
    const maxPublicList = await createShopList({ store: "Max's shop", public: true, creator: max.id!, done: false })
    const maxPrivateList = await createShopList({ store: "Max's private shop", public: false, creator: max.id!, done: false })
    maxprvtid = maxPrivateList.id!
    maxpubid = maxPublicList.id!
    shopListId = shopList.id!;
    // and some shopItems
    for (let m = 0; m < 5; m++) {
        const shopItem = await createShopItem({ name: `Item ${m}`, quantity: `${m + 1} kg`, creator: john.id!, shopList: shopList.id! })
        const maxPubItem = await createShopItem({ name: `etwas ${m}`, quantity: `${m + 1} kg`, creator: max.id!, shopList: maxPublicList.id! })
        const maxPrvtItem = await createShopItem({ name: `private ${m}`, quantity: `${m + 1} kg`, creator: max.id!, shopList: maxPrivateList.id! })

        shopItemsMaxPrvt.shopItems.push(maxPrvtItem)
        shopItemsMaxPub.shopItems.push(maxPubItem)
        shopItems.shopItems.push(shopItem);
    }
    // Login um Token zu erhalten
    const request = supertest(app);
    const loginData = { email: "john@doe.de", password: "123asdf!ABCD" };
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined()
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

test("shopitems GET, Positivtest logged in users non public list", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${shopListId}/shopitems`)
        .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(200);

    const shopItemsRes = response.body;
    expect(shopItemsRes).toEqual(shopItems);
});

// test for public list diffrent logged in user missing

test("shopitems GET, logged in user tries to access private list of someone else,negative ", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${maxprvtid}/shopitems`)
        .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(403);
});

test("shopitems GET, nicht existierende ShopList-ID", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${NON_EXISTING_ID}/shopitems`)
        .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(404);
});

test("shopitems GET, no valid mongoID", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${"noID"}/shopitems`)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ params: "id" })
});

test("shopitems GET, no authentication", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/shoplist/${shopListId}/shopitems`)
        .set("Authorization", `Bearer ${undefined}`)
    expect(response).not.statusCode(400);
    expect(response).not.statusCode(404);
    expect(response.statusCode).toBe(401);
});
