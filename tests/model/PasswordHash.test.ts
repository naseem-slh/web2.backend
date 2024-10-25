import { log } from "console";
import { IUser, User } from "../../src/model/UserModel";
import DB from "../DB";
import { HydratedDocument } from "mongoose";
import { logger } from "../../src/logger";

let john: HydratedDocument<IUser>
let mike: HydratedDocument<IUser>
let loui: HydratedDocument<IUser>

beforeAll(async () => await DB.connect())
beforeEach(async () => {
    john = await User.create({ name: "John", email: "john@doe.com", password: "123" })
    mike = await User.create({ name: "Mike", email: "mike@doe.com", password: "123" })
    loui = await User.create({ name: "Loui", email: "loui@doe.com", password: "123" })
})
afterEach(async () => await DB.clear())
afterAll(async () => await DB.close())

test("creating john testing and for Hashed password", async () => {
    expect(john.password).not.toBe("123")
})

test("updateOne User and changing the password", async () => {
    const oldPassword = john.password
    await User.updateOne(({ name: "John" }), { password: "321" });
    const u2 = await User.findOne({ name: "John" }).exec();
    if (!u2) {
        throw new Error("User nicht gefunden")
    }
    expect(u2.password).not.toBe(oldPassword)
    expect(u2.password).not.toBe("321")
})

test("updateMany only update One and change password", async () => {
    const oldPasswordMike = mike.password
    await User.updateMany(({ name: "Mike" }), { password: "321" })
    const newMike = await User.findOne({ name: "Mike" }).exec()
    expect(oldPasswordMike).not.toBe(newMike?.password)
})

test("updateMany finds multiple. Check for duplicate and old compare with old password", async () => {
    const oldPasswordJohn = john.password
    const oldPasswordMike = mike.password
    await User.updateMany({ admin: false }, { password: "321" }).exec()
    const newMike = await User.findOne({ name: "Mike" }).exec()
    const newJohn = await User.findOne({ name: "John" }).exec()
    const newLoui = await User.findOne({ name: "Loui" }).exec()

    expect(oldPasswordJohn).not.toBe(newJohn?.password)
    expect(oldPasswordMike).not.toBe(newMike?.password)
})

test("check password method returns false for incorrect password", async () => {
    //is correctPasswort nur aufrufbar mit new User. vielleicht wegen hydratedDocument?
    let test = new User(
        {
            email: "mia@doe.de",
            name: "Mia",
            password: "1234"
        });
    await test.save()

    const isCorrectPassword = await test.isCorrectPassword("wrongpassword")
    expect(isCorrectPassword).toBe(false)
})

test("check password method returns true for correct password", async () => {
    //is correctPasswort nur aufrufbar mit new User. vielleicht wegen hydratedDocument?
    let test = new User(
        {
            email: "mia@doe.de",
            name: "Mia",
            password: "1234"
        })
    await test.save()
    const isCorrectPassword = await test.isCorrectPassword("1234")
    expect(isCorrectPassword).toBe(true)
})

