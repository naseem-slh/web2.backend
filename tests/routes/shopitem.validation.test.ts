import supertest from "supertest";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import { ShopListResource, UserResource, ShopItemResource, LoginResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList } from "../../src/services/ShopListService";
import { createShopItem } from "../../src/services/ShopItemService";
import { ShopItem } from "../../src/model/ShopItemModel";
import "restmatcher";

let john: UserResource
let johnList: ShopListResource
let wasser: ShopItemResource
let token:string
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    john = await createUser({ name: "John", email: "john@doe.de", password: "123asdf!ABCD", admin: false })
    johnList = await createShopList({ creator: john.id!, store: "IKEA" })
    wasser = await createShopItem({ creator: john.id!, shopList: johnList.id!, name: "wasser", quantity: "200" })

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

test("shopitem POST, name is no string", async () => {
    const request = supertest(app)
    const res = { creator: john.id, shopList: johnList.id!, name: 2, quantity: "111" }
    const response = await request.post(`/api/shopitem`).send(res)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"name"})
})

test("shopitem POST, name length above 100", async () => {
    const request = supertest(app)
    let a = "aa"
    const res = { creator: john.id, shopList: johnList.id!, name: a.repeat(51), quantity: "111" }
    const response = await request.post(`/api/shopitem`).send(res)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"name"})
})

test("shopitem POST, quantity length 0", async () => {
    const request = supertest(app)
    const res = { creator: john.id, shopList: johnList.id!, name: "wasser", quantity: "" }
    const response = await request.post(`/api/shopitem`).send(res)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"quantity"})
})

test("shopitem POST, creator faulty ID", async () => {
    const request = supertest(app)
    const res = { creator: "noID", shopList: johnList.id!, name: "wasser", quantity: "3" }
    const response = await request.post(`/api/shopitem`).send(res)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"creator"})
})

test("shopitem POST, shopList faulty ID", async () => {
    const request = supertest(app)
    const res = { creator: john.id, shopList: "noID", name: "wasser", quantity: "33" }
    const response = await request.post(`/api/shopitem`).send(res)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"shopList"})
})

test("shopitem POST, creation without optional remarks", async () => {
    const request = supertest(app)
    const res = { creator: john.id, shopList: johnList.id, name: "wasser", quantity: "2" }
    const response = await request.post(`/api/shopitem`).send(res)
    .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(201)
})

test("shopitem GET, no valid mongoId", async () => {
    const request = supertest(app)
    const response = await request.get(`/api/shopitem/${"noID"}`)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({params:"shopitemID"})
})

test("shopitem PUT, not matching IDs", async () => {
    const request = supertest(app);
    const update: ShopItemResource = {id:wasser.id, creator: john.id!, shopList: johnList.id!, name: "Holz", quantity: "200" }
    
    const response = await request.put(`/api/shopitem/${NON_EXISTING_ID}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(400)
})

test("shopitem PUT, without optionals quantity and remarks", async () => {
    const request = supertest(app);
    const update = {id:wasser.id, creator: john.id!, shopList: johnList.id!, name: "Holz",quantity:"22"}
    
    const response = await request.put(`/api/shopitem/${update.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(200)
    expect(response).toHaveNoValidationErrors()
})

test("shopitem PUT, id of item is invalid", async () => {
    const request = supertest(app);
    const update = {id:"noID", creator: john.id!, shopList: johnList.id!, name: "Holz",quantity:"22"}
    
    const response = await request.put(`/api/shopitem/${wasser.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"id"})
})

test("shopitem PUT, params invalid ID", async () => {
    const request = supertest(app);
    const update = {id:wasser.id, creator: john.id!, shopList: johnList.id!, name: "Holz",quantity:"22"}
    
    const response = await request.put(`/api/shopitem/${"noID"}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({params:"shopitemID"})
})

test("shopitem PUT, name is no string", async () => {
    const request = supertest(app);
    const update = {id:wasser.id, creator: john.id!, shopList: johnList.id!, name: true,quantity:"22"}
    
    const response = await request.put(`/api/shopitem/${update.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"name"})
})

test("shopitem PUT, remarks length = 0", async () => {
    const request = supertest(app);
    const update = {id:wasser.id, creator: john.id!, shopList: johnList.id!,name:"wasser", remarks:"",quantity:"22"}
    
    const response = await request.put(`/api/shopitem/${update.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"remarks"})
})

test("shopitem PUT, missing non optional field creator", async () => {
    const request = supertest(app);
    const update = {id:wasser.id,shopList: johnList.id!,name:"wasser", quantity:"22"}
    
    const response = await request.put(`/api/shopitem/${update.id}`).send(update)
    .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({body:"creator"})
})

test("user DELETE, no valid mongoID", async() => {
    const request = supertest(app)
    const response = await request.delete(`/api/shopitem/${"noID"}`)
    .set("Authorization", `Bearer ${token}`)
    
    expect(response).toHaveValidationErrorsExactly({params:"shopitemID"})
})