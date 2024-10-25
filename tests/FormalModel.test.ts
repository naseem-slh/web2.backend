import { constants } from 'fs';
import { access } from "fs/promises";


test.each([
    "src/model/UserModel.ts",
    "src/model/ShopListModel.ts",
    "src/model/ShopItemModel.ts",
    "tests/DB.ts",
    "tests/model/UserModel.test.ts",
    "tests/model/ShopListModel.test.ts",
    "tests/model/ShopItemModel.test.ts",
])('File "%s" is present', async(filename) => {
    await access(filename, constants.R_OK)
});

test.each([
    "User", "ShopList", "ShopItem"
])('Model class "%s" defined and exported', async(domainClassName) => {
    const module = await import(`../src/model/${domainClassName}Model.ts`);
    const modelClass = module[domainClassName];
    expect(modelClass).toBeInstanceOf(Function);
});

