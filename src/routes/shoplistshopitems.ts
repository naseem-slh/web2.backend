// Vorlage für den Einstieg

import express from "express";
import { getShopListItems } from "../services/ShopListItemsService";
import { body, matchedData, param, validationResult } from "express-validator";
import { requiresAuthentication } from "./authentication";
import { getShopList } from "../services/ShopListService";

const shopListShopItemsRouter = express.Router();

shopListShopItemsRouter.get("/api/shoplist/:id/shopitems",
    requiresAuthentication,
    param('id').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() })
        }
        const id = req.params?.id;
        try {
            const shoplist = await getShopList(id)
            if (shoplist.public === true) {
                const shopItems = await getShopListItems(id);
                res.send(shopItems)
            }
            else if (shoplist.public === false && shoplist.creator == req.userId) {
                const shopItems = await getShopListItems(id);
                res.send(shopItems)
            }
            else
                throw Error("not authorized")
        } catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "param",
                    msg: err.message,
                }
                if (err.message === "not authorized")
                    return res.status(403).json({ errors: [error] });
                else
                    return res.status(404).json({ errors: [error] })
            }
        }
    })

export default shopListShopItemsRouter;