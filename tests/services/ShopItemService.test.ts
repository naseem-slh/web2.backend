import { HydratedDocument, ObjectId, Types } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { createShopItem, deleteShopItem, getShopItem, updateShopItem } from "../../src/services/ShopItemService";
import { IShopItem, ShopItem } from "../../src/model/ShopItemModel";
import { ShopItemResource } from "../../src/Resources";
import { updateShopList } from "../../src/services/ShopListService";

let user: HydratedDocument<IUser>
let liste: HydratedDocument<IShopList>
let item: HydratedDocument<IShopItem>
let item2: HydratedDocument<IShopItem>
let shopItemResource: ShopItemResource

beforeAll(async () => await DB.connect())
beforeEach(async () => {
    await User.syncIndexes()
    user = await User.create({ name: "Max", email: "max @doe.com", password: "123" });
    liste = await ShopList.create({ creator: user, store: "Lidl" })
    item = await ShopItem.create({ creator: user, shopList: liste, name: "Wasser", quantity: "22" })
    item2 = await ShopItem.create({ creator: user, shopList: liste, name: "H2O", quantity: "2" })
    shopItemResource = { quantity: "33", name: "Reis", creator: user.id, shopList: liste.id }
})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())

//getShopItem tests
test("getShopItem positive test", async () => {
    const res = await getShopItem(item.id)
    expect(res.creator).toBe(user.id)
    expect(res.creatorName).toBe(user.name)
    expect(res.shopList).toBe(liste.id)
    expect(res.shopListStore).toBe(liste.store)
})

test("getShopItem missing ID", async () => {
    var objectId = new Types.ObjectId('569ed8269353e9f4c51617aa');
    await expect(getShopItem(objectId.toString())).rejects.toThrow(`No shopItem with id ${objectId} found, cannot update`)
})

test("getShopItem missing ShopList", async () => {
    await ShopItem.deleteOne(item._id)
    await expect(getShopItem(item.id)).rejects.toThrow(`No shopItem with id ${item.id} found, cannot update`)
})

//createShopItem tests
test("createShopItem and check for created instances", async () => {
    const res = await createShopItem(shopItemResource)
    expect(res.id).not.toBe(undefined)
    expect(res.creator).toBe(user.id)
    expect(res.name).toBe("Reis")
    expect(res.createdAt).not.toBe(undefined)
    expect(res.shopList).toBe(liste.id)
})

test("createShopItem list is already done", async () => {
    const listeDone = await ShopList.create({ creator: user, store: "Lidl", done: true })
    let resource = { name: "Reis", quantity: "33",  creator: user.id, shopList: listeDone.id }
    await expect( createShopItem(resource)).rejects.toThrow(`List is already done`)
})

//updateShopList tests

test("positive test ", async () => {
    const res = await createShopItem(shopItemResource)
    expect(res.name).toBe("Reis")
    res.name = "Mais"
    await updateShopItem(res)
    expect(res.name).toBe("Mais")
})

test("missing shopItem", async () => {
    shopItemResource.id = "569ed8269353e9f4c51617aa"
    await expect(updateShopItem(shopItemResource)).rejects.toThrow(`No ShopList with id ${shopItemResource.id} found, cannot update`)
})

test(" missing ID ", async () => {
    shopItemResource.id = undefined
    await expect(updateShopItem(shopItemResource)).rejects.toThrow(`No id: ${shopItemResource.id} found, cannot update`)
})

test("changing a not editable field ", async () => {
    const res = await getShopItem(item.id)
    const userNew = await User.create({ name: "Maxi", email: "maxi@doe.com", password: "123" });
    expect(res.creator).toBe(user.id)
    res.creator = userNew.id
    const newRes = await updateShopItem(res)
    expect(newRes.creator).not.toBe(userNew.id)
    expect(newRes.creator).toBe(user.id)
})

//deleteShopItem tests

test("deleteShopItem eines existierenden items(positive)", async () => {
    await deleteShopItem(item.id)
    const res = await ShopItem.findById(item.id).exec();
    expect(res).toBeFalsy();
});

test("deleteShopList wrong deleteCount", async () => {
let id = "569ed8269353e9f4c51617aa"
    await expect(deleteShopItem(id)).rejects.toThrowError(`No ShopItem with id ${id} deleted, probably id not valid`)
})