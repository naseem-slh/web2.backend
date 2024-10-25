import { IUser, User } from "../../src/model/UserModel"
import { createUser, deleteUser, getUsers, updateUser } from "../../src/services/UsersService";
import DB from "../DB";

const johnData: IUser = { email: "john@doe.de", name: "John", password: "1234", admin: false }
let idJohn: string
const NON_EXISTING_ID = "635d2e796ea2e8c9bde5787c";


beforeAll(async () => await DB.connect())
beforeEach(async () => {
    await User.syncIndexes()
    const john = await User.create(johnData)
    idJohn = john.id;
})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())


test("getUsers mit vorab angelegten Usern", async () => {
    const userResource = await getUsers();
    expect(userResource.users.length).toBe(1);
    expect(userResource.users.find(ur => ur.email === "john@doe.de")?.name).toBe("John")
})

test("getUsers, Passwörter werden nicht zurückgegeben", async () => {
    const userResource = await getUsers();
    expect(userResource.users.length).toBe(1);
    expect(userResource.users.every(ur => !ur.password)).toBeTruthy()
})

test("createUser Jack", async () => {
    const userResource = await createUser({ name: "Jack", email: "jack@doe.de", password: "Hallo", admin: false })
    expect(userResource.name).toBe("Jack")
    expect(userResource.email).toBe("jack@doe.de")
    expect(userResource.admin).toBe(false)
})


test("createUser und getUsers ist konsistent", async () => {
    await createUser({ name: "Jack", email: "jack@doe.de", password: "Hallo", admin: false })
    const userResource = await getUsers();
    expect(userResource.users.length).toBe(2);
    expect(userResource.users.find(ur => ur.email === "jack@doe.de")?.name).toBe("Jack")
    expect(userResource.users.every(ur => !ur.password)).toBeTruthy()
})

/**
 * Hier als Hilfsfunktion, um unabhängig von AuthenticationService zu sein
 */
async function getSingleUser(email: string) {
    const usersResource = await getUsers();
    const userResource = usersResource.users.find(ur => ur.email === email);
    if (!userResource) {
        throw new Error(`Keinen User mit E-Mail ${email} gefunden, kann ID nicht ermitteln.`)
    }
    return userResource;
}

test("updateUser, Name kann geändert werden", async () => {
    const userResource = await getSingleUser("john@doe.de");
    userResource.name = "John Boy";
    const updatedResource = await updateUser(userResource);
    expect(updatedResource.name).toBe("John Boy");
})

test("deleteUser eines existierenden Benutzers", async () => {
    await deleteUser(idJohn);
    const user = await User.findById(idJohn).exec();
    expect(user).toBeFalsy();
});

test("deleteUser missing id", async () => {
    await expect( deleteUser('')).rejects.toThrow("No id given, cannot delete user.")
})

test("updateUser, no user found", async () => {
    const userResource = await getSingleUser("john@doe.de");
    await deleteUser(idJohn)
    await expect(updateUser(userResource)).rejects.toThrow(`No user with id ${userResource.id} found, cannot update`)
})

test("updateUser, userid missing", async () => {
    const userResource = await getSingleUser("john@doe.de");
    userResource.id = undefined
    await expect( updateUser(userResource)).rejects.toThrowError("User id missing, cannot update")
})