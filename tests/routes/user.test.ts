// Vgl. Folie 126 (SuperTest)

import supertest from "supertest";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, UserResource, UsersResource } from "../../src/Resources";
import DB from "../DB";
import "restmatcher";


let john: UserResource
let ali: UserResource
let jj: UserResource

const NON_EXISTING_ID = "61526f7f3c32f51f9f1836a7";
let token: string

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    User.syncIndexes();
    // Wir verwenden hier Service-Funktionen!
    john = await createUser({ name: "John", email: "john@doe.de", password: "abcdefghiJkl1$", admin: false })
    ali = await createUser({ name: "Ali", email: "ali@doe.de", password: "abcdefghiJkl1$", admin: false })
    // create a use and login
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

describe("user POST", () => {

    test("Positivtest", async () => {
        const request = supertest(app);


        const jane: UserResource = { name: "Jane", email: "jane@doe.de", password: "abcdefghiJkl1$", admin: false };
        const response = await request.post(`/api/user`)
            .set("Authorization", `Bearer ${token}`)
            .send(jane)
        const janeModel = await User.findOne({ email: "jane@doe.de" });
        expect(janeModel).toBeDefined();

        expect(response.statusCode).toBe(201);
        const userRes = response.body as UserResource;
        const { password, ...expected } = { ...jane, id: janeModel!.id };
        expect(userRes).toEqual(expected);
    });

    test("negativtest duplicate email", async () => {
        const request = supertest(app);
        const jane: UserResource = { name: "jane", email: "john@doe.de", password: "abcdefghiJkl1$", admin: false };
        const response = await request.post(`/api/user`)
            .send(jane)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(400);
    });
})

describe("user PUT ", () => {
    test("Positivtest", async () => {
        const request = supertest(app);
        const update: UserResource = { id: john.id, name: "Jane", email: "jane@doe.de", admin: false }

        const response = await request.put(`/api/user/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update);

        expect(response.statusCode).toBe(200);
        const updateRes = response.body as UserResource;
        expect(updateRes).toEqual({ ...update });
    });

    test("Negativetest", async () => {
        const request = supertest(app);
        const update: UserResource = { id: john.id, name: "jane", email: "jane@doe.de", admin: false }

        const response = await request.put(`/api/user/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update);
        expect(response.statusCode).toBe(400);
    });

    test("Negativetest name already in use", async () => {
        const request = supertest(app);
        const update: UserResource = { id: john.id, name: "Ali", email: "jane@doe.de", admin: false }

        const response = await request.put(`/api/user/${update.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update);
        expect(response.statusCode).toBe(400);
    });

    test("Negativetest invalid id", async () => {
        const request = supertest(app);
        const update: UserResource = { id: john.id, name: "Mark", email: "mike@doe.de", admin: false }

        const response = await request.put(`/api/user/${ali.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(update);
        expect(response.statusCode).toBe(400);
    });

    
    test("no administration rights", async () => {
        const request = supertest(app);
        const update: UserResource = { id: john.id, name: "Jane", email: "jane@doe.de", admin: false }
        const loginData = { email: "john@doe.de", password: "abcdefghiJkl1$"};
        const res = await request.post(`/api/login`).send(loginData);
        const loginResource = res.body as LoginResource;
        let tokenJohn = loginResource.access_token;
        expect(tokenJohn).toBeDefined();

        const response = await request.put(`/api/user/${update.id}`)
            .set("Authorization", `Bearer ${tokenJohn}`)
            .send(update);

        expect(response.statusCode).toBe(403);
    });
})

describe("user DELETE", () => {
    test(" Positivtest", async () => {
        const request = supertest(app);
        const response = await request.delete(`/api/user/${john.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(204);
    });

    test(" Negativetest non existend ID", async () => {
        const request = supertest(app);
        const response = await request.delete(`/api/user/${NON_EXISTING_ID}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(400);
    })

    test("User tries do delete itslef", async () => {
        const request = supertest(app);
        const response = await request.delete(`/api/user/${jj.id}`)
            .set("Authorization", `Bearer ${token}`)
            expect(response.statusCode).toBe(403);
    });

})

describe("user reqAuth", () => {

    test("Undefined token", async () => {
        const request = supertest(app);
        const jane: UserResource = { name: "Jane", email: "jane@doe.de", password: "abcdefghiJkl1$", admin: false };
        const response = await request.post(`/api/user`)
            .set("Authorization", `Bearer ${undefined}`)
            .send(jane)
        expect(response).not.statusCode(400);
        expect(response).not.statusCode(404);
        expect(response.statusCode).toBe(401);
    })

    test("Wrong token", async () => {
        const request = supertest(app);
        const jane: UserResource = { name: "Jane", email: "jane@doe.de", password: "abcdefghiJkl1$", admin: false };
        const response = await request.post(`/api/user`)
            .set("Authorization", `Bearer ${"eyundefinedsddsdv2342d"}`)
            .send(jane)
        expect(response).not.statusCode(400);
        expect(response).not.statusCode(404);
        expect(response.statusCode).toBe(401);
    })
})

describe("users optAuth", () => {
    test("no authentication, should be status 401", async () => {
        const request = supertest(app);
        const response = await request.get(`/api/users`);
        expect(response).not.statusCode(400);
        expect(response).not.statusCode(404);
        expect(response.statusCode).toBe(401);
    })

    test("with authentication, should still return list", async () => {
        const request = supertest(app);
        const response = await request.get(`/api/users`)
            .set("Authorization", `Bearer ${token}`)
        expect(response.statusCode).toBe(200)
        expect(response).not.statusCode("40x")
        const usersRes = response.body as UsersResource
        expect(usersRes).toEqual({ users: [john, ali, jj] })
    })

})