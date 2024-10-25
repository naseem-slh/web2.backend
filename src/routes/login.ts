import express from "express";
import { LoginResource } from "../Resources";
import { login } from "../services/AuthenticationService";
import { body, matchedData, param, validationResult } from "express-validator";
import { verifyPasswordAndCreateJWT } from "../services/JWTService";

// Implementierung wird Teil eines nächsten Aufgabenblattes.

const loginRouter = express.Router();

/**
 * Diese Funktion bitte noch nicht implementieren, sie steht hier als Platzhalter.
 * Wir benötigen dafür Authentifizierungsinformationen, die wir später in einem JSW speichern.
 */
loginRouter.post("/",
    body('email').isString().isLength({ min: 1, max: 100 }),
    body('password').isLength({ max: 100 }).isStrongPassword(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400)
                .json({ errors: errors.array() });
        }
        try {
            const loginResource = req.body as { email: string, password: string }
            const jwt = await verifyPasswordAndCreateJWT(loginResource.email, loginResource.password)
            if(!jwt)
            res.sendStatus(401)
            const correctLoginResource = {
                access_token: jwt,
                token_type: "Bearer"
            } as LoginResource
            res.status(200).send(correctLoginResource);
        } catch (err) {
            if (err instanceof Error) {
                const error = {
                    location: "body",
                    msg: err.message,
                }
                return res.status(400).json({ errors: [error] })
            }
        }
    })

export default loginRouter;