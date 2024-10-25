import { HydratedDocument, ObjectId, Types } from "mongoose";
import { IUser, User } from "../../src/model/UserModel"
import DB from "../DB";
import { IShopList, ShopList } from "../../src/model/ShopListModel";
import { IShopItem, ShopItem } from "../../src/model/ShopItemModel";
import { getShopListItems } from "../../src/services/ShopListItemsService";
import { getShopItem } from "../../src/services/ShopItemService";


let user: HydratedDocument<IUser>
let liste: HydratedDocument<IShopList>
let unusedList: HydratedDocument<IShopList>
let item: HydratedDocument<IShopItem>
let item2: HydratedDocument<IShopItem>
let unusedItem: HydratedDocument<IShopItem>


beforeAll(async () => await DB.connect())
beforeEach(async () => {
    user = await User.create({ name: "Max", email: "max @doe.com", password: "123" });
    liste = await ShopList.create({ creator: user, store: "Lidl" })
    unusedList = await ShopList.create({ creator: user, store: "Schlecker" })
    item = await ShopItem.create({ creator: user, shopList: liste, name: "Wasser", quantity: "22" })
    item2 = await ShopItem.create({ creator: user, shopList: liste, name: "H2O", quantity: "2" })
    unusedItem = await ShopItem.create({ creator: user, shopList: unusedList, name: "Milch", quantity: "23" })

})
afterEach(async () => {
    await DB.clear();
})
afterAll(async () => await DB.close())

test("positive test", async () => {
    const res = await getShopListItems(liste.id)
    expect(res.shopItems.length).toBe(2)
    const res1 = await getShopItem(item.id)
    const res2 = await getShopItem(item2.id)
    const arr = [res1,res2]
    expect(res.shopItems).toEqual(arr)
})

test("negative test", async () => {
    let id = "569ed8269353e9f4c51617aa"
    await expect(getShopListItems(id)).rejects.toThrowError(`No ShopList with id ${id} found`)
})