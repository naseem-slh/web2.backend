import { HydratedDocument } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import { login } from "../../src/services/AuthenticationService";
import DB from "../DB";

let user: HydratedDocument<IUser>
beforeAll(async () => await DB.connect())
beforeEach(async () => {
    await User.syncIndexes()
    user = await User.create({ name: "Max", email: "max @doe.com", password: "123" });
})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())

test("login with user in database", async () => {
    const res = await login(user.email, "123")
    expect(res).toBeDefined()
    expect(res.success).toBe(true)
    expect(res.id).toBe(user.id)
    expect(res.name).toBe(user.name)
})

test("login with non existend user ", async () => {
    const res = await login(user.email, "wrongpassword")
    expect(res).toBeDefined()
    expect(res.success).toBe(false)
    expect(res.id).toBe(undefined)
})

test("login with no email ", async () => {
    const res = await login("wrongMail@live.de", "wrongpassword")
    expect(res).toBeDefined()
    expect(res.success).toBe(false)
    expect(res.id).toBe(undefined)
})