import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IUser, User } from "../../src/model/UserModel";
import { ShopItem, IShopItem } from "../../src/model/ShopItemModel";
import { log } from "console";
import { HydratedDocument, Types } from "mongoose";

let user: HydratedDocument<IUser>;
let list: HydratedDocument<IShopList>;
let item: HydratedDocument<IShopItem>;

beforeAll(async () => await DB.connect())
beforeEach(async () => {
    user = await User.create({ name: "John", email: "john@doe.com", password: "123" });
    list = await ShopList.create({ creator: user, store: "LIDL" });
    item = await ShopItem.create({ creator: user, shopList: list, name: "Wasser", quantity: "22" })
})
afterEach(async () => await DB.clear())
afterAll(async () => await DB.close())

test("addShopItem defined test", async () => {
    const item2 = new ShopItem({ creator: user, shopList: list, name: "Äpfel", quantity: "5" })
    const res = await item2.save()
    expect(res).toBeDefined();
})

test("Optional Remark", async () => {
    expect(item.remarks).toBe(undefined)
})

test("Missing required statement", async () => {
    const itemNoName = new ShopItem({ creator: user, shopList: list, quantity: "5" })
    const itemNoQuant = new ShopItem({ creator: user, shopList: list, name: "Books" })
    await expect(itemNoName.save()).rejects.toThrow(Error);
    await expect(itemNoQuant.save()).rejects.toThrow(Error);
})

test("Date check defined", async () => {
    expect(item.createdAt).toBeDefined()
})

test("Missing Reference statement", async () => {
    const item2 = new ShopItem({  shopList: list,name: "Books", quantity: "5" })
    const item3 = new ShopItem({  creator:user, shopList: list,name: "Books", quantity: "5" })

    await expect(item2.save()).rejects.toThrow(Error)
    await expect(item3.save()).resolves
})

test("retrieve Entry", async () => {
    const entryFound = await ShopItem.findOne({ name: "Wasser" }).exec();
    if (!entryFound) {
        throw new Error("Did not find previously created entry.")
    }
    expect(entryFound.shopList.valueOf()).toEqual(list._id.valueOf());
    expect(entryFound.name).toBe("Wasser");
})

test("updateOne and findeOne", async () => {
    const updateResult = await ShopItem.updateOne({ name:"Wasser",shopList: list._id }, { name: "Bücher" });
    expect(updateResult.matchedCount).toBe(1);
    expect(updateResult.modifiedCount).toBe(1);
    expect(updateResult.acknowledged).toBeTruthy();

    const u2 = await ShopItem.findOne({ name:"Bücher" }).exec();
    if (!u2) {
        throw new Error("ShopItem nicht gefunden")
    }
    expect(u2.name).toBe("Bücher");
})

test("Delete ShopItem", async () => {
    let myShopItemFound: HydratedDocument<IShopItem>[] = await ShopItem.find({ name:"Wasser",shopList: list._id }).exec();
    expect(myShopItemFound.length).toBe(1);
    item.deleteOne()
    myShopItemFound = await ShopItem.find({  name:"Wasser",shopList: list._id  }).exec();
    expect(myShopItemFound.length).toBe(0);
})

test("Type check of Creator", async () => {
    expect(item.creator._id).toBeInstanceOf(Types.ObjectId);
})

test("Type check of ShopList", async () => {
    expect(item.shopList._id).toBeInstanceOf(Types.ObjectId);
})

test("Same Item twice", async () => {
    const item2 = new ShopItem({  creator:user, shopList: list,name: "Fenster", quantity: "5" })
    const item3 = new ShopItem({  creator:user, shopList: list,name: "Books", quantity: "7" })
    const res = await item2.save()
    const res2 = await item3.save()
    expect(res).toBeDefined()
    expect(res2).toBeDefined()
})
