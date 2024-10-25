import { HydratedDocument, ObjectId, Types } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IShopItem, ShopItem } from "../../src/model/ShopItemModel";
import { getShopper } from "../../src/services/ShopperService";
import { deleteShopList, getShopList } from "../../src/services/ShopListService";
import { deleteUser } from "../../src/services/UsersService";
import { getShopItem } from "../../src/services/ShopItemService";


let max: HydratedDocument<IUser>
let john: HydratedDocument<IUser>
let lara: HydratedDocument<IUser>
let liste: HydratedDocument<IShopList>
let unusedList: HydratedDocument<IShopList>
let publicList: HydratedDocument<IShopList>
let publicUserList: HydratedDocument<IShopList>
let privateList: HydratedDocument<IShopList>
let item: HydratedDocument<IShopItem>
let item2: HydratedDocument<IShopItem>
let unusedItem: HydratedDocument<IShopItem>
let differentUserItem: HydratedDocument<IShopItem>





beforeAll(async () => await DB.connect())
beforeEach(async () => {
    //User
    max = await User.create({ name: "Max", email: "max @doe.com", password: "123" });
    john = await User.create({ name: "John", email: "john@doe.com", password: "123" });
    lara = await User.create({ name: "Lara", email: "lara@doe.com", password: "123" });

    //lists
    liste = await ShopList.create({ creator: max, store: "Lidl" })
    unusedList = await ShopList.create({ creator: max, store: "Schlecker" })
    publicUserList = await ShopList.create({ creator: max, store: "OBI", public: true })
    publicList = await ShopList.create({ creator: john, store: "IKEA", public: true })
    privateList = await ShopList.create({ creator: lara, store: "ALDI"})
    //items
    item = await ShopItem.create({ creator: max, shopList: liste, name: "Wasser", quantity: "22" })
    item2 = await ShopItem.create({ creator: john, shopList: publicList, name: "H2O", quantity: "2" })
    unusedItem = await ShopItem.create({ creator: max, shopList: unusedList, name: "Milch", quantity: "23" })
    differentUserItem = await ShopItem.create({ creator: lara, shopList: liste, name: "Honig", quantity: "23" })

})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())

test("deleteUser, deletes all dependet lists and items", async () => {
    await deleteUser(max.id)
    const res = await getShopper()
    const list4 = await getShopList(publicList.id)
    const arr = [list4]
    expect(res.shopLists.length).toBe(1)
    expect(res.shopLists).toEqual(arr)
    await expect(getShopItem(item.id)).rejects.toThrow(`No shopItem with id ${item.id} found, cannot update`)
    await expect(getShopItem(unusedItem.id)).rejects.toThrow(`No shopItem with id ${unusedItem.id} found, cannot update`)
    expect(await getShopItem(item2.id)).toBeDefined()
    expect((await (getShopItem(item2.id))).name).toBe("H2O")
})

test("deleteShopList, deletes all dependet lists and items", async () => {
    await deleteShopList(liste.id)
    await expect(getShopItem(item.id)).rejects.toThrow(`No shopItem with id ${item.id} found, cannot update`)
    await expect(getShopItem(differentUserItem.id)).rejects.toThrow(`No shopItem with id ${differentUserItem.id} found, cannot update`)
    expect((await (getShopItem(item2.id))).name).toBe("H2O")
})