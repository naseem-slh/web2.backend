import express from "express";
import { getUsers } from "../services/UsersService";
import { requiresAuthentication } from "./authentication";

// Aufbau: Vgl. Folie 119

const usersRouter = express.Router();

usersRouter.get("/",
    requiresAuthentication,
    async (req, res) => {
        try {
            if (req.role === "u")
                throw Error("no administration rights")
            const users = await getUsers();
            res.send(users)
        } catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "body",
                    msg: err.message,
                }
                return res.status(403).json({ errors: [error] })
            }
        }
    })

export default usersRouter;