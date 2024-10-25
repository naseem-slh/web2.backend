import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import { LoginResource } from "../../src/Resources";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import DB from "../DB";

let strongPW = "123asdf!ABCD"

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    User.syncIndexes();
    await createUser({ name: "John", email: "john@some-host.de", password: strongPW, admin: false })
})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})


describe("login POST", () => {
    it("should be a positive login", async () => {
        const request = supertest(app);
        const loginData = { email: "john@some-host.de", password: strongPW };
        const response = await request.post(`/api/login`).send(loginData);
        const loginResource = response.body as LoginResource;
        const token = loginResource.access_token;
        expect(token).toBeDefined();
    });

    it("negative, false email", async () => {
        const request = supertest(app)
        const loginData = { email: "johnnyt.de", password: strongPW }
        const response = await request.post(`/api/login`).send(loginData)
        expect(response.statusCode).toBe(401)
    })

    it("negative, false password", async () => {
        const request = supertest(app)
        const loginData = { email: "john@some-host.de", password: strongPW + "1"}
        const response = await request.post(`/api/login`).send(loginData)
        expect(response.statusCode).toBe(401)
    })
    it("negative, non string password", async () => {
        const request = supertest(app)
        const loginData = { email: "john@some-host.de", password: 1244}
        const response = await request.post(`/api/login`).send(loginData)
        expect(response.statusCode).toBe(400)
    })

    it("negative, weak password", async () => {
        const request = supertest(app)
        const loginData = { email: "john@some-host.de", password: "ssd1"}
        const response = await request.post(`/api/login`).send(loginData)
        expect(response.statusCode).toBe(400)
    })

})
