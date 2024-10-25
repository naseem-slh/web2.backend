import DB from "../DB";
import { verifyJWT, verifyPasswordAndCreateJWT } from "../../src/services/JWTService";
import { UserResource } from "../../src/Resources";
import { createUser } from "../../src/services/UsersService";
import jwt, { verify } from 'jsonwebtoken';

let john: UserResource
let ali: UserResource
const NON_EXISTING_ID = "61526f7f3c32f51f9f1836a7";

beforeAll(async () => { await DB.connect(); })
beforeEach(async () => {
    john = await createUser({ name: "John", email: "john@doe.de", password: "abcdefghiJkl1$", admin: true })
    ali = await createUser({ name: "Ali", email: "ali@doe.de", password: "abcdefghiJkl1$", admin: false })

})
afterEach(async () => { await DB.clear(); })
afterAll(async () => {
    await DB.close()
})
describe("verifyPasswordAndCreateJWT", () => {

    it("should create a JWT without errors", async () => {
        const res = await verifyPasswordAndCreateJWT("john@doe.de", "abcdefghiJkl1$")
        expect(res).toBeDefined()
    })

    test("should find no User and return undefined", async () => {
        const res = await verifyPasswordAndCreateJWT("marydfgddfg@doe.de", "abcdefghiJkl1$")
        expect(res).toBe(undefined)
    })

    it("should have the wrong password and retunr undefined", async () => {
        const res = await verifyPasswordAndCreateJWT("john@doe.de", "wrongpassword")
        expect(res).toBe(undefined)
    })

})

describe("verifyJWT", () => {

    it("should verify the JWT and return ID and Role of the user", async () => {
        const jwt = await verifyPasswordAndCreateJWT("john@doe.de", "abcdefghiJkl1$")
        const res = verifyJWT(jwt)
        expect(res).toBeDefined()
        expect(res.role).toBe("a")
        expect(res.userId).toBe(john.id)
    })

    it("should throw an error because JWT is undefined", () => {
        expect(() => verifyJWT(undefined)).toThrow("invalid_token")
    })


})