import express from "express";
import { getShopper } from "../services/ShopperService";
import { optionalAuthentication } from "./authentication";

const shopperRouter = express.Router()

shopperRouter.get("/",
    optionalAuthentication,
    async (req, res) => {
        let shopper
        if (req.userId !== undefined)
            shopper = await getShopper(req.userId)
        else
            shopper = await getShopper()
        res.send(shopper)
    })

export default shopperRouter