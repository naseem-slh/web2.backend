import supertest from "supertest";
import app from "../../src/app";
import { User } from "../../src/model/UserModel";
import { createUser } from "../../src/services/UsersService";
import { LoginResource, UserResource } from "../../src/Resources";
import DB from "../DB";
import "restmatcher";

let john: UserResource
let ali: UserResource
let jj: UserResource
let token: string

const NON_EXISTING_ID = "61526f7f3c32f51f9f1836a7";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    john = await createUser({ name: "John", email: "john@doe.de", password: "abcdefghiJkl1$", admin: false })
    ali = await createUser({ name: "Ali", email: "ali@doe.de", password: "abcdefghiJkl1$", admin: false })
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

test("user POST, email without @", async () => {
    const request = supertest(app);
    const jane = { name: "jane", email: "joedoe.de", password: "abcdefghiJkl1$", admin: false }
    const response = await request.post(`/api/user`).send(jane)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "email" })
})

test("user POST, email normalization", async () => {
    const request = supertest(app);
    const jane = { name: "jane", email: "KKlK@doe.de", password: "abcdefghiJkl1$", admin: false }
    const response = await request.post(`/api/user`).send(jane)
        .set("Authorization", `Bearer ${token}`)
    expect(response.body.email).toBe("kklk@doe.de")
})

test("user POST, admin is not booelan", async () => {
    const request = supertest(app);
    const jane = { name: "jane", email: "KKlK@doe.de", password: "abcdefghiJkl1$", admin: "string" }
    const response = await request.post(`/api/user`).send(jane)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "admin" })
})

test("user POST, name is not string", async () => {
    const request = supertest(app);
    const jane = { name: true, email: "KKlK@doe.de", password: "abcdefghiJkl1$", admin: false }
    const response = await request.post(`/api/user`).send(jane)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "name" })
})

test("user POST, weak password", async () => {
    const request = supertest(app);
    const jane = { name: "joey", email: "KKlK@doe.de", password: "abcdefghiJkl1", admin: false }
    const response = await request.post(`/api/user`).send(jane)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "password" })
})

test("user PUT, wrong params ID", async () => {
    const request = supertest(app);
    const update: UserResource = { id: john.id, name: "Lala", email: "lala@doe.de", admin: false }

    const response = await request.put(`/api/user/${"234"}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ params: "userID" })
})

test("user PUT, wrong ID of body", async () => {
    const request = supertest(app);
    const update: UserResource = { id: "123", name: "Lala", email: "lala@doe.de", admin: false }

    const response = await request.put(`/api/user/${john.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "id" })
})

test("user PUT, name is not string", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: 2, email: "kk@doe.de", password: "abcdefghiJkl1$", admin: false }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "name" })
})

test("user PUT, email is no mail", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: "jack", email: "kkdoe.de", password: "abcdefghiJkl1$", admin: false }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "email" })
})

test("user PUT, email normalization", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: "jack", email: "KK@doe.de", password: "abcdefghiJkl1$", admin: false }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response.body.email).toBe("kk@doe.de")
})


test("user PUT,password not long enough", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: "jack", email: "KK@doe.de", password: "Jkl1$", admin: false }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "password" })
})

test("user PUT, admin no boolean", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: "jack", email: "KK@doe.de", password: "abcdefghiJkl1$", admin: 2 }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "admin" })
})

test("user PUT, email to long", async () => {
    const request = supertest(app);
    let mail = "e"
    const update = { id: john.id, name: "jack", email: mail.repeat(101) + "@hh.de", password: "abcdefghiJkl1$", admin: true }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "email" })
})

test("user PUT, name to long", async () => {
    const request = supertest(app);
    let name = "e"
    const update = { id: john.id, name: name.repeat(101), email: "mm@oo.de", password: "abcdefghiJkl1$", admin: true }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "name" })
})

test("user PUT, password to long", async () => {
    const request = supertest(app);
    let psw = "ab$defghiJkl1"
    const update = { id: john.id, name: "mikey", email: "mm@oo.de", password: psw.repeat(50), admin: true }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "password" })
})

test("user PUT, name too short", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: "", email: "KK@doe.de", password: "abcdefghiJkl1$", admin: true }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ body: "name" })
})

test("user PUT, optional test", async () => {
    const request = supertest(app);
    const update = { id: john.id, name: "mikey", email: "KK@doe.de", admin: true }

    const response = await request.put(`/api/user/${update.id}`).send(update)
        .set("Authorization", `Bearer ${token}`)
    expect(response.body.password).not.toBeDefined()
    expect(response.body.name).toBe("mikey")

})

test("user DELETE, no mongoID", async () => {
    const request = supertest(app);
    const response = await request.delete(`/api/user/${"noID"}`)
        .set("Authorization", `Bearer ${token}`)
    expect(response).toHaveValidationErrorsExactly({ params: "userID" })
});