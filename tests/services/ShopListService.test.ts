import { HydratedDocument, ObjectId, Types } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { createShopList, deleteShopList, getShopList, updateShopList } from "../../src/services/ShopListService";
import { IShopItem, ShopItem } from "../../src/model/ShopItemModel";
import { ShopListResource } from "../../src/Resources";

let user: HydratedDocument<IUser>
let liste: HydratedDocument<IShopList>
let item: HydratedDocument<IShopItem>
let item2: HydratedDocument<IShopItem>
let shopListResource: ShopListResource

beforeAll(async () => await DB.connect())
beforeEach(async () => {
    await User.syncIndexes()
    user = await User.create({ name: "Max", email: "max @doe.com", password: "123" });
    liste = await ShopList.create({ creator: user, store: "Lidl" })
    item = await ShopItem.create({ creator: user, shopList: liste, name: "Wasser", quantity: "22" })
    item2 = await ShopItem.create({ creator: user, shopList: liste, name: "H2O", quantity: "2" })
    shopListResource = { store: "Kaufland", creator: user.id }
})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())

//getShopList tests
test("getShopList positive test", async () => {
    const res = await getShopList(liste.id)
    expect(res.creator).toBe(user.id)
    expect(res.creatorName).toBe(user.name)
})

test("getShopList missing ID", async () => {
    var objectId = new Types.ObjectId('569ed8269353e9f4c51617aa');
    await expect(getShopList(objectId.toString())).rejects.toThrow(`No ShopList with id ${objectId} found, cannot update`)
})

test("getShopList missing ShopList", async () => {
    await ShopList.deleteOne(liste._id)
    await expect(getShopList(liste.id)).rejects.toThrow(`No ShopList with id ${liste.id} found, cannot update`)
})

test("getShopList correct ShopItem count", async () => {
    const res = await getShopList(liste.id)
    expect(res.shopItemCount).toBe(2)
})

//createShopList tests
test("createShopList and check for created instances", async () => {
    const res = await createShopList(shopListResource)
    expect(res.id).not.toBe(undefined)
    expect(res.creator).toBe(user.id)
    expect(res.store).toBe("Kaufland")
    expect(res.createdAt).not.toBe(undefined)
})

//updateShopList tests

test("positive test ", async () => {
    const res = await createShopList({ store: "REWE", creator: user.id })
    expect(res.store).toBe("REWE")
    res.store = "Müller"
    await updateShopList(res)
    expect(res.store).toBe("Müller")
})

test("missing shopList ", async () => {
    shopListResource.id = "569ed8269353e9f4c51617aa"
    await expect(updateShopList(shopListResource)).rejects.toThrow(`No ShopList with id ${shopListResource.id} found, cannot update`)
})

test(" missing ID ", async () => {
    shopListResource.id = undefined
    await expect(updateShopList(shopListResource)).rejects.toThrow(`No id: ${shopListResource.id} found, cannot update`)
})

test("changing a not editable field ", async () => {
    const res = await getShopList(liste.id)
    const userNew = await User.create({ name: "Maxi", email: "maxi@doe.com", password: "123" });
    expect(res.creator).toBe(user.id)
    res.creator = userNew.id
    const newRes = await updateShopList(res)
    expect(newRes.creator).not.toBe(userNew.id)
    expect(newRes.creator).toBe(user.id)
})

//deleteShopList tests

test("deleteUser eines existierenden Benutzers", async () => {
    await deleteShopList(liste.id)
    const res = await ShopList.findById(liste.id).exec();
    expect(res).toBeFalsy();
});


test("deleteShopList wrong deleteCount", async () => {
let id = "569ed8269353e9f4c51617aa"
    await expect(deleteShopList(id)).rejects.toThrowError(`No ShopList with id ${id} deleted, probably id not valid`)
})
