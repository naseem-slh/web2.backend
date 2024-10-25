// Vgl. Folie 126 (SuperTest)

import app from "../../src/app";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, UserResource,UsersResource } from "../../src/Resources";
import DB from "../DB";
import supertest from "supertest"
import { User } from "../../src/model/UserModel";

let john: UserResource
let jj: UserResource
let token: string

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    // Wir verwenden hier Service-Methoden!
    john = await createUser({ name: "John", email: "john@doe.de", password: "123", admin: false })
    jj = await createUser({ name: "JJ", email: "john@some-host.de", password: "123asdf!ABCD", admin: true })

    // Login um Token zu erhalten
    const request = supertest(app);
    const loginData = { email: "john@some-host.de", password: "123asdf!ABCD" };
    const response = await request.post(`/api/login`).send(loginData);
    const loginResource = response.body as LoginResource;
    token = loginResource.access_token;
    expect(token).toBeDefined();
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})

test("users GET, Positivtest", async () => {
    const request = supertest(app);
    const response = await request.get(`/api/users`)
    .set("Authorization", `Bearer ${token}`)
    expect(response.statusCode).toBe(200);

    const usersRes = response.body as UsersResource;
    expect(usersRes).toEqual({users: [john,jj]});
})
