import { IUser, User } from "../../src/model/UserModel";
import DB from "../DB";
import { logger } from "../../src/logger";

beforeAll(async () => await DB.connect())
afterEach(async () => await DB.clear())
afterAll(async () => await DB.close())

test("addUser", async () => {
    const user = new User({ name: "John", email: "john@doe.com", password: "123" })
    const res = await user.save();
    expect(res).toBeDefined();
    expect(res.name).toBe("John");
    expect(res.id).toBeDefined();
})

test("Constraints Admin", async () => {
    const user = new User({ name: "John", email: "john@doe.com", password: "123" })
    const res = await user.save();
    expect(res.admin).toBe(false)
})

test("Required Name Negative", async () => {
    try {
        const user = new User({ email: "john@doe.com", password: "123" })
        const res = await user.save()
    }
    catch (error) {
        expect(error).toBeInstanceOf(Error)
        logger.error("Error: " + error)
    }
})

test("Required Email Negative", async () => {
    try {
        const user = new User({ name: "john@doe.com", password: "123" })
        await user.save()
    }
    catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
})

test("Doppelte Email(Unique test)", async () => {
    try {
        const user = new User({ name: "John", email: "john@doe.com", password: "123" })
        const user2 = new User({ name: "Bob", email: "john@doe.com", password: "123" })
        await user.save()
        await user2.save()
    }
    catch (error) {
        expect(error).toBeInstanceOf(Error)
        logger.error
    }
})

test("updateOne and findeOne", async () => {
    const user = new User({ name: "John", email: "john@doe.com", password: "123" })
    const res = await user.save();

    const updateResult = await User.updateOne({ email: "john@doe.com" }, { name: "Bob", email: "bob@bht.de" });
    expect(updateResult.matchedCount).toBe(1);
    expect(updateResult.modifiedCount).toBe(1);
    expect(updateResult.acknowledged).toBeTruthy();

    const u2 = await User.findOne({ email: "john@doe.com" }).exec();
    if (u2) {
        throw new Error("User nach Update gefunden, obwohl EMail verändert wurde")
    }

    const u3 = await User.findOne({ email: "bob@bht.de" }).exec();
    if (!u3) {
        throw new Error("Use nach Update unter neuer EMail nicht gefunden")
    }
    expect(u3.name).toBe("Bob");

})

test("Positiv Admin", async () => {
    const user = new User({ name: "John", email: "john@doe.com", password: "123", admin: true })
    const res = await user.save()
    expect(res.admin).toBe(true)
})


test("duplicate User", async () => {
    try {
        const user = new User({ name: "John", email: "john@doe.com", password: "123" })
        const user2 = new User({ name: "John", email: "john@doe.com", password: "123" })
        await user.save()
        await user2.save()
    }
    catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
})

test("Duplicate email with rejects", async () => {
    const user = new User({ name: "John", email: "johnX@some-host.de", password: "123" });
    const savedUser = await user.save();
    expect(savedUser).toBeDefined();
    const user2 = new User({ name: "Jack", email: "johnX@some-host.de", password: "1233" });
    await expect(user2.save()).rejects.toThrow(Error);
});

test("Delete User", async () => {
    const user = new User({ name: "John", email: "johnX@some-host.de", password: "123" });
    await user.save()
    let UserList = await User.find({ email: "johnX@some-host.de" }).exec();
    expect(UserList.length).toBe(1);
    user.deleteOne()
    UserList = await User.find({ email: "johnX@some-host.de" }).exec();
    expect(UserList.length).toBe(0);
})


test("isCorrectPassword with saved user", async () => {
    const john: IUser = { email: "john@doe.de", name: "John", password: "1234" }
    const user = new User(john)
    expect(user).toBeDefined();
    expect(user.name).toBe(john.name);

    // we have not saved yet
    expect(user.password).toBe(john.password);

    await user.save()
    // pre-save hook has hashed password
    expect(user.password).not.toBe(john.password);

    expect(await user.isCorrectPassword(john.password)).toBeTruthy();
    expect(await user.isCorrectPassword("Another password")).toBeFalsy();
    expect(await user.isCorrectPassword(user.password)).toBeFalsy();
})
