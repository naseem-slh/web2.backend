import supertest from "supertest";
import app from "../../src/app";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, ShopListResource, ShopperResource, UserResource } from "../../src/Resources";
import DB from "../DB";
import { createShopList, deleteShopList } from "../../src/services/ShopListService";

let john: UserResource
let max: UserResource
let jj: UserResource
let token: string
let publicListMax: ShopListResource
let nonPublicList: ShopListResource
let publicList: ShopListResource
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

beforeAll(async () => {
    await DB.connect();
})
beforeEach(async () => {
    john = await createUser({ name: "John", email: "john@doe.de", password: "123asdf!ABCD", admin: false })
    max = await createUser({ name: "Max", email: "max@doe.de", password: "123", admin: true })
    nonPublicList = await createShopList({ creator: john.id!, store: "IKEA" })
    publicList = await createShopList({ creator: john.id!, store: "Schlecker", public: true })
    publicListMax = await createShopList({ creator: max.id!, store: "OBI", public: true })

    // Login um Token zu erhalten
    const request = supertest(app);
    const loginData = { email: "john@doe.de", password: "123asdf!ABCD"};
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => {
    await DB.close()
})


test("shopper GET, Positivetest returns public lists and johns list", async () => {
    const request = supertest(app)
    const shopLists: ShopperResource = { shopLists: [] }
    shopLists.shopLists.push( nonPublicList,publicList, publicListMax)

    const response = await request.get("/api/shopper")
    .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(200)

    const res = response.body as ShopperResource
    expect(res).toEqual(shopLists)
})

test("shopper GET, Positivetest no authentication, returns only public lists", async () => {
    const request = supertest(app)
    const shopLists: ShopperResource = { shopLists: [] }
    shopLists.shopLists.push(publicList, publicListMax)

    const response = await request.get("/api/shopper")
    expect(response.statusCode).toBe(200)

    const res = response.body as ShopperResource
    expect(res).toEqual(shopLists)
})

test("shopper GET, deleted public lists", async () => {
    const request = supertest(app)
    await deleteShopList(publicList.id!)
    await deleteShopList(publicListMax.id!)
    const response = await request.get("/api/shopper")
    const res = response.body as ShopperResource
    expect(res.shopLists.length).toBe(0)
})