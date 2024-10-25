import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import { LoginResource } from "../../src/Resources";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";

import DB from "../DB";

let token: string
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // create a use and login
    User.syncIndexes();
    await createUser({ name: "John", email: "john@some-host.de", password: "123asdf!ABCD", admin: false })

    // Login um Token zu erhalten
    const request = supertest(app);
    const loginData = { email: "john@some-host.de", password: "123asdf!ABCD"};
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

test("delete shoplist -- without authorization: 401", async ()=>{
    const request = supertest(app);
    const response = await request
        .delete(`/api/shoplist/${NON_EXISTING_ID}`)
    expect(response).statusCode("401");
})

test("delete shoplist -- with authorization: not 401", async ()=>{
    const request = supertest(app);
    const response = await request
        .delete(`/api/shoplist/${NON_EXISTING_ID}`)
        .set("Authorization", `Bearer ${token}`) // setzen des Tokens mit Authentifizierung
    expect(response).not.statusCode("401");
    expect(response).not.statusCode("403");
    expect(response).statusCode("40x"); // 400 or 404
})