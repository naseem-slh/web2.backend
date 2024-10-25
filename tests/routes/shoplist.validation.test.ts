import supertest from "supertest";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, ShopListResource, UserResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList } from "../../src/services/ShopListService";
import { ShopList } from "../../src/model/ShopListModel";
import "restmatcher";

let john: UserResource
let johnList: ShopListResource
let token:string
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "123asdf!ABCD", admin: false })
    johnList = await createShopList({ creator: john.id!, store: "IKEA" })
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

test("shopList POST, store is no string", async () => {
    const request = supertest(app)
    const list = { creator: john.id!, store: true }
    const response = await request.post(`/api/shoplist`).send(list)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "store" })
})

test("shopList POST, store length = 0", async () => {
    const request = supertest(app)
    const list = { creator: john.id!, store: "" }
    const response = await request.post(`/api/shoplist`).send(list)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "store" })
})

test("shopList POST, store length > 100", async () => {
    const request = supertest(app)
    let x = "aa"
    const list = { creator: john.id!, store: x.repeat(51) }
    const response = await request.post(`/api/shoplist`).send(list)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "store" })
})

test("shopList POST, public is no boolean", async () => {
    const request = supertest(app)
    const list = { creator: john.id!, store: "IKEA", public: "ss" }
    const response = await request.post(`/api/shoplist`).send(list)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "public" })
})

test("shopList POST, done is no boolean", async () => {
    const request = supertest(app)
    const list = { creator: john.id!, store: "IKEA", done: "ss" }
    const response = await request.post(`/api/shoplist`).send(list)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "done" })
})

test("shopList POST, creator has no mongoID", async () => {
    const request = supertest(app)
    const list = { creator: "s", store: "IKEA" }
    const response = await request.post(`/api/shoplist`).send(list)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "creator" })
})

test("shopList GET, no mongoID", async () => {
    const request = supertest(app)
    const response = await request.get(`/api/shoplist/${"123"}`)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ params: "shoplistID" })
})

test("shoplist PUT, params ID faulty", async () => {
    const request = supertest(app);
    const update = { id: johnList.id, creator: john.id!, store: "Kaufland", public: false, done: false }

    const response = await request.put(`/api/shoplist/${"123"}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ params: "shoplistID" })
})

test("shoplist PUT, creator ID faulty", async () => {
    const request = supertest(app);
    const update = { id: johnList.id, creator: "123", store: "Kaufland", public: false, done: false }

    const response = await request.put(`/api/shoplist/${johnList.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "creator" })
})

test("shoplist PUT, body ID faulty", async () => {
    const request = supertest(app);
    const update = { id: "123", creator: john.id, store: "Kaufland", public: false, done: false }

    const response = await request.put(`/api/shoplist/${johnList.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "id" })
})

test("shoplist PUT, diffrent id check", async () => {
    const request = supertest(app);
    const update = { id: johnList.id, creator: john.id, store: "Kaufland", public: false, done: false }

    const response = await request.put(`/api/shoplist/${NON_EXISTING_ID}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(400)    
})

test("shoplist DELETE, no mongoID", async () => {
    const request = supertest(app);
    const response = await request.delete(`/api/shoplist/${"123"}}`)
    .set("Authorization", `Bearer ${token}`)

    expect(response).toHaveValidationErrorsExactly({ params: "shoplistID" })
})