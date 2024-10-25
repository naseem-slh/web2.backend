import supertest from "supertest";
import app from "../../src/app";
import { createUser } from "../../src/services/UsersService";
import { ShopListResource, UserResource, ShopItemResource, LoginResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList } from "../../src/services/ShopListService";
import { createShopItem } from "../../src/services/ShopItemService";
import { ShopItem } from "../../src/model/ShopItemModel";
import "restmatcher";

let john: UserResource
let token: string
let johnList: ShopListResource
let wasser: ShopItemResource
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "123asdf!ABCD", admin: false })
    johnList = await createShopList({ creator: john.id!, store: "IKEA" })
    wasser = await createShopItem({ creator: john.id!, shopList: johnList.id!, name: "wasser", quantity: "200" })

    // Login um Token zu erhalten
    const request = supertest(app);
    const loginData = { email: "john@doe.de", password: "123asdf!ABCD" };
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

describe("shopitem POST", () => {

    test("Positivetest", async () => {
        const request = supertest(app)
        const holz: ShopItemResource = { creator: john.id!, shopList: johnList.id!, name: "Holz", quantity: "111" }
        const response = await request.post(`/api/shopitem`)
            .set("Authorization", `Bearer ${token}`)
            .send(holz)

        const holzModel = await ShopItem.findOne({ name: "Holz" })
        expect(holzModel).toBeDefined()

        expect(response.statusCode).toBe(201)
        const shopItemRes = response.body as ShopItemResource
        expect(shopItemRes.id).toEqual(holzModel?.id)
        expect(shopItemRes.creator).toEqual(john.id)
    })

    test("Negativetest invalid creator ID", async () => {
        const request = supertest(app)
        const holz: ShopItemResource = { creator: NON_EXISTING_ID, shopList: johnList.id!, name: "Holz", quantity: "111" }
        const response = await request.post(`/api/shopitem`)
            .set("Authorization", `Bearer ${token}`)
            .send(holz)
        expect(response.statusCode).toBe(400)
    })

    test("creator of shoplist the shopitems gets added to is not the logged in user (shoplist is not public)", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: false })
        const holz: ShopItemResource = { creator: john.id!, shopList: maxList.id!, name: "Holz", quantity: "111" }
        const response = await request.post(`/api/shopitem`)
            .set("Authorization", `Bearer ${token}`)
            .send(holz)
            expect(response.statusCode).toBe(403)
    })

    test("shoplist of shopitem is public but creator and logged in user are diffrent, positivetest", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        const holz: ShopItemResource = { creator: john.id!, shopList: maxList.id!, name: "Holz", quantity: "111" }
        const response = await request.post(`/api/shopitem`)
            .set("Authorization", `Bearer ${token}`)
            .send(holz)
            expect(response.statusCode).toBe(201)
    })

})
describe("shopitem GET", () => {

    test("Positivetest", async () => {
        const request = supertest(app)
        const response = await request.get(`/api/shopitem/${wasser.id}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(200)

        const shopItemRes = response.body as ShopItemResource
        expect(shopItemRes).toEqual(wasser)
    })

    test("negativetest ID not found", async () => {
        const request = supertest(app)
        const response = await request.get(`/api/shopitem/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(404)
    })
    
    test("shoplist of shopitem is public , positivetest", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: max.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })

        const response = await request.get(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)
            expect(response.statusCode).toBe(200)
    })

    test("shoplist of shopitem is not public , diffrent creator of item and list than logged in user, negative", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: false })
        let milch = await createShopItem({ creator: max.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })

        const response = await request.get(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)
            expect(response.statusCode).toBe(403)
    })

    test("shoplist of shopitem is not public , diffrent creator of item but same of list, positive", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: false })
        let milch = await createShopItem({ creator: max.id!, shopList: johnList.id!, name: "Milch", quantity: "200" })

        const response = await request.get(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)
            expect(response.statusCode).toBe(200)
    })

    test("shoplist of shopitem is not public , diffrent creator of list but same of item, positive", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: false })
        let milch = await createShopItem({ creator: john.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })

        const response = await request.get(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)
            expect(response.statusCode).toBe(200)
    })
})

describe("shopitem PUT", () => {

    test("Positivetest", async () => {
        const request = supertest(app)
        const update: ShopItemResource = { id: wasser.id, creator: john.id!, shopList: johnList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shopitem/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)

        expect(response.statusCode).toBe(200)
        const updateRes = response.body as ShopItemResource
        const compare = { ...wasser, name: update.name }
        expect(updateRes).toEqual(compare)
        expect(updateRes.id).toBe(wasser.id)
    })

    test("Negativetest Invalid shoplist ID ", async () => {
        const request = supertest(app);
        const update: ShopItemResource = { id: wasser.id, creator: john.id!, shopList: johnList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shopitem/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)
        expect(response.statusCode).toBe(400)
    })

    test("Negativetest Invalid creator ID ", async () => {
        const request = supertest(app)
        const update: ShopItemResource = { creator: NON_EXISTING_ID, shopList: johnList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shoplist/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)
        expect(response.statusCode).toBe(400)
    })

    test("creator of shoplist and item is diffrent than logged in user", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: max.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })

        const update: ShopItemResource = { id: milch.id, creator: max.id!, shopList: maxList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shopitem/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)

            expect(response.statusCode).toBe(403)
    })

    test("diffrent creator of item and shoplist but resource is the same as logged in user, negativetest", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: max.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })

        const update: ShopItemResource = { id: milch.id, creator: max.id!, shopList: johnList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shopitem/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)

            expect(response.statusCode).toBe(403)
    })
    test("creator of item is the same but diffrent of list", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: john.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })

        const update: ShopItemResource = { id: milch.id, creator: max.id!, shopList: maxList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shopitem/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)

            expect(response.statusCode).toBe(200)
    })

    test("creator of list is the same but diffrent of item", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: max.id!, shopList: johnList.id!, name: "Milch", quantity: "200" })

        const update: ShopItemResource = { id: milch.id, creator: max.id!, shopList: johnList.id!, name: "Holz", quantity: "200" }

        const response = await request.put(`/api/shopitem/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)

            expect(response.statusCode).toBe(200)
    })
})

describe("shopitem DELETE", () => {

    test("Positivtest", async () => {
        const request = supertest(app);
        const response = await request.delete(`/api/shopitem/${wasser.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(204)
    })

    test("Negativetest non existend ID", async () => {
        const request = supertest(app)
        const response = await request.delete(`/api/shopitem/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(400)
    })

    test("creator of list and item is diffrent, negative", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: max.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })
       
        const response = await request.delete(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(403)
    })

    test("creator of list is the same but item is diffrent", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: max.id!, shopList: johnList.id!, name: "Milch", quantity: "200" })
       
        const response = await request.delete(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(204)
    })

    test("creator of item is the same but list is diffrent", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        let milch = await createShopItem({ creator: john.id!, shopList: maxList.id!, name: "Milch", quantity: "200" })
       
        const response = await request.delete(`/api/shopitem/${milch.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(204)
    })
})

describe("shopitem Auth", () => {

    test("Undefined token", async () => {
        const request = supertest(app)
        const response = await request.delete(`/api/shopitem/${wasser.id}`)
            .set("Authorization", `Bearer ${undefined}`)
        expect(response).not.statusCode(400);
        expect(response).not.statusCode(404);
        expect(response.statusCode).toBe(401);
    })

})
