import supertest from "supertest";
import app from "../../src/app";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, ShopListResource, UserResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList } from "../../src/services/ShopListService";
import { ShopList } from "../../src/model/ShopListModel";
import { User } from "../../src/model/UserModel";

let john: UserResource
let johnList: ShopListResource
let token: string
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    User.syncIndexes()
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "123asdf!ABCD", admin: false })
    johnList = await createShopList({ creator: john.id!, store: "IKEA", public: true })

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
describe("shoplist POST", () => {

    test("Positivtest", async () => {
        const request = supertest(app)
        const obi: ShopListResource = { creator: john.id!, store: "OBI" }
        const response = await request.post(`/api/shoplist`)
            .set("Authorization", `Bearer ${token}`)
            .send(obi)

        const obiModel = await ShopList.findOne({ store: "OBI" })
        expect(obiModel).toBeDefined()

        expect(response.statusCode).toBe(201)
        const shopListRes = response.body as ShopListResource
        expect(shopListRes.id).toEqual(obiModel?.id)
        expect(shopListRes.creator).toEqual(john.id)
    })


    test("Negativetest invalid creator ID", async () => {
        const request = supertest(app)
        const list: ShopListResource = { creator: NON_EXISTING_ID, store: "IKEA" }
        const response = await request.post(`/api/shoplist`)
            .set("Authorization", `Bearer ${token}`)
            .send(list)
        expect(response.statusCode).toBe(400)
    })
})

describe("shoplist GET", () => {

    test("Positivetest", async () => {
        const request = supertest(app)
        const response = await request.get(`/api/shoplist/${johnList.id}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(200)

        const shopListRes = response.body as ShopListResource
        expect(shopListRes).toEqual(johnList)
    })

    test("negativetest ID not found", async () => {
        const request = supertest(app)
        const response = await request.get(`/api/shoplist/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(404)
    })


    test("non creator tries to view non public list", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: false })

        const response = await request.get(`/api/shoplist/${maxList.id}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(403)
    })

    test("non creator views public list, positivetest", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })

        const response = await request.get(`/api/shoplist/${maxList.id}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
    })
})

describe("shoplist PUT", () => {

    test("Positivetest", async () => {
        const request = supertest(app)
        const update: ShopListResource = { id: johnList.id, creator: john.id!, store: "Kaufland", public: false, done: false }

        const response = await request.put(`/api/shoplist/${update.id}`)
            .send(update)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        const updateRes = response.body as ShopListResource
        const compare = { ...johnList, store: update.store }
        expect(updateRes).toEqual(compare)
    })

    test("Negativetest Invalid shoplist ID, ids dont match ", async () => {
        const request = supertest(app);
        const update: ShopListResource = { id: johnList.id, creator: john.id!, store: "Kaufland", public: false, done: false }

        const response = await request.put(`/api/shoplist/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)
        expect(response.statusCode).toBe(400)
    })

    test("Negativetest Invalid creator ID ", async () => {
        const request = supertest(app)
        const update: ShopListResource = { creator: NON_EXISTING_ID, store: "Kaufland", public: false, done: false }

        const response = await request.put(`/api/shoplist/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)
        expect(response.statusCode).toBe(400)
    })

    test("non creator tries to modify List", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        const update: ShopListResource = {id:maxList.id, creator: max.id!, store: "Kaufland", public: false, done: false }

        const response = await request.put(`/api/shoplist/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update)
        expect(response.statusCode).toBe(403)
    })
})

describe("shoplist DELETE", () => {

    test("Positivtest", async () => {
        const request = supertest(app);
        const response = await request.delete(`/api/shoplist/${johnList.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(204)
    })

    test("Negativetest non existend ID", async () => {
        const request = supertest(app)
        const response = await request.delete(`/api/shoplist/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(400)
    })

    test("non creator tries to delete", async () => {
        const request = supertest(app)
        let max = await createUser({ name: "Max", email: "max@doe.de", password: "123asdf!ABCD", admin: false })
        let maxList = await createShopList({ creator: max.id!, store: "LIDL", public: true })
        const response = await request.delete(`/api/shoplist/${maxList.id}`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(403)
    })


})