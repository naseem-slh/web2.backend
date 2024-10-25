import { JwtPayload, sign, verify } from "jsonwebtoken"
import { login } from "./AuthenticationService";
import dotenv from "dotenv";
dotenv.config()


/**
 * Prüft Email und Passwort, bei Erfolg wird ein String mit einem JWT-Token zurückgegeben.
 *  
 * Die zur Unterzeichnung notwendige Passphrase wird aus der Umgebungsvariable `JWT_SECRET` gelesen,
 * falls diese nicht gesetzt ist, wird ein Fehler geworfen.
 * Die Zeitspanne, die das JWT gültig ist, also die 'Time To Live`, kurz TTL, wird der Umgebungsvariablen
 * `JWT_TTL` entnommen. Auch hier wird ein Fehler geworfen, falls diese Variable nicht gesetzt ist.
 * 
 * Wir schreiben die Rolle nur mit "u" oder "a" in das JWT, da wir nur diese beiden Rollen haben und 
 * wir das JWT so klein wie möglich halten wollen.
 * 
 * @param email E-Mail-Adresse des Users
 * @param password Das Passwort des Users
 * @returns JWT als String, im JWT ist sub gesetzt mit der Mongo-ID des Users als String sowie role mit "u" oder "a" (User oder Admin); 
 *      oder undefined wenn Authentifizierung fehlschlägt.
 */
export async function verifyPasswordAndCreateJWT(email: string, password: string): Promise<string | undefined> {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw Error("JWT_SECRET not set");
    }
    const ttl = Number(process.env.JWT_TTL)
    if (!ttl) {
        throw Error("JWT_TTL not set");
    }
    const loginRole = await login(email, password)
    if (!loginRole.success)
        return undefined
    const payload: JwtPayload = {
        sub: loginRole.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + ttl,
        role: loginRole.role
    }
    const jwtString = sign(payload, secret, { algorithm: "HS256" });
    return jwtString;
}

/**
 * Gibt user id (Mongo-ID) und ein Kürzel der Rolle zurück, falls Verifizierung erfolgreich, sonst wird ein Error geworfen.
 * 
 * Die zur Prüfung der Signatur notwendige Passphrase wird aus der Umgebungsvariable `JWT_SECRET` gelesen,
 * falls diese nicht gesetzt ist, wird ein Fehler geworfen.
 * 
 * @param jwtString das JWT
 * @return user id des Users (Mongo ID als String) und Rolle (u oder a) des Benutzers; 
 *      niemals undefined (bei Fehler wird ein Error geworfen)
 */
export function verifyJWT(jwtString: string | undefined): { userId: string, role: "u" | "a" } {
    type MyToken = {
        sub: string
        iat: number
        exp: number
        role: "u" | "a"
    }
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw Error("JWT_SECRET not set");
    }
    try {
        const decodedToken = verify(jwtString!, secret) as MyToken
        function verifyDecodedToken(data: unknown): asserts data is MyToken {
            if (!(data instanceof Object))
                throw new Error('Decoded token error. Token must be an object')
            if (!('sub' in data))
                throw new Error('Decoded token error. Missing required field "sub"')
            if (!('role' in data))
                throw new Error('Decoded token error. Missing required field "roles"')
            if (!data.sub)
                throw new Error('Decoded token error. "sub" field is undefined')
            if (!data.role)
                throw new Error('Decoded token error. "role" field is undefined')
        }
        verifyDecodedToken(decodedToken)
        return { userId: decodedToken.sub, role: decodedToken.role }
    } catch (err) {
        // in case of any error
    }
    throw new Error("invalid_token");
}
